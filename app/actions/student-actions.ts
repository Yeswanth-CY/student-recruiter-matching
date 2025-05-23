"use server"

import { getServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function addStudent(formData: FormData) {
  try {
    const supabase = getServerClient()

    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const college = formData.get("college") as string
    const score_12th = Number.parseFloat(formData.get("score_12th") as string)
    const score_10th = Number.parseFloat(formData.get("score_10th") as string)
    const resume_score = Number.parseInt(formData.get("resume_score") as string)
    const xp_points = Number.parseInt(formData.get("xp_points") as string)
    const skillsString = formData.get("skills") as string
    const skills = skillsString.split(",").map((skill) => skill.trim())

    const { data, error } = await supabase
      .from("students")
      .insert({
        name,
        email,
        college,
        score_12th,
        score_10th,
        resume_score,
        xp_points,
        skills,
      })
      .select()

    if (error) {
      return { success: false, error: error.message }
    }

    // After adding a student, run the matching algorithm
    await matchStudentWithJobs(data[0].id)

    revalidatePath("/students")
    revalidatePath("/matches")

    return { success: true, data }
  } catch (error) {
    console.error("Error adding student:", error)
    return { success: false, error: "Failed to add student" }
  }
}

async function matchStudentWithJobs(studentId: string) {
  try {
    const supabase = getServerClient()

    // Get the student
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .single()

    if (studentError) throw studentError

    // Get all jobs
    const { data: jobs, error: jobsError } = await supabase.from("jobs").select("*")

    if (jobsError) throw jobsError

    // For each job, calculate match score and create a match record
    for (const job of jobs) {
      const matchingSkills = student.skills.filter((skill) => job.skills_required.includes(skill))

      const missingSkills = job.skills_required.filter((skill) => !student.skills.includes(skill))

      // Calculate match score (percentage of required skills that match)
      const matchScore = (matchingSkills.length / job.skills_required.length) * 100

      // Create a match record
      const { error: matchError } = await supabase.from("matches").upsert({
        student_id: student.id,
        job_id: job.id,
        matching_skills: matchingSkills,
        missing_skills: missingSkills,
        match_score: matchScore,
        email_sent: false,
      })

      if (matchError) throw matchError
    }

    return { success: true }
  } catch (error) {
    console.error("Error matching student with jobs:", error)
    return { success: false, error: "Failed to match student with jobs" }
  }
}
