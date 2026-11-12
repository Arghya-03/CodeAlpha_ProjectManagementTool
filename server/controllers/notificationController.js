
const Notification = require("../models/Notification");

// Get notifications for the logged-in user
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user._id
        })
            .populate("sender", "name email")
            .populate("project", "title")
            .populate("task", "title")
            .sort({ createdAt: -1 });

        const unreadCount = await Notification.countDocuments({
            recipient: req.user._id,
            isRead: false
        });

        res.status(200).json({
            success: true,
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error("Get notifications error:", error.message);
        res.status(500).json({
            success: false,
            message: "Unable to fetch notifications"
        });
    }
};

// Mark a notification as read
const markNotificationAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                recipient: req.user._id
            },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification
        });
    } catch (error) {
        console.error("Mark notification error:", error.message);
        res.status(500).json({
            success: false,
            message: "Unable to update notification"
        });
    }
};

// Delete a notification
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: req.user._id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Notification deleted successfully"
        });
    } catch (error) {
        console.error("Delete notification error:", error.message);
        res.status(500).json({
            success: false,
            message: "Unable to delete notification"
        });
    }
};

module.exports = {
    getNotifications,
    markNotificationAsRead,
    deleteNotification
};
