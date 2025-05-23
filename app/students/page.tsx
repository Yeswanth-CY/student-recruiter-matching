import Link from "next/link"
import { getServerClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Student } from "@/types"

export const revalidate = 0

export default async function StudentsPage() {
  const supabase = getServerClient()
  const { data: students, error } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching students:", error)
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">Students</h1>
        <p className="text-red-500">Error loading students: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Students</h1>
        <Link href="/students/add">
          <Button>Add Student</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students && students.length > 0 ? (
          students.map((student: Student) => (
            <Card key={student.id}>
              <CardHeader>
                <CardTitle>{student.name}</CardTitle>
                <CardDescription>{student.college}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span>{student.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">12th Score:</span>
                    <span>{student.score_12th}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">10th Score:</span>
                    <span>{student.score_10th}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Resume Score:</span>
                    <span>{student.resume_score}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">XP Points:</span>
                    <span>{student.xp_points}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block mb-2">Skills:</span>
                    <div className="flex flex-wrap gap-2">
                      {student.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="col-span-full text-center text-muted-foreground">
            No students found. Add a student to get started.
          </p>
        )}
      </div>
    </div>
  )
}
