
import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    Users,
    Settings,
    LogOut,
    Plus,
    Clock,
    CircleCheck,
    CircleDashed
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
    getProjects,
    createProject,
    updateProject,
    deleteProject
} from "../services/projectService";
import { getProjectTasks } from "../services/taskService";
import CreateProject from "../components/CreateProject";
import EditProject from "../components/EditProject";
import Notifications from "../components/Notifications";

const Dashboard = () => {
    const { user, token, logout } = useAuth();
    const isProjectOwner = (project) =>
        String(project.owner) === String(user?._id);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const loadTotalTasks = async (projectList) => {
        try {
            const taskResponses = await Promise.all(
                projectList.map((project) =>
                    getProjectTasks(project._id, token)
                )
            );

            const taskCount = taskResponses.reduce(
                (total, response) => total + (response.tasks?.length || 0),
                0
            );

            setTotalTasks(taskCount);
            const completedCount = taskResponses.reduce(
                (total, response) =>
                    total +
                    (response.tasks?.filter(
                        (task) => task.status === "Completed"
                    ).length || 0),
                0
            );

            setCompletedTasks(completedCount);
            const inProgressCount = taskResponses.reduce(
                (total, response) =>
                    total +
                    (response.tasks?.filter(
                        (task) => task.status === "In Progress"
                    ).length || 0),
                0
            );

            setInProgressTasks(inProgressCount);
        } catch (error) {
            console.error("Failed to load task count:", error);
        }
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setPriorityFilter("All");
        setStatusFilter("All");
    };

    const handleCreateProject = async (projectData) => {
        try {
            setProjectError("");

            await createProject(projectData, token);

            const data = await getProjects(token);
            setProjects(data.projects || []);

            setShowCreateModal(false);
        } catch (error) {
            setProjectError(error.message);
        }
    };

    const handleUpdateProjectStatus = async (projectId, newStatus) => {
        try {
            setProjectError("");

            await updateProject(
                projectId,
                { status: newStatus },
                token
            );

            const data = await getProjects(token);
            setProjects(data.projects || []);
        } catch (error) {
            setProjectError(error.message);
        }
    };

    const handleEditProject = async (projectId, updatedData) => {
        try {
            setProjectError("");

            await updateProject(projectId, updatedData, token);

            const data = await getProjects(token);
            setProjects(data.projects || []);

            setEditingProject(null);
        } catch (error) {
            setProjectError(error.message);
        }
    };

    const handleDeleteProject = async (projectId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this project?"
        );

        if (!confirmed) return;

        try {
            setProjectError("");

            await deleteProject(projectId, token);

            setProjects((currentProjects) =>
                currentProjects.filter(
                    (project) => project._id !== projectId
                )
            );
        } catch (error) {
            setProjectError(error.message);
        }
    };

    const [projects, setProjects] = useState([]);
    const [totalTasks, setTotalTasks] = useState(0);
    const [completedTasks, setCompletedTasks] = useState(0);
    const [inProgressTasks, setInProgressTasks] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [sortOrder, setSortOrder] = useState("newest");
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [projectError, setProjectError] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);

    useEffect(() => {
        const loadProjects = async () => {
            try {
                setLoadingProjects(true);
                setProjectError("");

                const data = await getProjects(token);

                const projectList = data.projects || [];

                setProjects(projectList);
                await loadTotalTasks(projectList);
            } catch (error) {
                setProjectError(error.message);
            } finally {
                setLoadingProjects(false);
            }
        };

        if (token) {
            loadProjects();
        } else {
            setLoadingProjects(false);
        }
    }, [token]);

    useEffect(() => {
        const handleTasksUpdated = () => {
            loadTotalTasks(projects);
        };

        window.addEventListener("tasksUpdated", handleTasksUpdated);

        return () => {
            window.removeEventListener("tasksUpdated", handleTasksUpdated);
        };
    }, [projects, token]);

    const filteredProjects = projects.filter((project) => {
        const matchesSearch = project.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesPriority =
            priorityFilter === "All" ||
            project.priority === priorityFilter;

        const matchesStatus =
            statusFilter === "All" ||
            project.status === statusFilter;

        return matchesSearch && matchesPriority && matchesStatus;
    });

    const sortedProjects = [...filteredProjects].sort((a, b) => {
        switch (sortOrder) {
            case "oldest":
                return new Date(a.createdAt) - new Date(b.createdAt);

            case "title-asc":
                return a.title.localeCompare(b.title);

            case "title-desc":
                return b.title.localeCompare(a.title);

            case "due-date":
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);

            case "newest":
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });

    const totalProjects = projects.length;

    const completedProjects = projects.filter(
        (project) => project.status === "Completed"
    ).length;

    const inProgressProjects = projects.filter(
        (project) => project.status === "In Progress"
    ).length;

    const planningProjects = projects.filter(
        (project) => project.status === "Planning"
    ).length;

    return (
        <div className="dashboard-layout">

            {/* Sidebar */}
            <aside className="sidebar">

                <div className="sidebar-brand">
                    <FolderKanban size={27} />
                    <h2>ProjectFlow</h2>
                </div>

                <p className="sidebar-label">WORKSPACE</p>

                <nav className="sidebar-nav">
                    <a className="nav-link active" href="/dashboard">
                        <LayoutDashboard size={19} />
                        Dashboard
                    </a>

                    <a className="nav-link" href="#projects">
                        <FolderKanban size={19} />
                        My Projects
                    </a>

                    <a className="nav-link" href="/tasks">
                        <CheckSquare size={19} />
                        My Tasks
                    </a>

                    <a className="nav-link" href="/team">
                        <Users size={19} />
                        Team Members
                    </a>
                </nav>

                <div className="sidebar-bottom">
                    <a className="nav-link" href="/settings">
                        <Settings size={19} />
                        Settings
                    </a>

                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={19} />
                        Logout
                    </button>
                </div>

            </aside>

            {/* Main Content */}
            <main className="dashboard-main">

                <header className="dashboard-header">
                    <div>
                        <h2>Dashboard</h2>
                        <p>Manage your work and track your progress.</p>
                    </div>

                    <div className="dashboard-header-actions">
                        <Notifications />

                        <div className="profile-info">
                            <div className="profile-avatar">
                                {user?.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div>
                                <strong>{user?.name || "User"}</strong>
                                <p>Workspace Member</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Welcome Section */}
                <section className="welcome-section">
                    <div>
                        <h1>
                            Welcome back, {user?.name?.split(" ")[0] || "User"}!
                        </h1>

                        <p>
                            Here's what's happening with your projects today.
                        </p>
                    </div>

                    <button
                        className="create-project-btn"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus size={18} />
                        New Project
                    </button>
                </section>

                {/* Statistics */}
                <section className="stats-grid">

                    <div className="stat-card">
                        <div className="stat-icon blue">
                            <FolderKanban />
                        </div>
                        <p>Total Projects</p>
                        <h2>{totalProjects}</h2>
                        <span>Projects in your workspace</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon purple">
                            <CheckSquare />
                        </div>
                        <p>Total Tasks</p>
                        <h2>{totalTasks}</h2>
                        <span>Tasks across your projects</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon orange">
                            <Clock />
                        </div>
                        <p>In Progress</p>
                        <h2>{inProgressTasks}</h2>
                        <span>Tasks currently in progress</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon green">
                            <CircleCheck />
                        </div>
                        <p>Completed Tasks</p>
                        <h2>{completedTasks}</h2>
                        <span>Tasks successfully completed</span>
                    </div>

                </section>

                {/* Projects Section */}
                <section className="projects-section" id="projects">

                    {loadingProjects && (
                        <p className="project-message">Loading projects...</p>
                    )}

                    {projectError && (
                        <p className="project-error">{projectError}</p>
                    )}

                    <div className="section-heading">
                        <div>
                            <h2>Recent Projects</h2>
                            <p>Your latest workspace projects</p>
                        </div>

                        <input
                            type="text"
                            className="project-search-input"
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <select
                            className="priority-filter"
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                        >
                            <option value="All">All Priorities</option>
                            <option value="High">High Priority</option>
                            <option value="Medium">Medium Priority</option>
                            <option value="Low">Low Priority</option>
                        </select>

                        <select
                            className="status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Planning">Planning</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                        </select>

                        <button
                            className="clear-filters-btn"
                            onClick={handleClearFilters}
                        >
                            Clear Filters
                        </button>

                        <select
                            className="sort-projects-select"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="title-asc">Title (A–Z)</option>
                            <option value="title-desc">Title (Z–A)</option>
                            <option value="due-date">Due Date (Earliest First)</option>
                        </select>

                    </div>


                    {!loadingProjects && !projectError && (
                        filteredProjects.length === 0 ? (
                            <div className="empty-projects">
                                <div className="empty-icon">
                                    <CircleDashed size={35} />
                                </div>

                                <h3>
                                    {searchTerm ? "No matching projects found" : "No projects yet"}
                                </h3>

                                <p>
                                    {searchTerm
                                        ? "Try searching with a different project name."
                                        : "Create your first project to start managing tasks and collaborating with your team."
                                    }
                                </p>

                                <button
                                    className="create-project-btn"
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    <Plus size={17} />
                                    Create Your First Project
                                </button>
                            </div>
                        ) : (
                            <div className="project-list">
                                {sortedProjects.map((project) => (
                                    <div className="project-card" key={project._id}>
                                        <div>
                                            <h3>{project.title}</h3>

                                            <p>
                                                {project.description || "No description provided."}
                                            </p>

                                            {project.dueDate && (
                                                <p className="project-due-date">
                                                    Due Date: {new Date(project.dueDate).toLocaleDateString("en-IN", {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric"
                                                    })}
                                                </p>
                                            )}

                                            {project.dueDate &&
                                                project.status !== "Completed" &&
                                                new Date(project.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)) && (
                                                    <span className="overdue-badge">
                                                        Overdue
                                                    </span>
                                                )
                                            }

                                            {project.dueDate &&
                                                project.status !== "Completed" &&
                                                new Date(project.dueDate) >= new Date(new Date().setHours(0, 0, 0, 0)) &&
                                                new Date(project.dueDate) <= new Date(
                                                    new Date().setHours(0, 0, 0, 0) + 7 * 24 * 60 * 60 * 1000
                                                ) && (
                                                    <span className="due-soon-badge">
                                                        Due Soon
                                                    </span>
                                                )
                                            }

                                        </div>

                                        <div className="project-card-details">

                                            {isProjectOwner(project) ? (
                                                <select
                                                    className="project-status-select"
                                                    value={project.status}
                                                    onChange={(e) =>
                                                        handleUpdateProjectStatus(project._id, e.target.value)
                                                    }
                                                >
                                                    <option value="Planning">Planning</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Completed">Completed</option>
                                                </select>
                                            ) : (
                                                <span>{project.status}</span>
                                            )}

                                            <span>{project.priority} Priority</span>

                                        </div>

                                        <div className="project-card-actions">
                                            <button
                                                className="view-project-btn"
                                                onClick={() => navigate(`/projects/${project._id}`)}
                                            >
                                                View Details
                                            </button>

                                            {isProjectOwner(project) && (
                                                <button
                                                    className="edit-project-btn"
                                                    onClick={() => setEditingProject(project)}
                                                >
                                                    Edit
                                                </button>
                                            )}

                                            {isProjectOwner(project) && (
                                                <button
                                                    className="delete-project-btn"
                                                    onClick={() => handleDeleteProject(project._id)}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>

                                    </div>
                                ))}
                            </div>
                        )
                    )}


                </section>

            </main>

            {showCreateModal && (
                <CreateProject
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateProject}
                />
            )}

            {editingProject && (
                <EditProject
                    project={editingProject}
                    onClose={() => setEditingProject(null)}
                    onUpdate={handleEditProject}
                />
            )}
        </div>
    );
};

export default Dashboard;
