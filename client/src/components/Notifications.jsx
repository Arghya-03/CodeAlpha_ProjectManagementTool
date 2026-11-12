
import { useEffect, useState } from "react";
import { Bell, Check, Trash2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
    getNotifications,
    markNotificationAsRead,
    deleteNotification
} from "../services/notificationService";

const Notifications = () => {
    const { token } = useAuth();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const loadNotifications = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getNotifications(token);

            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            loadNotifications();
        }
    }, [token]);

    const handleMarkAsRead = async (notificationId) => {
        try {
            await markNotificationAsRead(notificationId, token);

            setNotifications((current) =>
                current.map((notification) =>
                    notification._id === notificationId
                        ? { ...notification, isRead: true }
                        : notification
                )
            );

            setUnreadCount((current) => Math.max(0, current - 1));
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            const notification = notifications.find(
                (item) => item._id === notificationId
            );

            await deleteNotification(notificationId, token);

            setNotifications((current) =>
                current.filter((item) => item._id !== notificationId)
            );

            if (notification && !notification.isRead) {
                setUnreadCount((current) => Math.max(0, current - 1));
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="notification-wrapper">
            <button
                className="notification-bell"
                onClick={() => {
                    setIsOpen((current) => !current);
                    if (!isOpen) loadNotifications();
                }}
                aria-label="Notifications"
            >
                <Bell size={21} />

                {unreadCount > 0 && (
                    <span className="notification-count">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <div>
                            <h3>Notifications</h3>
                            <span>{unreadCount} unread</span>
                        </div>

                        <button
                            className="notification-close"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close notifications"
                        >
                            <X size={19} />
                        </button>
                    </div>

                    {error && (
                        <p className="notification-error">{error}</p>
                    )}

                    {loading ? (
                        <p className="notification-empty">
                            Loading notifications...
                        </p>
                    ) : notifications.length === 0 ? (
                        <p className="notification-empty">
                            You're all caught up!
                        </p>
                    ) : (
                        <div className="notification-list">
                            {notifications.map((notification) => (
                                <div
                                    className={`notification-item ${
                                        notification.isRead ? "read" : "unread"
                                    }`}
                                    key={notification._id}
                                >
                                    <div className="notification-content">
                                        <p>{notification.message}</p>

                                        <span>
                                            {notification.createdAt
                                                ? new Date(
                                                    notification.createdAt
                                                ).toLocaleString("en-IN")
                                                : ""}
                                        </span>
                                    </div>

                                    <div className="notification-actions">
                                        {!notification.isRead && (
                                            <button
                                                onClick={() =>
                                                    handleMarkAsRead(
                                                        notification._id
                                                    )
                                                }
                                                title="Mark as read"
                                                aria-label="Mark as read"
                                            >
                                                <Check size={17} />
                                            </button>
                                        )}

                                        <button
                                            onClick={() =>
                                                handleDelete(notification._id)
                                            }
                                            title="Delete notification"
                                            aria-label="Delete notification"
                                        >
                                            <Trash2 size={17} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Notifications;
