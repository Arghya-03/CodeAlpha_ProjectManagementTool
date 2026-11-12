
import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    Users,
    Settings as SettingsIcon,
    LogOut
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
const Settings = () => {
    const { user, token, updateUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const [profileMessage, setProfileMessage] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");

    const [loading, setLoading] = useState(false);

    // Sync profile fields when user information loads or changes
    useEffect(() => {
        setName(user?.name || "");
        setEmail(user?.email || "");
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setProfileMessage("");

            const response = await fetch(
                "http://localhost:5000/api/auth/profile",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ name, email })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Profile update failed");
            }

            setProfileMessage(data.message);
            updateUser(data.user);

        } catch (error) {
            setProfileMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setPasswordMessage("");

            const response = await fetch(
                "http://localhost:5000/api/auth/change-password",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Password change failed");
            }

            setPasswordMessage(data.message);
            setCurrentPassword("");
            setNewPassword("");

        } catch (error) {
            setPasswordMessage(error.message);
        } finally {
            setLoading(false);
        }
    };


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
                    <a className="nav-link" href="/dashboard">
                        <LayoutDashboard size={19} />
                        Dashboard
                    </a>

                    <a className="nav-link" href="/dashboard#projects">
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
                    <a className="nav-link active" href="/settings">
                        <SettingsIcon size={19} />
                        Settings
                    </a>

                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={19} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Settings Content */}
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div>
                        <h2>Settings</h2>
                        <p>Manage your account information and security.</p>
                    </div>

                    <div className="profile-info">
                        <div className="profile-avatar">
                            {user?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                            <strong>{user?.name || "User"}</strong>
                            <p>Workspace Member</p>
                        </div>
                    </div>
                </header>

                <section className="settings-page">
                    <div className="settings-container">

                        <div className="settings-card">
                            <h2>Profile Information</h2>
                            <p>Update your personal details.</p>

                            <form onSubmit={handleProfileUpdate}>
                                <label htmlFor="settings-name">Full Name</label>
                                <input
                                    id="settings-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />

                                <label htmlFor="settings-email">Email Address</label>
                                <input
                                    id="settings-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />

                                {profileMessage && <p>{profileMessage}</p>}

                                <button type="submit" disabled={loading}>
                                    Save Changes
                                </button>
                            </form>
                        </div>

                        <div className="settings-card">
                            <h2>Change Password</h2>
                            <p>Keep your account secure.</p>

                            <form onSubmit={handlePasswordChange}>
                                <label htmlFor="current-password">
                                    Current Password
                                </label>
                                <input
                                    id="current-password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    autoComplete="current-password"
                                    required
                                />

                                <label htmlFor="new-password">New Password</label>
                                <input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                />

                                {passwordMessage && <p>{passwordMessage}</p>}

                                <button type="submit" disabled={loading}>
                                    Update Password
                                </button>
                            </form>
                        </div>

                    </div>
                </section>
            </main>
        </div>
    );

};

export default Settings;
