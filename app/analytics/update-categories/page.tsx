"use client"

import { useState } from "react"
import { updateJobCategories } from "@/app/actions/update-job-categories"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function UpdateCategoriesPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    jobsUpdated?: number
    matchesUpdated?: number
    error?: string
  } | null>(null)

  async function handleUpdateCategories() {
    setIsUpdating(true)
    try {
      const response = await updateJobCategories()
      setResult(response)

      if (response.success) {
        toast({
          title: "Success",
          description: `Updated categories for ${response.jobsUpdated} jobs and ${response.matchesUpdated} matches`,
        })
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update job categories",
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
      setIsUpdating(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Link href="/analytics" className="flex items-center text-sm mb-6 hover:underline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Analytics
      </Link>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Update Job Categories</CardTitle>
          <CardDescription>
            Analyze job titles and descriptions to categorize jobs and update match records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            This utility will scan all jobs in the database and categorize them based on their titles and descriptions.
            It will also update match records to ensure they have the correct job category.
          </p>
          <p>This is useful when:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>You've added new jobs without categories</li>
            <li>You want to recategorize existing jobs</li>
            <li>You notice discrepancies in your analytics data</li>
          </ul>

          {result && (
            <div className={`p-4 rounded-md ${result.success ? "bg-green-50" : "bg-red-50"}`}>
              <p className={`font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>
                {result.success ? "Success!" : "Error!"}
              </p>
              <p className={`text-sm ${result.success ? "text-green-700" : "text-red-700"}`}>
                {result.success
                  ? `Updated categories for ${result.jobsUpdated} jobs and ${result.matchesUpdated} matches`
                  : result.error || "An error occurred"}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button onClick={handleUpdateCategories} disabled={isUpdating} className="w-full">
            {isUpdating ? (
              <span className="flex items-center">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Updating Categories...
              </span>
            ) : (
              <span className="flex items-center">
                <RefreshCw className="mr-2 h-4 w-4" /> Update Job Categories
              </span>
            )}
          </Button>
          {result && result.success && (
            <Button variant="outline" className="w-full" onClick={() => router.push("/analytics")}>
              Return to Analytics
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
