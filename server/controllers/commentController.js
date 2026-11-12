
const Comment = require("../models/Comment");
const Task = require("../models/Task");
const Project = require("../models/Project");

// Get all comments for a task
const getTaskComments = async (req, res) => {
    try {
        const { projectId, taskId } = req.params;

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const isOwner =
            project.owner.toString() === req.user._id.toString();

        const isMember = project.members.some(
            (member) => member.toString() === req.user._id.toString()
        );

        if (!isOwner && !isMember) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const task = await Task.findOne({
            _id: taskId,
            project: projectId
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const comments = await Comment.find({
            task: taskId,
            project: projectId
        })
            .populate("author", "name email")
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            comments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add a comment to a task
const createTaskComment = async (req, res) => {
    try {
        const { projectId, taskId } = req.params;
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Comment cannot be empty"
            });
        }

        if (text.trim().length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Comment cannot exceed 2000 characters"
            });
        }

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const isOwner =
            project.owner.toString() === req.user._id.toString();

        const isMember = project.members.some(
            (member) => member.toString() === req.user._id.toString()
        );

        if (!isOwner && !isMember) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const task = await Task.findOne({
            _id: taskId,
            project: projectId
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const comment = await Comment.create({
            task: taskId,
            project: projectId,
            author: req.user._id,
            text: text.trim()
        });

        await comment.populate("author", "name email");

        res.status(201).json({
            success: true,
            message: "Comment added successfully",
            comment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getTaskComments,
    createTaskComment
};
