const Chat = require("../models/chatModel");

const chatHandlers = (io, socket, onlineUsers) => {
  socket.on("send-message", async (data) => {
    const { recipientId, message } = data;
    console.log(data);

    // await Chat.create({ sender: socket.user.id, recipient: recipientId, message });

    if (onlineUsers[recipientId]) {
      io.to(onlineUsers[recipientId].socketId).emit("receive-message", {
        senderId: socket.user.id,
        message,
      });
    }
  });

  socket.on("typing", (data) => {
    const { recipientId } = data;
    if (onlineUsers[recipientId]) {
      io.to(onlineUsers[recipientId].socketId).emit("typing", { senderId: socket.user.id });
    }
  });

  socket.on("stop-typing", (data) => {
    const { recipientId } = data;
    if (onlineUsers[recipientId]) {
      io.to(onlineUsers[recipientId].socketId).emit("stop-typing", { senderId: socket.user.id });
    }
  });
};

module.exports = { chatHandlers };
