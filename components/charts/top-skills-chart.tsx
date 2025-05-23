"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { jobCategories } from "@/lib/matching-config"
import { getBrowserClient } from "@/lib/supabase"

export function TopSkillsChart() {
  const [categorySkills, setCategorySkills] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCategorySkills() {
      try {
        const supabase = getBrowserClient()

        // First, let's check if we have jobs with categories
        const { data: jobsWithCategories, error: categoryError } = await supabase
          .from("jobs")
          .select("category")
          .not("category", "is", null)

        if (categoryError) {
          console.error("Error fetching job categories:", categoryError)
          setError("Error fetching job categories")
          setLoading(false)
          return
        }

        // If we don't have any jobs with categories, we need to update them first
        if (!jobsWithCategories || jobsWithCategories.length === 0) {
          console.log("No jobs with categories found. Categorizing jobs...")

          // Get all jobs
          const { data: allJobs, error: jobsError } = await supabase
            .from("jobs")
            .select("id, job_role, job_description, skills_required")

          if (jobsError) {
            console.error("Error fetching jobs:", jobsError)
            setError("Error fetching jobs")
            setLoading(false)
            return
          }

          if (!allJobs || allJobs.length === 0) {
            console.log("No jobs found in database")
            setLoading(false)
            return
          }

          // Categorize jobs and collect skills by category
          const skillsByCategory: Record<string, Set<string>> = {}

          // Initialize categories
          jobCategories.forEach((category) => {
            skillsByCategory[category.id] = new Set()
          })

          // Process each job
          for (const job of allJobs) {
            // Determine category
            const jobText = `${job.job_role} ${job.job_description}`.toLowerCase()
            let categoryId = "default"

            for (const category of jobCategories) {
              if (category.id === "default") continue

              if (category.keywords.some((keyword) => jobText.includes(keyword.toLowerCase()))) {
                categoryId = category.id
                break
              }
            }

            // Add skills to this category
            if (job.skills_required && job.skills_required.length > 0) {
              job.skills_required.forEach((skill) => {
                skillsByCategory[categoryId].add(skill)
              })
            }

            // Update job category in database (but don't wait for it)
            supabase
              .from("jobs")
              .update({ category: categoryId })
              .eq("id", job.id)
              .then(({ error }) => {
                if (error) console.error("Error updating job category:", error)
              })
          }

          // Convert sets to arrays
          const result: Record<string, string[]> = {}
          Object.entries(skillsByCategory).forEach(([categoryId, skillsSet]) => {
            result[categoryId] = Array.from(skillsSet).slice(0, 5)
          })

          setCategorySkills(result)
          setLoading(false)
          return
        }

        // If we have jobs with categories, fetch skills by category
        const result: Record<string, string[]> = {}

        // Initialize all categories with empty arrays
        jobCategories.forEach((category) => {
          result[category.id] = []
        })

        // For each category, get the skills from jobs
        for (const category of jobCategories) {
          const { data: categoryJobs, error: jobsError } = await supabase
            .from("jobs")
            .select("skills_required")
            .eq("category", category.id)

          if (jobsError) {
            console.error(`Error fetching jobs for category ${category.id}:`, jobsError)
            continue
          }

          if (!categoryJobs || categoryJobs.length === 0) {
            // If no jobs in this category, try to find jobs that might belong to this category
            const { data: potentialJobs, error: potentialError } = await supabase
              .from("jobs")
              .select("id, job_role, job_description, skills_required")
              .or(`category.is.null,category.eq.''`)

            if (potentialError || !potentialJobs || potentialJobs.length === 0) {
              continue
            }

            // Find jobs that match this category
            const matchingJobs = potentialJobs.filter((job) => {
              const jobText = `${job.job_role} ${job.job_description}`.toLowerCase()
              return category.keywords.some((keyword) => jobText.includes(keyword.toLowerCase()))
            })

            // Update these jobs with the correct category
            for (const job of matchingJobs) {
              await supabase.from("jobs").update({ category: category.id }).eq("id", job.id)

              // Add skills to this category
              if (job.skills_required && job.skills_required.length > 0) {
                job.skills_required.forEach((skill) => {
                  if (!result[category.id].includes(skill)) {
                    result[category.id].push(skill)
                  }
                })
              }
            }

            continue
          }

          // Count skill frequency
          const skillFrequency: Record<string, number> = {}

          categoryJobs.forEach((job) => {
            if (job.skills_required && job.skills_required.length > 0) {
              job.skills_required.forEach((skill) => {
                skillFrequency[skill] = (skillFrequency[skill] || 0) + 1
              })
            }
          })

          // Get top 5 skills by frequency
          result[category.id] = Object.entries(skillFrequency)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 5)
            .map(([skill]) => skill)
        }

        setCategorySkills(result)
      } catch (error) {
        console.error("Error in fetchCategorySkills:", error)
        setError("Error fetching skills data")
      } finally {
        setLoading(false)
      }
    }

    fetchCategorySkills()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading skills data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  // For debugging
  console.log("Category skills:", categorySkills)

  return (
    <div className="grid grid-cols-2 gap-4 h-full overflow-y-auto">
      {jobCategories.map((category) => (
        <Card key={category.id} className="overflow-hidden">
          <CardContent className="p-4">
            <h3 className="font-medium text-sm mb-2">{category.name}</h3>
            <div className="flex flex-wrap gap-2">
              {categorySkills[category.id]?.length > 0 ? (
                categorySkills[category.id].map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
