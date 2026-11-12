import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../services/socketService";
import {
    getProjectById,
    addProjectMember,
    removeProjectMember
} from "../services/projectService";

import {
    getProjectTasks,
    createTask,
    updateTask,
    deleteTask
} from "../services/taskService";

import {
    getTaskComments,
    createTaskComment
} from "../services/commentService";

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();

    const notifyTaskUpdate = () => {
        window.dispatchEvent(new Event("tasksUpdated"));
    };

    // Notify other project members about task changes
    const notifyRealtimeTaskChange = (action) => {
        const socket = getSocket();

        if (socket && socket.connected) {
            socket.emit("taskChanged", {
                projectId: id,
                action
            });
        }
    };

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [memberEmail, setMemberEmail] = useState("");
    const [memberMessage, setMemberMessage] = useState("");
    const [addingMember, setAddingMember] = useState(false);

    // Task Management States
    const [tasks, setTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [taskError, setTaskError] = useState("");
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [taskTitle, setTaskTitle] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [taskPriority, setTaskPriority] = useState("Medium");
    const [taskDueDate, setTaskDueDate] = useState("");
    const [taskAssignedTo, setTaskAssignedTo] = useState("");
    const [creatingTask, setCreatingTask] = useState(false);

    // Edit Task States
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editTaskData, setEditTaskData] = useState({
        title: "",
        description: "",
        priority: "Medium",
        dueDate: "",
        assignedTo: ""
    });
    const [updatingTask, setUpdatingTask] = useState(false);
    // Task Comment States
    const [taskComments, setTaskComments] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [loadingComments, setLoadingComments] = useState({});
    const [submittingComment, setSubmittingComment] = useState({});
    const [commentErrors, setCommentErrors] = useState({});
    const [showTaskComments, setShowTaskComments] = useState({});

    useEffect(() => {
        const fetchProject = async () => {
            try {
                setLoading(true);
                const data = await getProjectById(id, token);
                setProject(data.project);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (token && id) {
            fetchProject();
        }
    }, [id, token]);

    // Fetch all tasks belonging to this project
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                setLoadingTasks(true);
                setTaskError("");

                const data = await getProjectTasks(id, token);
                setTasks(data.tasks || []);
            } catch (error) {
                setTaskError(error.message);
            } finally {
                setLoadingTasks(false);
            }
        };

        if (token && id) {
            fetchTasks();
        }
    }, [id, token]);


    // Join the project-specific Socket.IO room
    useEffect(() => {
        const socket = getSocket();

        if (!socket || !id) return;

        const joinRoom = () => {
            socket.emit("joinProject", id);
        };

        if (socket.connected) {
            joinRoom();
        }

        socket.on("connect", joinRoom);

        return () => {
            socket.off("connect", joinRoom);
            socket.emit("leaveProject", id);
        };
    }, [id]);

    // Listen for task changes from other project members
    useEffect(() => {
        const socket = getSocket();

        if (!socket || !id || !token) return;

        const handleTaskChanged = async (data) => {
            if (data.projectId !== id) return;

            try {
                const latestData = await getProjectTasks(id, token);
                setTasks(latestData.tasks || []);
                notifyTaskUpdate();
            } catch (error) {
                setTaskError(error.message);
            }
        };

        socket.on("taskChanged", handleTaskChanged);

        return () => {
            socket.off("taskChanged", handleTaskChanged);
        };
    }, [id, token]);

    // Listen for new comments from other project members
    useEffect(() => {
        const socket = getSocket();

        if (!socket || !id || !token) return;

        const handleCommentAdded = async (data) => {
            if (data.projectId !== id) return;

            // Refresh comments only if this task's discussion is open
            if (!showTaskComments[data.taskId]) return;

            try {
                const latestData = await getTaskComments(
                    id,
                    data.taskId,
                    token
                );

                setTaskComments((prev) => ({
                    ...prev,
                    [data.taskId]: latestData.comments || []
                }));
            } catch (error) {
                console.error("Unable to refresh comments:", error.message);
            }
        };

        socket.on("commentAdded", handleCommentAdded);

        return () => {
            socket.off("commentAdded", handleCommentAdded);
        };
    }, [id, token, showTaskComments]);


    const handleAddMember = async (e) => {
        e.preventDefault();

        if (!memberEmail.trim()) {
            setMemberMessage("Please enter a member email.");
            return;
        }

        try {
            setAddingMember(true);
            setMemberMessage("");

            const data = await addProjectMember(id, memberEmail, token);

            setProject((prevProject) => ({
                ...prevProject,
                members: data.members,
            }));

            setMemberEmail("");
            setMemberMessage(data.message);
        } catch (error) {
            setMemberMessage(error.message);
        } finally {
            setAddingMember(false);
        }
    };

    const handleRemoveMember = async (memberId) => {
        const confirmRemove = window.confirm(
            "Are you sure you want to remove this project member?"
        );

        if (!confirmRemove) {
            return;
        }

        try {
            const data = await removeProjectMember(id, memberId, token);

            setProject((prevProject) => ({
                ...prevProject,
                members: data.members,
            }));

            setMemberMessage(data.message);
        } catch (error) {
            setMemberMessage(error.message);
        }
    };


    // Fetch comments for a task
    const loadTaskComments = async (taskId) => {
        try {
            setLoadingComments((prev) => ({
                ...prev,
                [taskId]: true
            }));

            setCommentErrors((prev) => ({
                ...prev,
                [taskId]: ""
            }));

            const data = await getTaskComments(id, taskId, token);

            setTaskComments((prev) => ({
                ...prev,
                [taskId]: data.comments || []
            }));
        } catch (error) {
            setCommentErrors((prev) => ({
                ...prev,
                [taskId]: error.message
            }));
        } finally {
            setLoadingComments((prev) => ({
                ...prev,
                [taskId]: false
            }));
        }
    };


    // Add a comment to a task
    const handleAddComment = async (e, taskId) => {
        e.preventDefault();

        const text = (commentInputs[taskId] || "").trim();

        if (!text) {
            return;
        }

        try {
            setSubmittingComment((prev) => ({
                ...prev,
                [taskId]: true
            }));

            setCommentErrors((prev) => ({
                ...prev,
                [taskId]: ""
            }));

            const data = await createTaskComment(
                id,
                taskId,
                text,
                token
            );

            const socket = getSocket();

            if (socket && socket.connected) {
                socket.emit("commentAdded", {
                    projectId: id,
                    taskId
                });
            }

            setTaskComments((prev) => ({
                ...prev,
                [taskId]: [
                    ...(prev[taskId] || []),
                    data.comment
                ]
            }));

            setCommentInputs((prev) => ({
                ...prev,
                [taskId]: ""
            }));
        } catch (error) {
            setCommentErrors((prev) => ({
                ...prev,
                [taskId]: error.message
            }));
        } finally {
            setSubmittingComment((prev) => ({
                ...prev,
                [taskId]: false
            }));
        }
    };



    // Create a new project task
    const handleCreateTask = async (e) => {
        e.preventDefault();

        if (!taskTitle.trim()) {
            setTaskError("Please enter a task title.");
            return;
        }

        try {
            setCreatingTask(true);
            setTaskError("");

            const taskData = {
                title: taskTitle.trim(),
                description: taskDescription,
                priority: taskPriority,
                dueDate: taskDueDate || null,
                assignedTo: taskAssignedTo || null
            };

            const data = await createTask(id, taskData, token);

            setTasks((prevTasks) => [data.task, ...prevTasks]);

            notifyTaskUpdate();
            notifyRealtimeTaskChange("created");

            setTaskTitle("");
            setTaskDescription("");
            setTaskPriority("Medium");
            setTaskDueDate("");
            setTaskAssignedTo("");
            setShowTaskForm(false);

        } catch (error) {
            setTaskError(error.message);
        } finally {
            setCreatingTask(false);
        }
    };

    // Update an existing project task
    const handleUpdateTask = async (taskId, updates) => {
        try {
            setTaskError("");

            const data = await updateTask(id, taskId, updates, token);

            setTasks((prevTasks) =>
                prevTasks.map((task) =>
                    task._id === taskId ? data.task : task
                )
            );

            notifyTaskUpdate();
            notifyRealtimeTaskChange("updated");

        } catch (error) {
            setTaskError(error.message);
        }
    };

    // Delete an existing project task
    const handleDeleteTask = async (taskId) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this task?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setTaskError("");

            await deleteTask(id, taskId, token);

            setTasks((prevTasks) =>
                prevTasks.filter((task) => task._id !== taskId)
            );
            notifyTaskUpdate();
            notifyRealtimeTaskChange("deleted");

        } catch (error) {
            setTaskError(error.message);
        }
    };

    // Open task editing form
    const handleEditTask = (task) => {
        setEditingTaskId(task._id);

        setEditTaskData({
            title: task.title,
            description: task.description || "",
            priority: task.priority,
            dueDate: task.dueDate
                ? new Date(task.dueDate).toISOString().split("T")[0]
                : "",
            assignedTo: task.assignedTo?._id || ""
        });
    };

    // Save edited task
    const handleSaveEditedTask = async (e) => {
        e.preventDefault();

        if (!editTaskData.title.trim()) {
            setTaskError("Task title is required.");
            return;
        }

        try {
            setUpdatingTask(true);
            setTaskError("");

            const updates = {
                ...editTaskData,
                title: editTaskData.title.trim(),
                dueDate: editTaskData.dueDate || null,
                assignedTo: editTaskData.assignedTo || null
            };

            const data = await updateTask(
                id,
                editingTaskId,
                updates,
                token
            );

            setTasks((prevTasks) =>
                prevTasks.map((task) =>
                    task._id === editingTaskId ? data.task : task
                )
            );

            notifyTaskUpdate();
            notifyRealtimeTaskChange("updated");

            setEditingTaskId(null);

        } catch (error) {
            setTaskError(error.message);
        } finally {
            setUpdatingTask(false);
        }
    };

    if (loading) {
        return <p>Loading project details...</p>;
    }

    if (error) {
        return (
            <div>
                <p>{error}</p>
                <button onClick={() => navigate("/dashboard")}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (!project) {
        return <p>Project not found.</p>;
    }

    const isProjectOwner =
        user?._id === project.owner?._id;

    return (
        <div className="project-details-page">
            <div className="project-overview-section">
                <h1>{project.title}</h1>

                <p>{project.description || "No description available."}</p>

                <div className="project-overview-details">
                    <span>Priority: {project.priority}</span>
                    <span>Status: {project.status}</span>
                    <span>Created By: {project.owner?.name || "Unknown"}</span>
                </div>
            </div>

            <div className="project-members-section">
                <h3>Project Members</h3>

                {project.members && project.members.length > 0 ? (
                    <ul>
                        {project.members.map((member) => (
                            <li key={member._id}>
                                {member.name} ({member.email})

                                {isProjectOwner && member._id !== project.owner?._id && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveMember(member._id)}
                                    >
                                        Remove
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No members added yet.</p>
                )}

                {isProjectOwner && (
                    <form onSubmit={handleAddMember}>
                        <h4>Add New Member</h4>

                        <input
                            type="email"
                            placeholder="Enter registered user's email"
                            value={memberEmail}
                            onChange={(e) => setMemberEmail(e.target.value)}
                            required
                        />

                        <button type="submit" disabled={addingMember}>
                            {addingMember ? "Adding..." : "Add Member"}
                        </button>

                        {memberMessage && <p>{memberMessage}</p>}
                    </form>
                )}

            </div>

            {/* Task Management Section */}
            <div className="project-tasks-section">
                <h2>Project Tasks</h2>

                <button
                    type="button"
                    onClick={() => setShowTaskForm(!showTaskForm)}
                >
                    {showTaskForm ? "Cancel" : "+ Create New Task"}
                </button>

                {showTaskForm && (
                    <form onSubmit={handleCreateTask}>
                        <h3>Create Task</h3>

                        <input
                            type="text"
                            placeholder="Task title"
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            required
                        />

                        <textarea
                            placeholder="Task description"
                            value={taskDescription}
                            onChange={(e) => setTaskDescription(e.target.value)}
                        />

                        <label>Priority</label>
                        <select
                            value={taskPriority}
                            onChange={(e) => setTaskPriority(e.target.value)}
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>

                        <label>Due Date</label>
                        <input
                            type="date"
                            value={taskDueDate}
                            onChange={(e) => setTaskDueDate(e.target.value)}
                        />

                        <label>Assign To</label>
                        <select
                            value={taskAssignedTo}
                            onChange={(e) => setTaskAssignedTo(e.target.value)}
                        >
                            <option value="">Unassigned</option>

                            {project.members?.map((member) => (
                                <option key={member._id} value={member._id}>
                                    {member.name}
                                </option>
                            ))}
                        </select>

                        <button type="submit" disabled={creatingTask}>
                            {creatingTask ? "Creating..." : "Create Task"}
                        </button>
                    </form>
                )}

                {taskError && <p>{taskError}</p>}

                {loadingTasks ? (
                    <p>Loading tasks...</p>
                ) : tasks.length === 0 ? (
                    <p>No tasks created yet.</p>
                ) : (
                    <div>
                        {tasks.map((task) => (
                            <div className="task-card" key={task._id}>
                                <h3>{task.title}</h3>

                                {editingTaskId === task._id && (
                                    <form onSubmit={handleSaveEditedTask}>
                                        <h4>Edit Task</h4>

                                        <input
                                            type="text"
                                            placeholder="Task title"
                                            value={editTaskData.title}
                                            onChange={(e) =>
                                                setEditTaskData({
                                                    ...editTaskData,
                                                    title: e.target.value
                                                })
                                            }
                                            required
                                        />

                                        <textarea
                                            placeholder="Task description"
                                            value={editTaskData.description}
                                            onChange={(e) =>
                                                setEditTaskData({
                                                    ...editTaskData,
                                                    description: e.target.value
                                                })
                                            }
                                        />

                                        <label>Priority</label>
                                        <select
                                            value={editTaskData.priority}
                                            onChange={(e) =>
                                                setEditTaskData({
                                                    ...editTaskData,
                                                    priority: e.target.value
                                                })
                                            }
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>

                                        <label>Due Date</label>
                                        <input
                                            type="date"
                                            value={editTaskData.dueDate}
                                            onChange={(e) =>
                                                setEditTaskData({
                                                    ...editTaskData,
                                                    dueDate: e.target.value
                                                })
                                            }
                                        />

                                        <label>Assign To</label>
                                        <select
                                            value={editTaskData.assignedTo}
                                            onChange={(e) =>
                                                setEditTaskData({
                                                    ...editTaskData,
                                                    assignedTo: e.target.value
                                                })
                                            }
                                        >
                                            <option value="">Unassigned</option>

                                            {project.members?.map((member) => (
                                                <option key={member._id} value={member._id}>
                                                    {member.name}
                                                </option>
                                            ))}
                                        </select>

                                        <button type="submit" disabled={updatingTask}>
                                            {updatingTask ? "Saving..." : "Save Changes"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setEditingTaskId(null)}
                                        >
                                            Cancel
                                        </button>
                                    </form>
                                )}

                                <p>{task.description || "No description"}</p>

                                <p>Priority: {task.priority}</p>

                                <p>
                                    Assigned To:{" "}
                                    {task.assignedTo?.name || "Unassigned"}
                                </p>

                                <p>
                                    Due Date:{" "}
                                    {task.dueDate
                                        ? new Date(task.dueDate).toLocaleDateString("en-IN")
                                        : "No due date"}
                                </p>

                                <label>Status</label>
                                <select className="task-status-select"
                                    value={task.status}
                                    onChange={(e) =>
                                        handleUpdateTask(task._id, {
                                            status: e.target.value
                                        })
                                    }
                                >
                                    <option value="To Do">To Do</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>

                                <button
                                    type="button"
                                    onClick={() => handleEditTask(task)}
                                >
                                    Edit Task
                                </button>

                                {isProjectOwner && (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteTask(task._id)}
                                    >
                                        Delete Task
                                    </button>
                                )}


                                {/* Task Comments Section */}
                                <div className="task-comments-section">
                                    <button
                                        type="button"
                                        className="comments-toggle-btn"
                                        onClick={() => {
                                            const isOpening = !showTaskComments[task._id];

                                            setShowTaskComments((prev) => ({
                                                ...prev,
                                                [task._id]: isOpening
                                            }));

                                            if (isOpening) {
                                                loadTaskComments(task._id);
                                            }
                                        }}
                                    >
                                        {showTaskComments[task._id]
                                            ? "Hide Comments"
                                            : "View Comments"}
                                        {taskComments[task._id] !== undefined &&
                                            ` (${taskComments[task._id].length})`}
                                    </button>

                                    {showTaskComments[task._id] && (
                                        <div className="task-comments-content">
                                            <h4>Task Discussion</h4>

                                            {loadingComments[task._id] ? (
                                                <p>Loading comments...</p>
                                            ) : (
                                                <>
                                                    {commentErrors[task._id] && (
                                                        <p className="comment-error">
                                                            {commentErrors[task._id]}
                                                        </p>
                                                    )}

                                                    {taskComments[task._id]?.length > 0 ? (
                                                        <div className="task-comments-list">
                                                            {taskComments[task._id].map((comment) => (
                                                                <div
                                                                    className="task-comment"
                                                                    key={comment._id}
                                                                >
                                                                    <strong>
                                                                        {comment.author?.name || "User"}
                                                                    </strong>

                                                                    <p>{comment.text}</p>

                                                                    <span>
                                                                        {new Date(
                                                                            comment.createdAt
                                                                        ).toLocaleString("en-IN")}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p>No comments yet. Start the discussion!</p>
                                                    )}
                                                </>
                                            )}

                                            <form
                                                className="task-comment-form"
                                                onSubmit={(e) => handleAddComment(e, task._id)}
                                            >
                                                <textarea
                                                    placeholder="Write a comment..."
                                                    value={commentInputs[task._id] || ""}
                                                    onChange={(e) =>
                                                        setCommentInputs((prev) => ({
                                                            ...prev,
                                                            [task._id]: e.target.value
                                                        }))
                                                    }
                                                    maxLength={2000}
                                                    required
                                                />

                                                <button
                                                    type="submit"
                                                    disabled={submittingComment[task._id]}
                                                >
                                                    {submittingComment[task._id]
                                                        ? "Sending..."
                                                        : "Add Comment"}
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="project-metadata">
                <p>
                    Created On:{" "}
                    {new Date(project.createdAt).toLocaleDateString("en-IN")}
                </p>

                <p>
                    Due Date:{" "}
                    {project.dueDate
                        ? new Date(project.dueDate).toLocaleDateString("en-IN")
                        : "No due date"}
                </p>
            </div>

            <button className="back-dashboard-btn" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
            </button>
        </div>
    );
};

export default ProjectDetails;