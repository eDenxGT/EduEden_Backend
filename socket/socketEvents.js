const { Server } = require("socket.io");
const { chatHandlers } = require("./chatHandlers");
require("dotenv").config();

let onlineUsers = {};

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

  // io.use((socket, next) => {
  //   const token = socket.handshake.auth.token;
  //   console.log(socket.user)
  //   console.log(token)
  //   if (!token) {
  //     return next(new Error("Authentication token missing"));
  //   }
  //   try {
  //     // Verify token here if needed
  //     socket.user = { id: token };
  //     next();
  //   } catch (error) {
  //     return next(new Error("Authentication failed"));
  //   }
  // });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    
    // Store user connection
    if (socket.user) {
      onlineUsers[socket.user.id] = {
        socketId: socket.id,
        userId: socket.user.id
      };
    }

    // Initialize chat handlers
    chatHandlers(io, socket, onlineUsers);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      if (socket.user) {
        delete onlineUsers[socket.user.id];
      }
    });
  });

  return io;
};

module.exports = { initializeSocket };