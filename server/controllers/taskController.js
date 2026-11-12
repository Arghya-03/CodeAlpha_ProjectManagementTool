const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const Notification = require("../models/Notification");

// =====================================
// GET PROJECT TASKS
// =====================================

const getProjectTasks = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.projectId,
            $or: [
                { owner: req.user._id },
                { members: req.user._id }
            ]
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const tasks = await Task.find({
            project: project._id
        })
            .populate("assignedTo", "name email")
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            tasks
        });

    } catch (error) {
        console.error("Get project tasks error:", error.message);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID"
            });
        }

        res.status(500).json({
            success: false,
            message: "Unable to fetch project tasks"
        });
    }
};

// =====================================
// CREATE TASK
// =====================================

const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            assignedTo,
            priority,
            dueDate
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Task title is required"
            });
        }

        const project = await Project.findOne({
            _id: req.params.projectId,
            $or: [
                { owner: req.user._id },
                { members: req.user._id }
            ]
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        let assignedUser = null;

        if (assignedTo) {
            assignedUser = await User.findById(assignedTo);

            if (!assignedUser) {
                return res.status(404).json({
                    success: false,
                    message: "Assigned user not found"
                });
            }

            const isMember = project.members.some(
                (memberId) => memberId.toString() === assignedUser._id.toString()
            );

            if (!isMember) {
                return res.status(400).json({
                    success: false,
                    message: "Assigned user must be a project member"
                });
            }
        }

        const task = await Task.create({
            title: title.trim(),
            description,
            project: project._id,
            assignedTo: assignedUser ? assignedUser._id : null,
            createdBy: req.user._id,
            priority: priority || "Medium",
            dueDate: dueDate || null
        });

        await task.populate("assignedTo", "name email");
        await task.populate("createdBy", "name email");

        // Create notification when a task is assigned
        if (
            task.assignedTo &&
            task.assignedTo._id.toString() !== req.user._id.toString()
        ) {
            await Notification.create({
                recipient: task.assignedTo._id,
                sender: req.user._id,
                project: project._id,
                task: task._id,
                type: "task_assigned",
                message: `${req.user.name} assigned you a new task: ${task.title}`
            });
        }

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            task
        });

    } catch (error) {
        console.error("Create task error:", error.message);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid project or user ID"
            });
        }

        res.status(500).json({
            success: false,
            message: "Unable to create task"
        });
    }
};

// =====================================
// UPDATE TASK
// =====================================

const updateTask = async (req, res) => {
    try {
        const { title, description, assignedTo, priority, status, dueDate } = req.body;

        const project = await Project.findOne({
            _id: req.params.projectId,
            $or: [
                { owner: req.user._id },
                { members: req.user._id }
            ]
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const task = await Task.findOne({
            _id: req.params.taskId,
            project: project._id
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        if (title !== undefined) {
            if (!title.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Task title cannot be empty"
                });
            }
            task.title = title.trim();
        }

        if (description !== undefined) task.description = description;

        if (priority !== undefined) task.priority = priority;

        if (status !== undefined) task.status = status;

        if (dueDate !== undefined) task.dueDate = dueDate || null;

        if (assignedTo !== undefined) {
            if (!assignedTo) {
                task.assignedTo = null;
            } else {
                const assignedUser = await User.findById(assignedTo);

                if (!assignedUser) {
                    return res.status(404).json({
                        success: false,
                        message: "Assigned user not found"
                    });
                }

                const isMember = project.members.some(
                    (memberId) => memberId.toString() === assignedUser._id.toString()
                );

                if (!isMember) {
                    return res.status(400).json({
                        success: false,
                        message: "Assigned user must be a project member"
                    });
                }

                task.assignedTo = assignedUser._id;
            }
        }

        await task.save();

        await task.populate("assignedTo", "name email");
        await task.populate("createdBy", "name email");

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            task
        });

    } catch (error) {
        console.error("Update task error:", error.message);

        if (error.name === "CastError" || error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Invalid task data or ID"
            });
        }

        res.status(500).json({
            success: false,
            message: "Unable to update task"
        });
    }
};

// =====================================
// DELETE TASK
// =====================================

const deleteTask = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.projectId,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const task = await Task.findOneAndDelete({
            _id: req.params.taskId,
            project: project._id
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Task deleted successfully"
        });

    } catch (error) {
        console.error("Delete task error:", error.message);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid project or task ID"
            });
        }

        res.status(500).json({
            success: false,
            message: "Unable to delete task"
        });
    }
};

// =====================================
// EXPORT TASK CONTROLLERS
// =====================================

module.exports = {
    getProjectTasks,
    createTask,
    updateTask,
    deleteTask
};