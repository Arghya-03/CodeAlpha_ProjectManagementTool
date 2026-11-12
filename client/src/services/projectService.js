
const API_URL = "http://localhost:5000/api/projects";

const request = async (endpoint = "", options = {}, token) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
};

export const getProjects = (token) => {
  return request("", { method: "GET" }, token);
};

export const getProjectById = (id, token) => {
  return request(`/${id}`, { method: "GET" }, token);
};

export const createProject = (projectData, token) => {
  return request(
    "",
    {
      method: "POST",
      body: JSON.stringify(projectData),
    },
    token
  );
};

export const updateProject = (id, projectData, token) => {
  return request(
    `/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(projectData),
    },
    token
  );
};

export const deleteProject = (id, token) => {
  return request(`/${id}`, { method: "DELETE" }, token);
};

export const addProjectMember = (id, email, token) => {
  return request(
    `/${id}/members`,
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
    token
  );
};

export const removeProjectMember = (projectId, memberId, token) => {
  return request(
    `/${projectId}/members/${memberId}`,
    {
      method: "DELETE",
    },
    token
  );
};