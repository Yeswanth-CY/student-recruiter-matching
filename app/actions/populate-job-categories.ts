"use server"

import { getServerClient } from "@/lib/supabase"
import { jobCategories } from "@/lib/matching-config"
import { revalidatePath } from "next/cache"

export async function populateJobCategories() {
  try {
    const supabase = getServerClient()

    // Get all jobs
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, job_role, job_description, skills_required")

    if (jobsError) {
      throw jobsError
    }

    if (!jobs || jobs.length === 0) {
      return { success: true, message: "No jobs found to categorize", jobsUpdated: 0 }
    }

    let updatedCount = 0

    // Process each job
    for (const job of jobs) {
      // Determine job category
      const jobText = `${job.job_role} ${job.job_description}`.toLowerCase()
      let categoryId = "default"

      for (const category of jobCategories) {
        if (category.id === "default") continue

        if (category.keywords.some((keyword) => jobText.includes(keyword.toLowerCase()))) {
          categoryId = category.id
          break
        }
      }

      // Update job with category
      const { error: updateError } = await supabase.from("jobs").update({ category: categoryId }).eq("id", job.id)

      if (!updateError) {
        updatedCount++
      }
    }

    // Revalidate paths
    revalidatePath("/analytics")

    return {
      success: true,
      message: `Updated categories for ${updatedCount} jobs`,
      jobsUpdated: updatedCount,
    }
  } catch (error) {
    console.error("Error populating job categories:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
