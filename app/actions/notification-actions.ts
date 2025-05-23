"use server"

import { getServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import type { Notification, EmailNotificationDetails } from "@/types/notification"

export async function createNotification({
  type,
  title,
  message,
  details,
}: {
  type: Notification["type"]
  title: string
  message: string
  details?: any
}) {
  try {
    const supabase = getServerClient()

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        type,
        title,
        message,
        details,
        read: false,
      })
      .select()

    if (error) {
      console.error("Error creating notification:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/notifications")
    revalidatePath("/")

    return { success: true, data }
  } catch (error) {
    console.error("Error creating notification:", error)
    return { success: false, error: "Failed to create notification" }
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    const supabase = getServerClient()

    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id)

    if (error) {
      console.error("Error marking notification as read:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/notifications")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return { success: false, error: "Failed to mark notification as read" }
  }
}

export async function getUnreadNotificationsCount() {
  try {
    const supabase = getServerClient()

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("read", false)

    if (error) {
      console.error("Error getting unread notifications count:", error)
      return { success: false, error: error.message, count: 0 }
    }

    return { success: true, count: count || 0 }
  } catch (error) {
    console.error("Error getting unread notifications count:", error)
    return { success: false, error: "Failed to get unread notifications count", count: 0 }
  }
}

export async function getNotifications(limit = 10, offset = 0) {
  try {
    const supabase = getServerClient()

    const { data, error, count } = await supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error getting notifications:", error)
      return { success: false, error: error.message, notifications: [], count: 0 }
    }

    return { success: true, notifications: data, count: count || 0 }
  } catch (error) {
    console.error("Error getting notifications:", error)
    return { success: false, error: "Failed to get notifications", notifications: [], count: 0 }
  }
}

export async function createEmailSentNotification(details: EmailNotificationDetails) {
  const { totalEmails, successCount, failedCount } = details

  let title = "Emails Sent"
  let message = `${successCount} out of ${totalEmails} emails sent successfully.`

  if (failedCount > 0) {
    title = "Emails Sent (with errors)"
    message = `${successCount} emails sent successfully, ${failedCount} failed.`
  }

  return createNotification({
    type: "email",
    title,
    message,
    details,
  })
}
