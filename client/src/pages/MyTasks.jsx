
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProjects } from "../services/projectService";
import { getProjectTasks } from "../services/taskService";

const MyTasks = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [sortBy, setSortBy] = useState("dueDate");
    // My Tasks statistics
    const totalAssignedTasks = tasks.length;

    const pendingTasks = tasks.filter(
        (task) => task.status !== "Completed"
    ).length;

    const completedTasks = tasks.filter(
        (task) => task.status === "Completed"
    ).length;
    const filteredTasks =
        statusFilter === "All"
            ? tasks
            : tasks.filter((task) => task.status === statusFilter);

    const sortedTasks = [...filteredTasks].sort((a, b) => {
        if (sortBy === "dueDate") {
            return new Date(a.dueDate || "9999-12-31") -
                new Date(b.dueDate || "9999-12-31");
        }

        if (sortBy === "dueDateDesc") {
            return new Date(b.dueDate || "1900-01-01") -
                new Date(a.dueDate || "1900-01-01");
        }

        const priorityOrder = {
            High: 3,
            Medium: 2,
            Low: 1
        };

        if (sortBy === "priorityHigh") {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }

        if (sortBy === "priorityLow") {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }

        return 0;
    });


    useEffect(() => {
        const loadMyTasks = async () => {
            try {
                setLoading(true);
                setError("");

                const projectData = await getProjects(token);
                const projectList = projectData.projects || [];

                const taskResponses = await Promise.all(
                    projectList.map((project) =>
                        getProjectTasks(project._id, token)
                    )
                );

                const allTasks = taskResponses.flatMap(
                    (response, index) =>
                        (response.tasks || [])
                            .filter((task) => {
                                const assignedUserId =
                                    task.assignedTo?._id || task.assignedTo;

                                return String(assignedUserId) === String(user?._id);
                            })
                            .map((task) => ({
                                ...task,
                                projectTitle: projectList[index].title,
                                projectId: projectList[index]._id
                            }))
                );

                setTasks(allTasks);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            loadMyTasks();
        }
    }, [token, user?._id]);


    return (
        <div className="my-tasks-page">

            <button
                className="back-dashboard-btn"
                onClick={() => navigate("/dashboard")}
            >
                ← Back to Dashboard
            </button>

            <h1>My Tasks</h1>
            <p>View and manage tasks across your projects.</p>

            <div className="my-task-stats">
                <div className="my-task-stat-card">
                    <h3>Total Assigned Tasks</h3>
                    <h2>{totalAssignedTasks}</h2>
                </div>

                <div className="my-task-stat-card">
                    <h3>Pending Tasks</h3>
                    <h2>{pendingTasks}</h2>
                </div>

                <div className="my-task-stat-card">
                    <h3>Completed Tasks</h3>
                    <h2>{completedTasks}</h2>
                </div>
            </div>

            <div className="task-filters">
                {["All", "To Do", "In Progress", "Completed"].map((status) => (
                    <button
                        key={status}
                        className={statusFilter === status ? "active" : ""}
                        onClick={() => setStatusFilter(status)}
                    >
                        {status}
                    </button>
                ))}
            </div>

            <div className="task-sorting">
                <label htmlFor="taskSort">Sort By:</label>

                <select
                    id="taskSort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="dueDate">Due Date (Earliest First)</option>
                    <option value="dueDateDesc">Due Date (Latest First)</option>
                    <option value="priorityHigh">Priority (High to Low)</option>
                    <option value="priorityLow">Priority (Low to High)</option>
                </select>
            </div>

            {loading && <p>Loading your tasks...</p>}

            {error && <p className="error-message">{error}</p>}

            {!loading && !error && tasks.length === 0 && (
                <p>You don't have any tasks assigned yet.</p>
            )}
            {!loading && !error && sortedTasks.length > 0 && (
                <div className="my-tasks-list">
                    {sortedTasks.map((task) => (
                        <div className="my-task-card" key={task._id}>
                            <div>
                                <h3>{task.title}</h3>
                                <p>{task.projectTitle}</p>
                            </div>

                            <p>{task.description || "No description provided."}</p>
                            {task.dueDate && (
                                <p className="my-task-due-date">
                                    Due Date: {new Date(task.dueDate).toLocaleDateString("en-IN")}
                                    {task.status !== "Completed" &&
                                        new Date(task.dueDate) < new Date() && (
                                            <strong className="overdue-label"> Overdue</strong>
                                        )}
                                </p>
                            )}

                            <span>{task.status}</span>
                            <span>{task.priority} Priority</span>

                            <button
                                onClick={() => navigate(`/projects/${task.projectId}`)}
                            >
                                View Project
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyTasks;
