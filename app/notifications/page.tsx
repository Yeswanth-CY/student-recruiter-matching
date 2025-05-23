import { getServerClient } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { markNotificationAsRead } from "@/app/actions/notification-actions"
import { formatDistanceToNow } from "date-fns"
import { Mail, AlertTriangle, Search, Bell } from "lucide-react"
import type { Notification } from "@/types/notification"

export const revalidate = 0

export default async function NotificationsPage() {
  const supabase = getServerClient()

  // Get all notifications
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching notifications:", error)
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">Notifications</h1>
        <p className="text-red-500">Error loading notifications: {error.message}</p>
      </div>
    )
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "email":
        return <Mail className="h-5 w-5" />
      case "match":
        return <Search className="h-5 w-5" />
      case "error":
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "email":
        return "bg-blue-100 text-blue-700"
      case "match":
        return "bg-green-100 text-green-700"
      case "error":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return dateString
    }
  }

  const getEmailDetails = (details: any) => {
    if (!details) return null

    return (
      <div className="mt-2 text-sm">
        <p>
          <strong>Emails sent:</strong> {details.successCount} of {details.totalEmails}
        </p>
        {details.failedCount > 0 && (
          <p className="text-red-500">
            <strong>Failed:</strong> {details.failedCount}
          </p>
        )}
        {details.recipients && details.recipients.length > 0 && (
          <div className="mt-1">
            <strong>Recipients:</strong>
            <div className="max-h-20 overflow-y-auto mt-1 pl-2 border-l-2 border-gray-200">
              {details.recipients.map((email: string, index: number) => (
                <div key={index} className="text-xs text-gray-600">
                  {email}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      {notifications && notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={`${notification.read ? "bg-white" : "bg-blue-50"}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-lg">{notification.title}</h3>
                      <span className="text-xs text-gray-500">{formatDate(notification.created_at)}</span>
                    </div>
                    <p className="text-gray-600 mt-1">{notification.message}</p>

                    {notification.type === "email" && notification.details && getEmailDetails(notification.details)}

                    {notification.type === "error" && notification.details && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                        <strong>Error details:</strong> {notification.details.error}
                      </div>
                    )}

                    {!notification.read && (
                      <form
                        action={async () => {
                          "use server"
                          await markNotificationAsRead(notification.id)
                        }}
                      >
                        <Button type="submit" variant="ghost" size="sm" className="mt-2 text-xs">
                          Mark as read
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
            <p className="text-gray-500">Notifications about email sending and system events will appear here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
