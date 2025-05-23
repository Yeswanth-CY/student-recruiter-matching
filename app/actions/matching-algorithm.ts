"use server"

import { getServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { determineJobCategory, calculateWeightedMatchScore } from "@/lib/matching-config"

interface MatchResult {
  success: boolean
  matchesCreated?: number
  emailsQueued?: number
  error?: string
}

export async function runSkillMatchingAlgorithm(): Promise<MatchResult> {
  try {
    const supabase = getServerClient()

    // Get all students
    const { data: students, error: studentsError } = await supabase.from("students").select("*")
    if (studentsError) throw studentsError

    // Get all jobs
    const { data: jobs, error: jobsError } = await supabase.from("jobs").select("*")
    if (jobsError) throw jobsError

    let matchesCreated = 0
    let emailsQueued = 0

    // For each student, find matching jobs
    for (const student of students) {
      // For each job, calculate match score
      for (const job of jobs) {
        // Calculate primary matching score based on skills
        const matchingSkills = student.skills.filter((skill) =>
          job.skills_required.some((requiredSkill) => requiredSkill.toLowerCase() === skill.toLowerCase()),
        )

        const missingSkills = job.skills_required.filter(
          (requiredSkill) => !student.skills.some((skill) => skill.toLowerCase() === requiredSkill.toLowerCase()),
        )

        // Calculate the percentage of required skills that match
        const baseSkillMatchPercentage =
          job.skills_required.length > 0 ? (matchingSkills.length / job.skills_required.length) * 100 : 0

        // Determine job category - use the one from the database if available, otherwise determine it
        const jobCategoryId = job.category || determineJobCategory(job.job_role, job.job_description).id

        // If job doesn't have a category set, update it
        if (!job.category) {
          await supabase.from("jobs").update({ category: jobCategoryId }).eq("id", job.id)
        }

        // Find the job category object
        const jobCategory = jobCategoryId
          ? jobCategories.find((cat) => cat.id === jobCategoryId) || jobCategories[jobCategories.length - 1]
          : determineJobCategory(job.job_role, job.job_description)

        // Calculate academic score (average of 10th and 12th scores)
        const academicScore = (student.score_10th + student.score_12th + student.resume_score) / 3

        // Calculate weighted match score
        const finalMatchScore = calculateWeightedMatchScore({
          baseSkillMatchPercentage,
          academicScore,
          experiencePoints: student.xp_points,
          studentSkills: student.skills,
          jobRequiredSkills: job.skills_required,
          jobCategory,
        })

        // Only store matches with a score of at least 20%
        if (finalMatchScore >= 20) {
          // Store the match in the database along with the job category and student email
          const { data: matchData, error: insertError } = await supabase.from("matches").upsert(
            {
              student_id: student.id,
              job_id: job.id,
              student_email: student.email, // Store student email in matches table
              matching_skills: matchingSkills,
              missing_skills: missingSkills,
              match_score: finalMatchScore,
              email_sent: true, // Mark as sent since we're simulating email sending
              job_category: jobCategoryId,
              skill_match_percentage: baseSkillMatchPercentage,
              academic_contribution: academicScore * jobCategory.weights.academicPerformance,
              experience_contribution: Math.min((student.xp_points / 500) * 100, 100) * jobCategory.weights.experience,
            },
            {
              onConflict: "student_id,job_id",
              returning: "minimal",
            },
          )

          if (insertError) throw insertError
          matchesCreated++
          emailsQueued++

          // In a production environment, we would send an actual email here
          // For now, we're just simulating the email sending process
          console.log(`[SIMULATED EMAIL] Match email queued for ${student.email} about job: ${job.job_role}`)
        }
      }
    }

    // Revalidate the matches page to show updated results
    revalidatePath("/matches")
    revalidatePath("/dashboard")
    revalidatePath("/analytics")

    return {
      success: true,
      matchesCreated,
      emailsQueued,
    }
  } catch (error) {
    console.error("Error running matching algorithm:", error)
    return {
      success: false,
      error: "Failed to run matching algorithm: " + (error instanceof Error ? error.message : String(error)),
    }
  }
}

// Import jobCategories to use in the function
import { jobCategories } from "@/lib/matching-config"
