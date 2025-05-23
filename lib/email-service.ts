import nodemailer from "nodemailer"
import { jobCategories } from "@/lib/matching-config"
import type { Student, Job } from "@/types"

interface EmailResult {
  success: boolean
  error?: string
}

export async function sendMatchEmail(
  student: Student,
  job: Job,
  matchDetails: {
    matchScore: number
    matchingSkills: string[]
    missingSkills: string[]
    skillMatchPercentage: number
    academicContribution: number
    experienceContribution: number
    jobCategory: string
  },
): Promise<EmailResult> {
  try {
    // In the preview environment, we'll just simulate sending emails
    if (process.env.NODE_ENV === "development" || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`[SIMULATED EMAIL] Match email would be sent to ${student.email} about job: ${job.job_role}`)
      return { success: true }
    }

    // Find the job category
    const category =
      jobCategories.find((cat) => cat.id === matchDetails.jobCategory) || jobCategories[jobCategories.length - 1]

    // Create a nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: "smtp-mail.outlook.com", // Outlook SMTP server
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // Your Outlook email
        pass: process.env.EMAIL_PASS, // Your Outlook password
      },
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
      },
    })

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
            <p>Your profile has a <span class="match-score">${matchDetails.matchScore.toFixed(1)}%</span> match with this job!</p>
            
            <div class="score-breakdown">
              <div class="score-component skills-component">
                <h3>Skills</h3>
                <p>${matchDetails.skillMatchPercentage.toFixed(1)}%</p>
                <p>Weight: ${(category.weights.skillMatch * 100).toFixed(0)}%</p>
              </div>
              <div class="score-component academic-component">
                <h3>Academic</h3>
                <p>${matchDetails.academicContribution.toFixed(1)}%</p>
                <p>Weight: ${(category.weights.academicPerformance * 100).toFixed(0)}%</p>
              </div>
              <div class="score-component experience-component">
                <h3>Experience</h3>
                <p>${matchDetails.experienceContribution.toFixed(1)}%</p>
                <p>Weight: ${(category.weights.experience * 100).toFixed(0)}%</p>
              </div>
            </div>
            
            <h3>Your Matching Skills:</h3>
            <div>
              ${matchDetails.matchingSkills.map((skill) => `<span class="skill matching-skill">${skill}</span>`).join(" ")}
            </div>
            
            <h3>Skills to Develop:</h3>
            <div>
              ${matchDetails.missingSkills.map((skill) => `<span class="skill missing-skill">${skill}</span>`).join(" ")}
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
                matchDetails.matchingSkills.length > 0
                  ? `Your strengths in ${matchDetails.matchingSkills.slice(0, 3).join(", ")} are particularly valuable for this role.`
                  : ""
              }
              
              ${
                matchDetails.missingSkills.length > 0
                  ? `Developing skills in ${matchDetails.missingSkills.slice(0, 3).join(", ")} would further enhance your candidacy.`
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
      subject: `Job Match: ${job.job_role} at ${job.company_name} - ${matchDetails.matchScore.toFixed(0)}% Match!`,
      html: emailContent,
    })

    return { success: true }
  } catch (error) {
    console.error("Error sending match email:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}
