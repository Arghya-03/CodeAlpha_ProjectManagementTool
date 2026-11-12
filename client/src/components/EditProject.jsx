
import { useState } from "react";

const EditProject = ({ project, onClose, onUpdate }) => {
    const [title, setTitle] = useState(project.title || "");
    const [description, setDescription] = useState(project.description || "");
    const [priority, setPriority] = useState(project.priority || "Medium");
    const [dueDate, setDueDate] = useState(
        project.dueDate ? project.dueDate.slice(0, 10) : ""
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

        await onUpdate(project._id, {
            title,
            description,
            priority,
            dueDate: dueDate || null,
        });
    };

    return (
        <div className="modal-overlay">
            <div className="project-modal">
                <div className="modal-header">
                    <div>
                        <h2>Edit Project</h2>
                        <p>Update your project details.</p>
                    </div>

                    <button
                        type="button"
                        className="modal-close"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Project Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            maxLength={100}
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={1000}
                            rows={4}
                        />
                    </div>

                    <div className="form-group">
                        <label>Priority</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Due Date</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={onClose}
                        >
                            Cancel
                        </button>

                        <button type="submit" className="create-project-btn">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProject;
