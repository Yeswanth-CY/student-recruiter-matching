export interface Student {
  id: string
  name: string
  email: string
  college: string
  score_12th: number
  score_10th: number
  resume_score: number
  xp_points: number
  skills: string[]
  created_at: string
}

export interface Job {
  id: string
  company_name: string
  job_role: string
  job_description: string
  salary: number
  skills_required: string[]
  job_apply_link: string
  created_at: string
}

export interface Match {
  id: string
  student_id: string
  job_id: string
  matching_skills: string[]
  missing_skills: string[]
  match_score: number
  email_sent: boolean
  created_at: string
  student?: Student
  job?: Job
}

export interface Recruiter {
  id: string
  company_name: string
  email: string
  job_role: string
  job_description: string
  salary: number
  skills_required: string[]
  job_apply_link: string
  created_at: string
}
