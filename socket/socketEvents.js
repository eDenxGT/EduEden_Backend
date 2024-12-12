const { Server } = require("socket.io");
const { chatHandlers } = require("./chatHandlers");
const { videoChatHandlers } = require("./videoChatHandlers");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const Chat = require("../models/chatModel");

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
      console.log("DECODED",decoded)
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

  io.on("connection", async (socket) => {
    console.log("New client connected:", socket.id);

    if (socket.user) {
      const { user_id, role } = socket.user;
  console.log(role)
      try {
        if (role === "tutor") {
          onlineTutors[user_id] = { socketId: socket.id, user_id };
          await Chat.updateMany(
            { tutor_id: user_id },
            { $set: { tutor_is_online: true } }
          );
          // console.log(result);

        } else if (role === "student") {
          onlineStudents[user_id] = { socketId: socket.id, user_id };
          await Chat.updateMany(
            { student_id: user_id },
            { $set: { student_is_online: true } }
          );
          // console.log( "result",result);
        }
        socket.broadcast.emit("users-update")
      } catch (error) {
        console.error("Error updating online status:", error);
      }
    }
    console.log("Tutors", onlineTutors);
    console.log("Students", onlineStudents);

    chatHandlers(io, socket, onlineTutors, onlineStudents);
    videoChatHandlers(io, socket, onlineTutors, onlineStudents);

    socket.on("disconnect", async () => {
      console.log("Client disconnected:", socket.id);
      if (socket.user) {
        if (socket.user.role === "tutor") {
          await Chat.updateMany(
            { tutor_id: socket.user.user_id },
            { $set: { tutor_is_online: false } }
          );
          delete onlineTutors[socket.user.user_id];
        } else if (socket.user.role === "student") {
          await Chat.updateMany(
            { student_id: socket.user.user_id },
            { $set: { student_is_online: false } }
          );
          delete onlineStudents[socket.user.user_id];
        }
        socket.broadcast.emit("users-update")
      }
    });
  });

  return io;
};

module.exports = { initializeSocket };
