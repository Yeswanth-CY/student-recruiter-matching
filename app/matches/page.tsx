import { getServerClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, PieChart, Mail, CheckCircle } from "lucide-react"
import Link from "next/link"
import { jobCategories } from "@/lib/matching-config"

export const revalidate = 0

export default async function MatchesPage() {
  const supabase = getServerClient()

  // First, get all matches
  const { data: matches, error } = await supabase.from("matches").select("*").order("match_score", { ascending: false })

  if (error) {
    console.error("Error fetching matches:", error)
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">Matches</h1>
        <p className="text-red-500">Error loading matches: {error.message}</p>
      </div>
    )
  }

  // If we have matches, get the related student and job data
  const matchesWithDetails = []

  if (matches && matches.length > 0) {
    for (const match of matches) {
      // Get student data
      const { data: student } = await supabase.from("students").select("*").eq("id", match.student_id).single()

      // Get job data
      const { data: job } = await supabase.from("jobs").select("*").eq("id", match.job_id).single()

      // Add to our array
      if (student && job) {
        // Find the job category object
        const category =
          jobCategories.find((cat) => cat.id === match.job_category) || jobCategories[jobCategories.length - 1]

        matchesWithDetails.push({
          ...match,
          student,
          job,
          category,
        })
      }
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Personalized Job Recommendations</h1>
        <div className="flex gap-3">
          <Link href="/match">
            <Button className="flex items-center">
              <RefreshCw className="mr-2 h-4 w-4" />
              Run Matching Algorithm
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800 text-sm mb-6">
        <p className="font-medium">Preview Mode Notice</p>
        <p>
          In this preview environment, emails are simulated and not actually sent. In a production environment, real
          emails would be sent to students.
        </p>
      </div>

      {matchesWithDetails.length === 0 ? (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">No matches found yet.</p>
              <Link href="/match">
                <Button>Run Matching Algorithm</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {matchesWithDetails.map((match) => (
            <Card key={match.id} className={match.match_score >= 70 ? "border-green-500" : ""}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Match Score: {match.match_score.toFixed(1)}%</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-100">
                      {match.category.name}
                    </Badge>
                    {match.email_sent && (
                      <Badge variant="outline" className="bg-green-100 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" /> Email Queued
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {match.student?.name} ↔ {match.job?.job_role} at {match.job?.company_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Score breakdown */}
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <PieChart className="h-4 w-4 mr-1" /> Score Breakdown
                    </h3>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-green-100 p-2 rounded-md">
                        <div className="font-medium">Skills</div>
                        <div className="text-green-700">{match.skill_match_percentage?.toFixed(1)}%</div>
                        <div className="text-gray-500 text-xs">
                          Weight: {(match.category.weights.skillMatch * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="bg-blue-100 p-2 rounded-md">
                        <div className="font-medium">Academic</div>
                        <div className="text-blue-700">{match.academic_contribution?.toFixed(1)}%</div>
                        <div className="text-gray-500 text-xs">
                          Weight: {(match.category.weights.academicPerformance * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="bg-purple-100 p-2 rounded-md">
                        <div className="font-medium">Experience</div>
                        <div className="text-purple-700">{match.experience_contribution?.toFixed(1)}%</div>
                        <div className="text-gray-500 text-xs">
                          Weight: {(match.category.weights.experience * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Matching Skills:</h3>
                    <div className="flex flex-wrap gap-2">
                      {match.matching_skills &&
                        match.matching_skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="bg-green-100">
                            {skill}
                          </Badge>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Skills to Develop:</h3>
                    <div className="flex flex-wrap gap-2">
                      {match.missing_skills &&
                        match.missing_skills.map((skill, index) => (
                          <Badge key={index} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Student:</h3>
                      <p className="text-sm">{match.student?.name}</p>
                      <p className="text-sm text-muted-foreground">{match.student?.college}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="h-3 w-3 mr-1" /> {match.student_email || match.student?.email}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Job:</h3>
                      <p className="text-sm">{match.job?.job_role}</p>
                      <p className="text-sm text-muted-foreground">{match.job?.company_name}</p>
                      <p className="text-sm text-muted-foreground">${match.job?.salary.toLocaleString()}/year</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                {match.job?.job_apply_link && (
                  <a href={match.job.job_apply_link} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Job Application
                    </Button>
                  </a>
                )}
                <form action="/api/simulate-email" method="post" className="flex-1">
                  <input type="hidden" name="matchId" value={match.id} />
                  <Button type="submit" variant="outline" className="w-full flex items-center">
                    <Mail className="h-4 w-4 mr-2" /> Simulate Email
                  </Button>
                </form>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
