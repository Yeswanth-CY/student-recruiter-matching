import Link from "next/link"
import { getServerClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Job } from "@/types"

export const revalidate = 0

export default async function RecruitersPage() {
  const supabase = getServerClient()
  const { data: jobs, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching jobs:", error)
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">Job Postings</h1>
        <p className="text-red-500">Error loading job postings: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Job Postings</h1>
        <Link href="/recruiters/add">
          <Button>Add Job Posting</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs && jobs.length > 0 ? (
          jobs.map((job: Job) => (
            <Card key={job.id}>
              <CardHeader>
                <CardTitle>{job.job_role}</CardTitle>
                <CardDescription>{job.company_name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Job Description:</h3>
                    <p className="text-sm">{job.job_description}</p>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Salary:</span>
                    <span>${job.salary.toLocaleString()}/year</span>
                  </div>

                  <div>
                    <span className="text-sm text-muted-foreground block mb-2">Required Skills:</span>
                    <div className="flex flex-wrap gap-2">
                      {job.skills_required.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <a href={job.job_apply_link} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button variant="outline" className="w-full">
                    Apply Now
                  </Button>
                </a>
              </CardFooter>
            </Card>
          ))
        ) : (
          <p className="col-span-full text-center text-muted-foreground">
            No job postings found. Add a job posting to get started.
          </p>
        )}
      </div>
    </div>
  )
}
