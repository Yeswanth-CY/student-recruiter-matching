import Link from "next/link"
import { getServerClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Users, Briefcase, Sparkles, RefreshCw, BarChart } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = getServerClient()

  // Get counts
  const { count: studentCount } = await supabase.from("students").select("*", { count: "exact", head: true })

  const { count: jobCount } = await supabase.from("jobs").select("*", { count: "exact", head: true })

  const { count: matchCount } = await supabase.from("matches").select("*", { count: "exact", head: true })

  // Get top matches
  const { data: topMatchesRaw } = await supabase
    .from("matches")
    .select("*")
    .order("match_score", { ascending: false })
    .limit(5)

  // Get related data for top matches
  const topMatches = []

  if (topMatchesRaw && topMatchesRaw.length > 0) {
    for (const match of topMatchesRaw) {
      // Get student name
      const { data: student } = await supabase.from("students").select("name").eq("id", match.student_id).single()

      // Get job data
      const { data: job } = await supabase.from("jobs").select("company_name, job_role").eq("id", match.job_id).single()

      if (student && job) {
        // Add to our array
        topMatches.push({
          ...match,
          student,
          job,
        })
      }
    }
  }

  // Calculate average match score
  const { data: matchScores } = await supabase.from("matches").select("match_score")
  const avgMatchScore =
    matchScores && matchScores.length > 0
      ? matchScores.reduce((sum, match) => sum + Number(match.match_score), 0) / matchScores.length
      : 0

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Student Job Matching System</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentCount || 0}</div>
          </CardContent>
          <CardFooter>
            <Link href="/students" className="text-sm text-muted-foreground flex items-center">
              View all students
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Job Postings</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobCount || 0}</div>
          </CardContent>
          <CardFooter>
            <Link href="/recruiters" className="text-sm text-muted-foreground flex items-center">
              View all job postings
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matchCount || 0}</div>
          </CardContent>
          <CardFooter>
            <Link href="/matches" className="text-sm text-muted-foreground flex items-center">
              View all matches
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Match Score</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMatchScore.toFixed(1)}%</div>
          </CardContent>
          <CardFooter>
            <Link href="/analytics" className="text-sm text-muted-foreground flex items-center">
              View analytics
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Top Matches</CardTitle>
            <CardDescription>Students with the highest match scores</CardDescription>
          </CardHeader>
          <CardContent>
            {topMatches && topMatches.length > 0 ? (
              <div className="space-y-4">
                {topMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{match.student?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {match.job?.job_role} at {match.job?.company_name}
                      </p>
                    </div>
                    <Badge variant="secondary">{match.match_score.toFixed(1)}%</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No matches found yet</p>
            )}
          </CardContent>
          <CardFooter>
            <Link href="/matches">
              <Button variant="outline">View All Matches</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/students/add">
              <Button className="w-full">Add New Student</Button>
            </Link>
            <Link href="/recruiters/add">
              <Button className="w-full" variant="outline">
                Add New Job Posting
              </Button>
            </Link>
            <Link href="/match">
              <Button className="w-full" variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Run Matching Algorithm
              </Button>
            </Link>
            <Link href="/analytics">
              <Button className="w-full" variant="outline">
                <BarChart className="mr-2 h-4 w-4" />
                View Analytics & Insights
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
