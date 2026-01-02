import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Bell, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Notifications() {
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/notifications"],
  });

  const unreadCount = (notifications as any[]).filter((n: any) => !n.read).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              You have <span className="font-semibold">{unreadCount}</span> unread notifications
            </p>
          )}
        </div>
        <Bell className="w-8 h-8 text-blue-500" />
      </div>

      {isLoading ? (
        <p>Loading notifications...</p>
      ) : (notifications as any[]).length > 0 ? (
        <div className="space-y-3">
          {(notifications as any[]).map((notif: any) => (
            <Card
              key={notif.id}
              className={`p-4 ${!notif.read ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold">{notif.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notif.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button size="icon" variant="ghost" data-testid="button-delete-notification">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">No notifications yet</p>
        </Card>
      )}
    </div>
  );
}
