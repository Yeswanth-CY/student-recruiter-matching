"use server"

import { getServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import nodemailer from "nodemailer"
import { jobCategories } from "@/lib/matching-config"
import { createEmailSentNotification, createNotification } from "./notification-actions"

export async function sendMatchEmails() {
  try {
    const supabase = getServerClient()

    // Get all matches where email hasn't been sent yet
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("*")
      .eq("email_sent", false)
      .gte("match_score", 50) // Only send emails for matches with at least 50% match

    if (matchesError) throw matchesError

    if (!matches || matches.length === 0) {
      return { success: true, message: "No new matches to send emails for" }
    }

    // Create a nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: "smtp-mail.outlook.com", // Outlook SMTP server
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // Your Outlook email
        pass: process.env.EMAIL_PASS, // Your Outlook password or app password
      },
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
      },
      connectionTimeout: 5000, // 5 seconds
      greetingTimeout: 5000, // 5 seconds
      socketTimeout: 5000, // 5 seconds
    })

    // Track successful and failed emails
    let successCount = 0
    let failedCount = 0
    const failedEmails = []
    const successfulRecipients = []
    const jobIds = []
    const studentIds = []

    // Send emails for each match (with a limit to prevent timeouts)
    const emailLimit = 10 // Process max 10 emails per function call
    const matchesToProcess = matches.slice(0, emailLimit)

    for (const match of matchesToProcess) {
      try {
        // Get student data
        const { data: student, error: studentError } = await supabase
          .from("students")
          .select("*")
          .eq("id", match.student_id)
          .single()

        if (studentError) throw studentError

        // Get job data
        const { data: job, error: jobError } = await supabase.from("jobs").select("*").eq("id", match.job_id).single()

        if (jobError) throw jobError

        // Find the job category
        const category =
          jobCategories.find((cat) => cat.id === match.job_category) || jobCategories[jobCategories.length - 1]

        // Create personalized email content
        const emailContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; }
              .match-score { font-size: 24px; font-weight: bold; color: #28a745; }
              .skill { display: inline-block; background-color: #e9ecef; padding: 5px 10px; margin: 5px; border-radius: 15px; }
              .matching-skill { background-color: #d4edda; color: #155724; }
              .missing-skill { background-color: #f8d7da; color: #721c24; }
              .button { display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
              .score-breakdown { display: flex; margin: 20px 0; }
              .score-component { flex: 1; padding: 10px; margin: 0 5px; border-radius: 5px; text-align: center; }
              .skills-component { background-color: #d4edda; }
              .academic-component { background-color: #cce5ff; }
              .experience-component { background-color: #e2d9f3; }
              .category-badge { display: inline-block; background-color: #e9ecef; padding: 5px 10px; border-radius: 15px; font-size: 14px; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Personalized Job Match Found!</h1>
                <div class="category-badge">Category: ${category.name}</div>
              </div>
              <div class="content">
                <p>Hello ${student.name},</p>
                <p>We've found a job opportunity that matches your skills and profile!</p>
                
                <h2>Job Details:</h2>
                <p><strong>Role:</strong> ${job.job_role}</p>
                <p><strong>Company:</strong> ${job.company_name}</p>
                <p><strong>Salary:</strong> $${job.salary.toLocaleString()}/year</p>
                <p><strong>Description:</strong> ${job.job_description}</p>
                
                <h2>Match Analysis:</h2>
                <p>Your profile has a <span class="match-score">${match.match_score.toFixed(1)}%</span> match with this job!</p>
                
                <div class="score-breakdown">
                  <div class="score-component skills-component">
                    <h3>Skills</h3>
                    <p>${match.skill_match_percentage?.toFixed(1)}%</p>
                    <p>Weight: ${(category.weights.skillMatch * 100).toFixed(0)}%</p>
                  </div>
                  <div class="score-component academic-component">
                    <h3>Academic</h3>
                    <p>${match.academic_contribution?.toFixed(1)}%</p>
                    <p>Weight: ${(category.weights.academicPerformance * 100).toFixed(0)}%</p>
                  </div>
                  <div class="score-component experience-component">
                    <h3>Experience</h3>
                    <p>${match.experience_contribution?.toFixed(1)}%</p>
                    <p>Weight: ${(category.weights.experience * 100).toFixed(0)}%</p>
                  </div>
                </div>
                
                <h3>Your Matching Skills:</h3>
                <div>
                  ${match.matching_skills.map((skill) => `<span class="skill matching-skill">${skill}</span>`).join(" ")}
                </div>
                
                <h3>Skills to Develop:</h3>
                <div>
                  ${match.missing_skills.map((skill) => `<span class="skill missing-skill">${skill}</span>`).join(" ")}
                </div>
                
                <p style="margin-top: 30px;">
                  <a href="${job.job_apply_link}" class="button">Apply for this Job</a>
                </p>
                
                <p style="margin-top: 30px;">
                  <strong>Why this job is a good fit for you:</strong><br>
                  Based on your academic background from ${student.college} and your skill set, 
                  this position aligns well with your profile. For ${category.name} roles, we place 
                  ${
                    category.weights.skillMatch > 0.6
                      ? "high emphasis on skills"
                      : category.weights.academicPerformance > 0.2
                        ? "significant value on academic performance"
                        : "strong importance on practical experience"
                  }.
                  
                  ${
                    match.matching_skills.length > 0
                      ? `Your strengths in ${match.matching_skills.slice(0, 3).join(", ")} are particularly valuable for this role.`
                      : ""
                  }
                  
                  ${
                    match.missing_skills.length > 0
                      ? `Developing skills in ${match.missing_skills.slice(0, 3).join(", ")} would further enhance your candidacy.`
                      : ""
                  }
                </p>
              </div>
              <div class="footer">
                <p>This is an automated email from the Student-Job Matching System.</p>
                <p>© ${new Date().getFullYear()} Student-Job Matching System. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `

        // Send the email
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: student.email,
          subject: `Job Match: ${job.job_role} at ${job.company_name} - ${match.match_score.toFixed(0)}% Match!`,
          html: emailContent,
        })

        // Update the match record to indicate that the email has been sent
        await supabase.from("matches").update({ email_sent: true }).eq("id", match.id)

        successCount++
        successfulRecipients.push(student.email)
        if (!jobIds.includes(job.id)) jobIds.push(job.id)
        if (!studentIds.includes(student.id)) studentIds.push(student.id)
      } catch (emailError) {
        console.error(`Error sending email for match ${match.id}:`, emailError)
        failedCount++
        failedEmails.push(match.id)
      }
    }

    // Create a notification about the email sending
    await createEmailSentNotification({
      totalEmails: matchesToProcess.length,
      successCount,
      failedCount,
      recipients: successfulRecipients,
      jobIds,
      studentIds,
    })

    revalidatePath("/matches")
    revalidatePath("/notifications")

    return {
      success: true,
      message: `Processed ${matchesToProcess.length} matches: ${successCount} emails sent successfully, ${failedCount} failed.`,
      remainingEmails: matches.length - emailLimit > 0 ? matches.length - emailLimit : 0,
    }
  } catch (error) {
    console.error("Error sending match emails:", error)

    // Create an error notification
    await createNotification({
      type: "error",
      title: "Email Sending Failed",
      message: "There was an error sending match emails.",
      details: { error: error instanceof Error ? error.message : String(error) },
    })

    return { success: false, error: "Failed to send match emails" }
  }
}
