
const express = require("express");
const router = express.Router();

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember
} = require("../controllers/projectController");

const { protect } = require("../middleware/authMiddleware");

// All routes require JWT authentication

// Create a new project
router.post("/", protect, createProject);

// Get all projects belonging to logged-in user
router.get("/", protect, getProjects);

// Get a single project
router.get("/:id", protect, getProjectById);

// Add a member to a project
router.post("/:id/members", protect, addProjectMember);

// Remove a member from a project
router.delete("/:id/members/:memberId", protect, removeProjectMember);

// Update a project
router.put("/:id", protect, updateProject);

// Delete a project
router.delete("/:id", protect, deleteProject);

module.exports = router;
