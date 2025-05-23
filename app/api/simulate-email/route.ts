import { getServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { createEmailSentNotification } from "@/app/actions/notification-actions"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const matchId = formData.get("matchId") as string

    if (!matchId) {
      return NextResponse.json({ success: false, error: "Match ID is required" }, { status: 400 })
    }

    const supabase = getServerClient()

    // Get the match
    const { data: match, error: matchError } = await supabase.from("matches").select("*").eq("id", matchId).single()

    if (matchError) {
      return NextResponse.json({ success: false, error: matchError.message }, { status: 404 })
    }

    // Get the student
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("id", match.student_id)
      .single()

    if (studentError) {
      return NextResponse.json({ success: false, error: studentError.message }, { status: 404 })
    }

    // Get the job
    const { data: job, error: jobError } = await supabase.from("jobs").select("*").eq("id", match.job_id).single()

    if (jobError) {
      return NextResponse.json({ success: false, error: jobError.message }, { status: 404 })
    }

    // Simulate sending an email
    console.log(`[SIMULATED EMAIL] Match email would be sent to ${student.email} about job: ${job.job_role}`)

    // Update the match to indicate that the email has been sent
    await supabase.from("matches").update({ email_sent: true }).eq("id", matchId)

    // Create a notification
    await createEmailSentNotification({
      totalEmails: 1,
      successCount: 1,
      failedCount: 0,
      recipients: [student.email],
      jobIds: [job.id],
      studentIds: [student.id],
    })

    return NextResponse.json({
      success: true,
      message: `Email simulation successful. In a production environment, an email would be sent to ${student.email}`,
    })
  } catch (error) {
    console.error("Error simulating email:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
