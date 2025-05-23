"use server"

import { getServerClient } from "@/lib/supabase"
import { determineJobCategory } from "@/lib/matching-config"
import { revalidatePath } from "next/cache"

export async function updateJobCategories() {
  try {
    const supabase = getServerClient()

    // Get all jobs
    const { data: jobs, error: jobsError } = await supabase.from("jobs").select("*")

    if (jobsError) {
      throw jobsError
    }

    let updatedCount = 0

    // Process each job
    for (const job of jobs) {
      // Determine job category
      const category = determineJobCategory(job.job_role, job.job_description)

      // Update job with category if needed
      if (!job.category || job.category !== category.id) {
        const { error: updateError } = await supabase.from("jobs").update({ category: category.id }).eq("id", job.id)

        if (!updateError) {
          updatedCount++
        }
      }
    }

    // Update matches to ensure they have the correct job category
    const { data: matches, error: matchesError } = await supabase.from("matches").select("id, job_id, job_category")

    if (matchesError) {
      throw matchesError
    }

    let matchesUpdated = 0

    for (const match of matches) {
      // Get the job
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("category")
        .eq("id", match.job_id)
        .single()

      if (jobError || !job) continue

      // If job category doesn't match the one in the match record, update it
      if (job.category && match.job_category !== job.category) {
        const { error: updateError } = await supabase
          .from("matches")
          .update({ job_category: job.category })
          .eq("id", match.id)

        if (!updateError) {
          matchesUpdated++
        }
      }
    }

    // Revalidate relevant paths
    revalidatePath("/analytics")
    revalidatePath("/matches")

    return {
      success: true,
      jobsUpdated: updatedCount,
      matchesUpdated,
    }
  } catch (error) {
    console.error("Error updating job categories:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
