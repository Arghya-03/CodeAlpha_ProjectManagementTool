import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getProjects } from "../services/projectService";
import { useNavigate } from "react-router-dom";

const TeamMembers = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadTeamMembers = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await getProjects(token);
                const projectList = data.projects || [];

                setProjects(projectList);

                const allMembers = new Map();

                projectList.forEach((project) => {
                    if (project.owner && typeof project.owner === "object") {
                        allMembers.set(project.owner._id, {
                            ...project.owner,
                            projects: [project.title],
                            role: "Owner"
                        });
                    }

                    (project.members || []).forEach((member) => {
                        const memberId = member._id || member;

                        if (!allMembers.has(memberId)) {
                            allMembers.set(memberId, {
                                ...(typeof member === "object" ? member : {}),
                                projects: [project.title],
                                role: "Member"
                            });
                        } else {
                            const existingMember = allMembers.get(memberId);

                            if (!existingMember.projects.includes(project.title)) {
                                existingMember.projects.push(project.title);
                            }
                        }
                    });
                });

                setMembers(Array.from(allMembers.values()));
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            loadTeamMembers();
        }
    }, [token]);

    return (
        <div className="team-members-page">

            <button
                className="back-dashboard-btn"
                onClick={() => navigate("/dashboard")}
            >
                ← Back to Dashboard
            </button>

            <h1>Team Members</h1>
            <p>View everyone collaborating across your projects.</p>

            {loading && <p>Loading team members...</p>}

            {error && <p className="error-message">{error}</p>}

            {!loading && !error && members.length === 0 && (
                <p>No team members found yet.</p>
            )}

            {!loading && !error && members.length > 0 && (
                <div className="team-members-list">
                    {members.map((member) => (
                        <div className="team-member-card" key={member._id}>
                            <div className="team-member-avatar">
                                {member.name?.charAt(0).toUpperCase() || "U"}
                            </div>

                            <div className="team-member-info">
                                <h3>{member.name || "Unknown User"}</h3>
                                <p>{member.email || "Email unavailable"}</p>
                                <span>{member.role}</span>
                                <p>
                                    Projects: {member.projects.join(", ")}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeamMembers;