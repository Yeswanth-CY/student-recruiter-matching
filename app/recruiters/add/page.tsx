"use client"

import { useState } from "react"
import { addJob } from "@/app/actions/job-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function AddJobPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    try {
      const result = await addJob(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Job posting added successfully",
        })
        router.push("/recruiters")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add job posting",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add Job Posting</CardTitle>
          <CardDescription>Enter job details to find matching candidates</CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input id="company_name" name="company_name" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_role">Job Role</Label>
              <Input id="job_role" name="job_role" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_description">Job Description</Label>
              <Textarea id="job_description" name="job_description" rows={4} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Annual Salary (USD)</Label>
              <Input id="salary" name="salary" type="number" min="0" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills_required">
                Required Skills (comma-separated)
                <span className="text-sm text-muted-foreground ml-2">e.g., JavaScript, React, Node.js</span>
              </Label>
              <Textarea
                id="skills_required"
                name="skills_required"
                placeholder="Enter required skills separated by commas"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_apply_link">Application Link</Label>
              <Input id="job_apply_link" name="job_apply_link" type="url" required />
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Submitting..." : "Add Job Posting"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
