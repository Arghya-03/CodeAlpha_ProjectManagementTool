const express = require("express");
const router = express.Router();

const {
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask
} = require("../controllers/taskController");

const { protect } = require("../middleware/authMiddleware");

// Get all tasks of a project
router.get("/:projectId", protect, getProjectTasks);

// Create a new task
router.post("/:projectId", protect, createTask);

// Update a task
router.put("/:projectId/:taskId", protect, updateTask);

// Delete a task
router.delete("/:projectId/:taskId", protect, deleteTask);

module.exports = router;