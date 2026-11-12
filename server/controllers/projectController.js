
const Project = require("../models/Project");
const User = require("../models/User");

// =====================================
// CREATE NEW PROJECT
// =====================================

const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project title is required"
      });
    }

    const project = await Project.create({
      title: title.trim(),
      description,
      priority: priority || "Medium",
      dueDate: dueDate || null,
      owner: req.user._id,
      members: [req.user._id]
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project
    });

  } catch (error) {
    console.error("Create project error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to create project"
    });
  }
};


// =====================================
// GET ALL USER PROJECTS
// =====================================

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    })
      .populate("owner", "name email")
      .populate("members", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects
    });

  } catch (error) {
    console.error("Get projects error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch projects"
    });
  }
};


// =====================================
// GET SINGLE PROJECT
// =====================================

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    })
      .populate("owner", "name email")
      .populate("members", "name email");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    res.status(200).json({
      success: true,
      project
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID"
      });
    }

    res.status(500).json({
      success: false,
      message: "Unable to fetch project"
    });
  }
};


// =====================================
// UPDATE PROJECT
// =====================================

const updateProject = async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "description",
      "priority",
      "status",
      "dueDate"
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (
      updates.title !== undefined &&
      (!updates.title || !updates.title.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Project title cannot be empty"
      });
    }

    if (updates.title !== undefined) {
      updates.title = updates.title.trim();
    }

    const project = await Project.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user._id
      },
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID"
      });
    }

    res.status(500).json({
      success: false,
      message: "Unable to update project"
    });
  }
};


// =====================================
// DELETE PROJECT
// =====================================

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Project deleted successfully"
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID"
      });
    }

    res.status(500).json({
      success: false,
      message: "Unable to delete project"
    });
  }
};


// =====================================
// ADD PROJECT MEMBER
// =====================================

const addProjectMember = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Member email is required"
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No registered user found with this email"
      });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    if (project.members.some(
      (memberId) => memberId.toString() === user._id.toString()
    )) {
      return res.status(400).json({
        success: false,
        message: "User is already a project member"
      });
    }

    project.members.push(user._id);
    await project.save();

    await project.populate("members", "name email");

    res.status(200).json({
      success: true,
      message: "Project member added successfully",
      members: project.members
    });

  } catch (error) {
    console.error("Add project member error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to add project member"
    });
  }
};


// =====================================
// REMOVE PROJECT MEMBER
// =====================================

const removeProjectMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    if (memberId === project.owner.toString()) {
      return res.status(400).json({
        success: false,
        message: "Project owner cannot be removed"
      });
    }

    const isMember = project.members.some(
      (id) => id.toString() === memberId
    );

    if (!isMember) {
      return res.status(404).json({
        success: false,
        message: "Project member not found"
      });
    }

    project.members = project.members.filter(
      (id) => id.toString() !== memberId
    );

    await project.save();
    await project.populate("members", "name email");

    res.status(200).json({
      success: true,
      message: "Project member removed successfully",
      members: project.members
    });

  } catch (error) {
    console.error("Remove project member error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to remove project member"
    });
  }
};


// =====================================
// EXPORT CONTROLLERS
// =====================================

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember
};