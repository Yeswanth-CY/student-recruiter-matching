"use client"

import { useState } from "react"
import { addStudent } from "@/app/actions/student-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function AddStudentPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    try {
      const result = await addStudent(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Student profile added successfully",
        })
        router.push("/students")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add student",
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
          <CardTitle>Add Student Profile</CardTitle>
          <CardDescription>Enter your details to find matching job opportunities</CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="college">College/University</Label>
              <Input id="college" name="college" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="score_12th">12th Score (%)</Label>
                <Input id="score_12th" name="score_12th" type="number" step="0.01" min="0" max="100" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="score_10th">10th Score (%)</Label>
                <Input id="score_10th" name="score_10th" type="number" step="0.01" min="0" max="100" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resume_score">Resume Score (0-100)</Label>
                <Input id="resume_score" name="resume_score" type="number" min="0" max="100" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="xp_points">Experience Points</Label>
                <Input id="xp_points" name="xp_points" type="number" min="0" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">
                Skills (comma-separated)
                <span className="text-sm text-muted-foreground ml-2">e.g., JavaScript, React, Node.js</span>
              </Label>
              <Textarea id="skills" name="skills" placeholder="Enter your skills separated by commas" required />
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Submitting..." : "Add Student Profile"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
