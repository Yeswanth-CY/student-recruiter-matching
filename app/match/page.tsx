"use client"

import { useState } from "react"
import { runSkillMatchingAlgorithm } from "@/app/actions/matching-algorithm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function MatchingPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    matchesCreated?: number
    emailsQueued?: number
    error?: string
  } | null>(null)

  async function handleRunMatching() {
    setIsRunning(true)
    try {
      const response = await runSkillMatchingAlgorithm()
      setResult(response)

      if (response.success) {
        toast({
          title: "Success",
          description: `Created ${response.matchesCreated} matches and queued ${response.emailsQueued} emails`,
        })
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to run matching algorithm",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      setResult({ success: false, error: "An unexpected error occurred" })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Link href="/" className="flex items-center text-sm mb-6 hover:underline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Skill Matching Algorithm</CardTitle>
          <CardDescription>
            Run the advanced matching algorithm to find personalized job recommendations for students
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            This algorithm analyzes student skills and compares them with job requirements to create personalized
            recommendations. The matching process:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Compares student skills with job skill requirements</li>
            <li>Identifies matching and missing skills</li>
            <li>Calculates a match score based on skill overlap</li>
            <li>Considers academic performance and experience for certain job types</li>
            <li>Only stores matches with a score of at least 20%</li>
            <li>Marks matches for email notification to students</li>
          </ul>

          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800 text-sm">
            <p className="font-medium">Preview Mode Notice</p>
            <p>
              In this preview environment, emails are simulated and not actually sent. In a production environment, real
              emails would be sent to students.
            </p>
          </div>

          {result && (
            <div className={`p-4 rounded-md ${result.success ? "bg-green-50" : "bg-red-50"}`}>
              <p className={`font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>
                {result.success ? "Success!" : "Error!"}
              </p>
              <p className={`text-sm ${result.success ? "text-green-700" : "text-red-700"}`}>
                {result.success
                  ? `Created ${result.matchesCreated} matches and queued ${result.emailsQueued} emails for sending`
                  : result.error || "An error occurred"}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button onClick={handleRunMatching} disabled={isRunning} className="w-full">
            {isRunning ? (
              <span className="flex items-center">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Running Algorithm...
              </span>
            ) : (
              <span className="flex items-center">
                <RefreshCw className="mr-2 h-4 w-4" /> Run Matching Algorithm
              </span>
            )}
          </Button>
          {result && result.success && (
            <Button variant="outline" className="w-full" onClick={() => router.push("/matches")}>
              View Matches
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
