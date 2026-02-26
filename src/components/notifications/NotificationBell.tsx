import { useState } from "react";
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useNotificationLog } from "@/hooks/useNotificationLog";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  deadline: "Frist",
  assignment: "Tildeling",
  status_change: "Statusendring",
  message: "Melding",
};

const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  deadline: "bg-amber-100 text-amber-800",
  assignment: "bg-blue-100 text-blue-800",
  status_change: "bg-green-100 text-green-800",
  message: "bg-purple-100 text-purple-800",
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotificationLog();

  const handleNotificationClick = async (notification: typeof notifications extends (infer T)[] ? T : never) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold">Varsler</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              className="text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Merk alle som lest
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Laster varsler...
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                    !notification.is_read ? "bg-muted/30" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            NOTIFICATION_TYPE_COLORS[notification.notification_type] || ""
                          }`}
                        >
                          {NOTIFICATION_TYPE_LABELS[notification.notification_type] ||
                            notification.notification_type}
                        </Badge>
                        {!notification.is_read && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="font-medium text-sm truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: nb,
                        })}
                      </p>
                    </div>
                    {notification.link && (
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Ingen varsler
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
