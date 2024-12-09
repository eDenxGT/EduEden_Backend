const { Server } = require("socket.io");
const { chatHandlers } = require("./chatHandlers");
require("dotenv").config();
const jwt = require("jsonwebtoken");

let onlineTutors = {};
let onlineStudents = {};

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      allowedHeaders: ["authorization"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket, next) => {
    const { token, role } = socket.handshake.auth;

    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    const access_secret =
      role === "tutor"
        ? process.env.JWT_TUTOR_ACCESS_TOKEN_SECRET
        : process.env.JWT_STUDENT_ACCESS_TOKEN_SECRET;

    if (!access_secret) {
      return next(new Error("Authentication secret missing"));
    }

    try {
      const decoded = jwt.decode(token, access_secret);

      if (!decoded || !decoded.role || !decoded._id) {
        return next(new Error("Invalid token. Please login again."));
      }

      socket.user = {
        user_id: decoded.user_id,
        role: decoded.role,
      };

      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        console.error("Token expired at:", error.expiredAt);
        socket.emit("token-expired", { message: "Please refresh your token." });
      } else {
        console.error("Authentication failed:", error.message);
        return next(new Error("Authentication failed"));
      }
    }
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    if (socket.user) {
      if (socket.user.role === "tutor") {
        onlineTutors[socket.user.user_id] = {
          socketId: socket.id,
          user_id: socket.user.user_id,
        };
      } else if (socket.user.role === "student") {
        onlineStudents[socket.user.user_id] = {
          socketId: socket.id,
          user_id: socket.user.user_id,
        };
      }
    }
    console.log("Tutors", onlineTutors);
    console.log("Students", onlineStudents);

    chatHandlers(io, socket, onlineTutors, onlineStudents);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      if (socket.user) {
        if (socket.user.role === "tutor") {
          delete onlineTutors[socket.user.user_id];
        } else if (socket.user.role === "student") {
          delete onlineStudents[socket.user.user_id];
        }
      }
    });
  });

  return io;
};

module.exports = { initializeSocket };
