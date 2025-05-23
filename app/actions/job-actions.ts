"use server"

import { getServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { determineJobCategory } from "@/lib/matching-config"

export async function addJob(formData: FormData) {
  try {
    const supabase = getServerClient()

    const company_name = formData.get("company_name") as string
    const job_role = formData.get("job_role") as string
    const job_description = formData.get("job_description") as string
    const salary = Number.parseInt(formData.get("salary") as string)
    const skillsString = formData.get("skills_required") as string
    const skills_required = skillsString.split(",").map((skill) => skill.trim())
    const job_apply_link = formData.get("job_apply_link") as string

    // Determine job category based on job role and description
    const jobCategory = determineJobCategory(job_role, job_description)

    const { data, error } = await supabase
      .from("jobs")
      .insert({
        company_name,
        job_role,
        job_description,
        salary,
        skills_required,
        job_apply_link,
        category: jobCategory.id, // Set the category field
      })
      .select()

    if (error) {
      return { success: false, error: error.message }
    }

    // After adding a job, run the matching algorithm for all students
    await matchJobWithStudents(data[0].id)

    revalidatePath("/recruiters")
    revalidatePath("/matches")
    revalidatePath("/analytics")

    return { success: true, data }
  } catch (error) {
    console.error("Error adding job:", error)
    return { success: false, error: "Failed to add job" }
  }
}

async function matchJobWithStudents(jobId: string) {
  try {
    const supabase = getServerClient()

    // Get the job
    const { data: job, error: jobError } = await supabase.from("jobs").select("*").eq("id", jobId).single()

    if (jobError) throw jobError

    // Get all students
    const { data: students, error: studentsError } = await supabase.from("students").select("*")

    if (studentsError) throw studentsError

    // For each student, calculate match score and create a match record
    for (const student of students) {
      const matchingSkills = student.skills.filter((skill) => job.skills_required.includes(skill))

      const missingSkills = job.skills_required.filter((skill) => !student.skills.includes(skill))

      // Calculate match score (percentage of required skills that match)
      const matchScore = (matchingSkills.length / job.skills_required.length) * 100

      // Create a match record
      const { error: matchError } = await supabase.from("matches").upsert({
        student_id: student.id,
        job_id: job.id,
        student_email: student.email,
        matching_skills: matchingSkills,
        missing_skills: missingSkills,
        match_score: matchScore,
        email_sent: false,
        job_category: job.category || determineJobCategory(job.job_role, job.job_description).id,
      })

      if (matchError) throw matchError
    }

    return { success: true }
  } catch (error) {
    console.error("Error matching job with students:", error)
    return { success: false, error: "Failed to match job with students" }
  }
}
