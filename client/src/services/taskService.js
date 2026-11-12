const API_URL = "http://localhost:5000/api/tasks";

// Common helper for authenticated API requests
const taskRequest = async (url, method, token, body = null) => {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    ...(body !== null ? { body: JSON.stringify(body) } : {})
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Task request failed");
  }

  return data;
};

// Get all tasks belonging to a project
export const getProjectTasks = async (projectId, token) => {
  return taskRequest(`${API_URL}/${projectId}`, "GET", token);
};

// Create a new task
export const createTask = async (projectId, taskData, token) => {
  return taskRequest(`${API_URL}/${projectId}`, "POST", token, taskData);
};

// Update an existing task
export const updateTask = async (projectId, taskId, taskData, token) => {
  return taskRequest(
    `${API_URL}/${projectId}/${taskId}`,
    "PUT",
    token,
    taskData
  );
};

// Delete a task
export const deleteTask = async (projectId, taskId, token) => {
  return taskRequest(
    `${API_URL}/${projectId}/${taskId}`,
    "DELETE",
    token
  );
};