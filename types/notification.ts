export interface Notification {
  id: string
  type: "email" | "system" | "match" | "error"
  title: string
  message: string
  details?: any
  read: boolean
  created_at: string
}

export interface EmailNotificationDetails {
  totalEmails: number
  successCount: number
  failedCount: number
  recipients?: string[]
  jobIds?: string[]
  studentIds?: string[]
}
