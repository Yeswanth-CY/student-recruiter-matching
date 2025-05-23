"use server"

import { getServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function addRecruiter(formData: FormData) {
  try {
    const supabase = getServerClient()

    const company_name = formData.get("company_name") as string
    const email = formData.get("email") as string
    const job_role = formData.get("job_role") as string
    const job_description = formData.get("job_description") as string
    const salary = Number.parseInt(formData.get("salary") as string)
    const skillsString = formData.get("skills_required") as string
    const skills_required = skillsString.split(",").map((skill) => skill.trim())
    const job_apply_link = formData.get("job_apply_link") as string

    const { data, error } = await supabase
      .from("recruiters")
      .insert({
        company_name,
        email,
        job_role,
        job_description,
        salary,
        skills_required,
        job_apply_link,
      })
      .select()

    if (error) {
      return { success: false, error: error.message }
    }

    // After adding a recruiter, run the matching algorithm for all students
    await matchRecruiterWithStudents(data[0].id)

    revalidatePath("/recruiters")
    revalidatePath("/matches")

    return { success: true, data }
  } catch (error) {
    console.error("Error adding recruiter:", error)
    return { success: false, error: "Failed to add recruiter" }
  }
}

async function matchRecruiterWithStudents(recruiterId: string) {
  try {
    const supabase = getServerClient()

    // Get the recruiter
    const { data: recruiter, error: recruiterError } = await supabase
      .from("recruiters")
      .select("*")
      .eq("id", recruiterId)
      .single()

    if (recruiterError) throw recruiterError

    // Get all students
    const { data: students, error: studentsError } = await supabase.from("students").select("*")

    if (studentsError) throw studentsError

    // For each student, calculate match score and create a match record
    for (const student of students) {
      const matchingSkills = student.skills.filter((skill) => recruiter.skills_required.includes(skill))

      const missingSkills = recruiter.skills_required.filter((skill) => !student.skills.includes(skill))

      // Calculate match score (percentage of required skills that match)
      const matchScore = (matchingSkills.length / recruiter.skills_required.length) * 100

      // Create a match record
      const { error: matchError } = await supabase.from("matches").upsert({
        student_id: student.id,
        recruiter_id: recruiter.id,
        matching_skills: matchingSkills,
        missing_skills: missingSkills,
        match_score: matchScore,
        email_sent: false,
      })

      if (matchError) throw matchError
    }

    return { success: true }
  } catch (error) {
    console.error("Error matching recruiter with students:", error)
    return { success: false, error: "Failed to match recruiter with students" }
  }
}
