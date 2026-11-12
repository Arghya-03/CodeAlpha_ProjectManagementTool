
const express = require("express");
const router = express.Router();

const {
    getTaskComments,
    createTaskComment
} = require("../controllers/commentController");

const { protect } = require("../middleware/authMiddleware");

// Get comments for a task
router.get("/:projectId/:taskId", protect, getTaskComments);

// Add a comment to a task
router.post("/:projectId/:taskId", protect, createTaskComment);

module.exports = router;
