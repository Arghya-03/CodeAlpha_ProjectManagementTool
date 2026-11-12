
const API_URL = "http://localhost:5000/api/notifications";

export const getNotifications = async (token) => {
    const response = await fetch(API_URL, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to fetch notifications");
    }

    return data;
};

export const markNotificationAsRead = async (notificationId, token) => {
    const response = await fetch(
        `${API_URL}/${notificationId}/read`,
        {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to mark notification as read");
    }

    return data;
};

export const deleteNotification = async (notificationId, token) => {
    const response = await fetch(
        `${API_URL}/${notificationId}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to delete notification");
    }

    return data;
};
