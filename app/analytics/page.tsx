import { getServerClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, Minus, Briefcase, Sparkles, TrendingUp, Award, RefreshCw, Database } from "lucide-react"
import { jobCategories } from "@/lib/matching-config"
import { SkillsDistributionChart } from "@/components/charts/skills-distribution-chart"
import { MatchScoreDistributionChart } from "@/components/charts/match-score-distribution-chart"
import { CategoryPerformanceChart } from "@/components/charts/category-performance-chart"
import { TopSkillsChart } from "@/components/charts/top-skills-chart"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const revalidate = 0

export default async function AnalyticsPage() {
  const supabase = getServerClient()

  // Get basic counts
  const { count: studentCount } = await supabase.from("students").select("*", { count: "exact", head: true })
  const { count: jobCount } = await supabase.from("jobs").select("*", { count: "exact", head: true })
  const { count: matchCount } = await supabase.from("matches").select("*", { count: "exact", head: true })

  // Get match statistics
  const { data: matchStats } = await supabase.from("matches").select("match_score, job_category")

  // Calculate average match score
  const avgMatchScore =
    matchStats && matchStats.length > 0
      ? matchStats.reduce((sum, match) => sum + Number(match.match_score), 0) / matchStats.length
      : 0

  // Get high match count (matches with score >= 70%)
  const highMatchCount = matchStats ? matchStats.filter((match) => Number(match.match_score) >= 70).length : 0

  // Get low match count (matches with score < 40%)
  const lowMatchCount = matchStats ? matchStats.filter((match) => Number(match.match_score) < 40).length : 0

  // Calculate match rate (percentage of possible student-job combinations that resulted in matches)
  const possibleMatches = (studentCount || 0) * (jobCount || 0)
  const matchRate = possibleMatches > 0 ? ((matchCount || 0) / possibleMatches) * 100 : 0

  // Get category distribution
  const categoryDistribution = matchStats
    ? jobCategories.map((category) => {
        const count = matchStats.filter((match) => match.job_category === category.id).length
        const avgScore =
          matchStats
            .filter((match) => match.job_category === category.id)
            .reduce((sum, match) => sum + Number(match.match_score), 0) / (count || 1)

        return {
          id: category.id,
          name: category.name,
          count,
          percentage: matchStats.length > 0 ? (count / matchStats.length) * 100 : 0,
          avgScore,
        }
      })
    : []

  // Sort categories by count
  categoryDistribution.sort((a, b) => b.count - a.count)

  // Get all students with their skills
  const { data: students } = await supabase.from("students").select("skills")

  // Get all jobs with their required skills
  const { data: jobs } = await supabase.from("jobs").select("skills_required")

  // Collect all skills and count their frequency
  const skillsFrequency: Record<string, { student: number; job: number }> = {}

  students?.forEach((student) => {
    student.skills.forEach((skill) => {
      if (!skillsFrequency[skill]) {
        skillsFrequency[skill] = { student: 0, job: 0 }
      }
      skillsFrequency[skill].student++
    })
  })

  jobs?.forEach((job) => {
    job.skills_required.forEach((skill) => {
      if (!skillsFrequency[skill]) {
        skillsFrequency[skill] = { student: 0, job: 0 }
      }
      skillsFrequency[skill].job++
    })
  })

  // Get top skills (by total frequency)
  const topSkills = Object.entries(skillsFrequency)
    .map(([skill, { student, job }]) => ({
      skill,
      student,
      job,
      total: student + job,
      gap: student - job,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // Get skill gaps (skills most in demand but least available)
  const skillGaps = Object.entries(skillsFrequency)
    .map(([skill, { student, job }]) => ({
      skill,
      student,
      job,
      gap: student - job,
    }))
    .filter((item) => item.job > 0) // Only consider skills that are actually required by jobs
    .sort((a, b) => a.gap - b.gap) // Sort by gap (negative gap means more demand than supply)
    .slice(0, 5)

  // Get match score distribution
  const matchScoreDistribution = [
    { range: "0-20%", count: matchStats ? matchStats.filter((m) => Number(m.match_score) < 20).length : 0 },
    {
      range: "20-40%",
      count: matchStats
        ? matchStats.filter((m) => Number(m.match_score) >= 20 && Number(m.match_score) < 40).length
        : 0,
    },
    {
      range: "40-60%",
      count: matchStats
        ? matchStats.filter((m) => Number(m.match_score) >= 40 && Number(m.match_score) < 60).length
        : 0,
    },
    {
      range: "60-80%",
      count: matchStats
        ? matchStats.filter((m) => Number(m.match_score) >= 60 && Number(m.match_score) < 80).length
        : 0,
    },
    { range: "80-100%", count: matchStats ? matchStats.filter((m) => Number(m.match_score) >= 80).length : 0 },
  ]

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Analytics & Insights</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Match Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMatchScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Average score across all student-job matches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Match Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highMatchCount}</div>
            <p className="text-xs text-muted-foreground">Matches with score of 70% or higher</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Match Coverage</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matchRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Percentage of possible student-job combinations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Job Category</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categoryDistribution.length > 0 ? categoryDistribution[0].name : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {categoryDistribution.length > 0
                ? `${categoryDistribution[0].percentage.toFixed(1)}% of all matches`
                : "No data"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
          <TabsTrigger value="categories">Job Categories</TabsTrigger>
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Match Score Distribution</CardTitle>
                <CardDescription>Distribution of match scores across all student-job pairs</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <MatchScoreDistributionChart data={matchScoreDistribution} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Category Performance</CardTitle>
                <CardDescription>Average match scores by job category</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <CategoryPerformanceChart data={categoryDistribution} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="skills">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Skills Distribution</CardTitle>
                <CardDescription>Comparison of student skills vs. job requirements</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <SkillsDistributionChart data={topSkills} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skill Gaps Analysis</CardTitle>
                <CardDescription>Skills with the largest gap between supply and demand</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {skillGaps.map((item) => (
                    <div key={item.skill} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.skill}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span className="mr-2">Supply: {item.student}</span>
                          <span>Demand: {item.job}</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Badge
                          variant={item.gap < 0 ? "destructive" : item.gap === 0 ? "outline" : "secondary"}
                          className="flex items-center"
                        >
                          {item.gap < 0 ? (
                            <>
                              <ArrowDown className="h-3 w-3 mr-1" /> Gap: {Math.abs(item.gap)}
                            </>
                          ) : item.gap === 0 ? (
                            <>
                              <Minus className="h-3 w-3 mr-1" /> Balanced
                            </>
                          ) : (
                            <>
                              <ArrowUp className="h-3 w-3 mr-1" /> Surplus: {item.gap}
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Category Distribution</CardTitle>
                <CardDescription>Breakdown of matches by job category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryDistribution.map((category) => (
                    <div key={category.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{category.name}</p>
                        <Badge variant="outline">{category.count} matches</Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{category.percentage.toFixed(1)}% of matches</span>
                        <span>Avg. Score: {category.avgScore.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Skills by Category</CardTitle>
                <CardDescription>Most common skills in each job category</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <TopSkillsChart />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Key Insights & Recommendations</CardTitle>
              <CardDescription>Analysis and actionable recommendations based on the data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Match Quality Analysis</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  The average match score across all student-job pairs is {avgMatchScore.toFixed(1)}%, with{" "}
                  {highMatchCount} high-quality matches (70%+) and {lowMatchCount} low-quality matches (below 40%).
                </p>
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Insight:</strong>{" "}
                    {avgMatchScore > 60
                      ? "The high average match score indicates good alignment between student skills and job requirements."
                      : "The relatively low average match score suggests a gap between student skills and job requirements."}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Skill Gap Analysis</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  The analysis identified key skill gaps where job demand exceeds student supply.
                </p>
                <div className="bg-amber-50 p-3 rounded-md">
                  <p className="text-sm text-amber-800">
                    <strong>Recommendation:</strong> Focus on developing training programs for the top skill gaps:
                    {skillGaps
                      .filter((item) => item.gap < 0)
                      .slice(0, 3)
                      .map((item) => ` ${item.skill}`)
                      .join(", ")}
                    .
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Category Performance</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {categoryDistribution.length > 0
                    ? `${categoryDistribution[0].name} is the dominant job category with ${categoryDistribution[0].percentage.toFixed(1)}% of matches.`
                    : "No category data available."}
                </p>
                <div className="bg-green-50 p-3 rounded-md">
                  <p className="text-sm text-green-800">
                    <strong>Insight:</strong>{" "}
                    {categoryDistribution.length > 0
                      ? `The ${categoryDistribution.sort((a, b) => b.avgScore - a.avgScore)[0].name} category has the highest average match score at ${categoryDistribution.sort((a, b) => b.avgScore - a.avgScore)[0].avgScore.toFixed(1)}%, indicating strong alignment in this field.`
                      : "No category performance data available."}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Strategic Recommendations</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  <li>
                    <strong>Skill Development:</strong> Implement targeted training programs to address the identified
                    skill gaps.
                  </li>
                  <li>
                    <strong>Curriculum Alignment:</strong> Work with educational institutions to align curriculum with
                    in-demand skills.
                  </li>
                  <li>
                    <strong>Employer Engagement:</strong> Engage with employers to better understand evolving skill
                    requirements.
                  </li>
                  <li>
                    <strong>Student Guidance:</strong> Provide career guidance to students based on skill demand trends.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex gap-4">
        <Link href="/analytics/update-categories">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" /> Update Job Categories
          </Button>
        </Link>
        <Link href="/analytics/populate-categories">
          <Button variant="outline" size="sm">
            <Database className="mr-2 h-4 w-4" /> Populate Job Categories
          </Button>
        </Link>
      </div>
    </div>
  )
}
