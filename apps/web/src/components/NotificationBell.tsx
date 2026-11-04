import React, { useState, useRef, useEffect } from 'react';
import { useNotifications, useMarkNotificationRead, UserNotification } from '../api/notifications';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: notifications = [] } = useNotifications();
  const markReadMutation = useMarkNotificationRead();

  const unreadNotifications = notifications.filter((n) => !n.readAt);
  const unreadCount = unreadNotifications.length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    for (const notif of unreadNotifications) {
      await markReadMutation.mutateAsync(notif.id);
    }
  };

  const handleNotificationClick = async (notif: UserNotification) => {
    if (!notif.readAt) {
      await markReadMutation.mutateAsync(notif.id);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden transform origin-top-right transition-all">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markReadMutation.isPending}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-xs font-medium">No notifications right now</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.readAt;
                const dateStr = new Date(notif.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`px-4 py-3 cursor-pointer transition flex items-start gap-3 hover:bg-gray-50 ${
                      isUnread ? 'bg-indigo-50/40' : 'bg-white'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {notif.type === 'SELLER_STATUS_UPDATED' ? (
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${isUnread ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                        {notif.payload.message || 'Notification received'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">{dateStr}</p>
                    </div>

                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
