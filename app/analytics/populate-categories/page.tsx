"use client"

import { useState } from "react"
import { populateJobCategories } from "@/app/actions/populate-job-categories"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Database } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function PopulateCategoriesPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message?: string
    jobsUpdated?: number
    error?: string
  } | null>(null)

  async function handlePopulateCategories() {
    setIsRunning(true)
    try {
      const response = await populateJobCategories()
      setResult(response)

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || `Updated categories for ${response.jobsUpdated} jobs`,
        })
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to populate job categories",
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
      <Link href="/analytics" className="flex items-center text-sm mb-6 hover:underline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Analytics
      </Link>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Populate Job Categories</CardTitle>
          <CardDescription>Analyze job titles and descriptions to categorize all jobs in the database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            This utility will scan all jobs in the database and categorize them based on their titles and descriptions.
            This is useful to ensure that all jobs have a category assigned for analytics purposes.
          </p>
          <p>This process will:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Analyze each job's title and description</li>
            <li>Assign the most appropriate category based on keywords</li>
            <li>Update the job record in the database</li>
            <li>Make the skills data available for the "Top Skills by Category" chart</li>
          </ul>

          {result && (
            <div className={`p-4 rounded-md ${result.success ? "bg-green-50" : "bg-red-50"}`}>
              <p className={`font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>
                {result.success ? "Success!" : "Error!"}
              </p>
              <p className={`text-sm ${result.success ? "text-green-700" : "text-red-700"}`}>
                {result.success
                  ? result.message || `Updated categories for ${result.jobsUpdated} jobs`
                  : result.error || "An error occurred"}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button onClick={handlePopulateCategories} disabled={isRunning} className="w-full">
            {isRunning ? (
              <span className="flex items-center">
                <Database className="mr-2 h-4 w-4 animate-pulse" /> Populating Categories...
              </span>
            ) : (
              <span className="flex items-center">
                <Database className="mr-2 h-4 w-4" /> Populate Job Categories
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
