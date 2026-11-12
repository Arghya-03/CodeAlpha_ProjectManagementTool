
const express = require("express");
const router = express.Router();

const {
    getNotifications,
    markNotificationAsRead,
    deleteNotification
} = require("../controllers/notificationController");

const { protect } = require("../middleware/authMiddleware");

// Get all notifications
router.get("/", protect, getNotifications);

// Mark notification as read
router.put("/:id/read", protect, markNotificationAsRead);

// Delete notification
router.delete("/:id", protect, deleteNotification);

module.exports = router;
