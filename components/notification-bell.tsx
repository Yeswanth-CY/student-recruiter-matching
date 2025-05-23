"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getBrowserClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { markNotificationAsRead } from "@/app/actions/notification-actions"
import type { Notification } from "@/types/notification"

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true)
      try {
        const supabase = getBrowserClient()

        // Get recent unread notifications
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("read", false)
          .order("created_at", { ascending: false })
          .limit(5)

        if (error) {
          console.error("Error fetching notifications:", error)
          return
        }

        setNotifications(data || [])
        setUnreadCount(data?.length || 0)
      } catch (error) {
        console.error("Error in fetchNotifications:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()

    // Set up real-time subscription for new notifications
    const supabase = getBrowserClient()
    const subscription = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          // Add the new notification to the list
          setNotifications((prev) => [payload.new as Notification, ...prev])
          setUnreadCount((prev) => prev + 1)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          // Update the notification in the list
          setNotifications((prev) => prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n)))

          // Recalculate unread count
          setNotifications((prev) => {
            const unreadCount = prev.filter((n) => !n.read).length
            setUnreadCount(unreadCount)
            return prev
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id)

    // Update local state
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const handleViewAll = () => {
    router.push("/notifications")
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "email":
        return "📧"
      case "match":
        return "🔍"
      case "error":
        return "⚠️"
      default:
        return "🔔"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No new notifications</div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="p-3 cursor-pointer"
              onClick={() => handleMarkAsRead(notification.id)}
            >
              <div className="flex items-start gap-2">
                <div className="text-lg">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-sm text-muted-foreground">{notification.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">{formatDate(notification.created_at)}</div>
                </div>
                {!notification.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1"></div>}
              </div>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="p-2 cursor-pointer justify-center text-sm font-medium" onClick={handleViewAll}>
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
