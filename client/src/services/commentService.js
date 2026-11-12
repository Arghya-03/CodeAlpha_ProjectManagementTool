
const API_URL = "http://localhost:5000/api/comments";

export const getTaskComments = async (projectId, taskId, token) => {
    const response = await fetch(
        `${API_URL}/${projectId}/${taskId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to fetch comments");
    }

    return data;
};

export const createTaskComment = async (
    projectId,
    taskId,
    text,
    token
) => {
    const response = await fetch(
        `${API_URL}/${projectId}/${taskId}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ text })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to add comment");
    }

    return data;
};
