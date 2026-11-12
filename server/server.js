
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const commentRoutes = require("./routes/commentRoutes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Socket.IO JWT Authentication
const jwt = require("jsonwebtoken");
const User = require("./models/User");

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = user;

    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
});


// Socket.IO connection and project rooms
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.user.name}`);

  socket.on("joinProject", async (projectId) => {
    try {
      const Project = require("./models/Project");

      const project = await Project.findById(projectId);

      if (!project) {
        socket.emit("projectRoomError", {
          message: "Project not found"
        });
        return;
      }

      const isOwner =
        project.owner.toString() === socket.user._id.toString();

      const isMember = project.members.some(
        (member) =>
          member.toString() === socket.user._id.toString()
      );

      if (!isOwner && !isMember) {
        socket.emit("projectRoomError", {
          message: "You are not authorized to join this project"
        });
        return;
      }

      socket.join(`project_${projectId}`);

      console.log(
        `${socket.user.name} joined project room: ${projectId}`
      );

      socket.emit("projectRoomJoined", { projectId });
    } catch (error) {
      socket.emit("projectRoomError", {
        message: "Unable to join project room"
      });
    }
  });

  // Leave the project-specific Socket.IO room
  socket.on("leaveProject", (projectId) => {
    socket.leave(`project_${projectId}`);
    console.log(`${socket.user.name} left project room: ${projectId}`);
  });

  // Broadcast task changes to other project members
  socket.on("taskChanged", async (data) => {
    try {
      const Project = require("./models/Project");
      const project = await Project.findById(data.projectId);

      if (!project) return;

      const isOwner =
        project.owner.toString() === socket.user._id.toString();

      const isMember = project.members.some(
        (member) => member.toString() === socket.user._id.toString()
      );

      if (!isOwner && !isMember) return;

      socket.to(`project_${data.projectId}`).emit("taskChanged", {
        projectId: data.projectId,
        action: data.action
      });
    } catch (error) {
      console.error("Task update broadcast failed:", error.message);
    }
  });

  // Broadcast new task comments to other project members
  socket.on("commentAdded", async (data) => {
    try {
      const Project = require("./models/Project");
      const project = await Project.findById(data.projectId);

      if (!project) return;

      const isOwner =
        project.owner.toString() === socket.user._id.toString();

      const isMember = project.members.some(
        (member) => member.toString() === socket.user._id.toString()
      );

      if (!isOwner && !isMember) return;

      socket.to(`project_${data.projectId}`).emit("commentAdded", {
        projectId: data.projectId,
        taskId: data.taskId
      });
    } catch (error) {
      console.error("Comment broadcast failed:", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user.name}`);
  });
});


// Middleware
app.use(cors());
app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoutes);

// Project routes
app.use("/api/projects", projectRoutes);

app.use("/api/tasks", taskRoutes);

app.use("/api/notifications", notificationRoutes);


app.use("/api/comments", commentRoutes);

// Test API route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ProjectFlow API is running successfully!"
  });
});

// Start server after database connection
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`ProjectFlow server running on port ${PORT}`);
      console.log("ProjectFlow Socket.IO server is ready");
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
