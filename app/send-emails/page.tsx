"use client"

import { useState } from "react"
import { sendMatchEmails } from "@/app/actions/email-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"

export default function SendEmailsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  async function handleSendEmails() {
    setIsLoading(true)
    try {
      const response = await sendMatchEmails()
      setResult(response)

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Emails sent successfully",
        })
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to send emails",
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
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Link href="/matches" className="flex items-center text-sm mb-6 hover:underline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Matches
      </Link>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Send Match Emails</CardTitle>
          <CardDescription>Send personalized emails to students about their matching job opportunities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            This will send emails to all students who have job matches with a score of 50% or higher. Each email will
            include:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Job details (company, role, salary)</li>
            <li>Match score</li>
            <li>Matching skills</li>
            <li>Skills they need to develop</li>
            <li>Link to apply for the job</li>
          </ul>

          {result && (
            <div className={`p-4 rounded-md ${result.success ? "bg-green-50" : "bg-red-50"}`}>
              <p className={`font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>
                {result.success ? "Success!" : "Error!"}
              </p>
              <p className={`text-sm ${result.success ? "text-green-700" : "text-red-700"}`}>
                {result.message || result.error}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSendEmails} disabled={isLoading} className="w-full">
            {isLoading ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2">⏳</span> Sending Emails...
              </span>
            ) : (
              <span className="flex items-center">
                <Mail className="mr-2 h-4 w-4" /> Send Match Emails
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
