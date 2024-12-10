const Message = require("../models/messageModel");
const Chat = require("../models/chatModel");

const chatHandlers = (io, socket, onlineTutors, onlineStudents) => {
  socket.on("send-message", async (data) => {
    const {
      message_id,
      sender_id,
      receiver_id,
      message_text,
      time_stamp,
      chat_id,
    } = data;
    console.log(data);

    try {
      const chat = await Chat.findOne({ _id: chat_id });

      if (!chat) {
        console.error("Chat not found");
        return;
      }

      await Message.create({
        chat_id,
        message_id,
        sender_id,
        receiver_id,
        message_text,
        time_stamp,
      });

      chat.last_message = { sender_id, message_text, time_stamp };

      if (socket.user.role === "student") {
        chat.unread_message_count.tutor += 1; 
      } else if (socket.user.role === "tutor") {
        chat.unread_message_count.student += 1;
      }

      await chat.save();

      const recipientOnline =
        socket.user.role === "student"
          ? onlineTutors[receiver_id]
          : onlineStudents[receiver_id];

      if (recipientOnline) {
        io.to(recipientOnline.socketId).emit("receive-message", {
          message_id,
          sender_id,
          chat_id,
          message_text,
          time_stamp,
          chatData: chat,
        });
      } else {
        console.error(`Receiver ${receiver_id} is not online.`);
      }
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("typing", (data) => {
    const { recipientId } = data;
    if (onlineUsers[recipientId]) {
      io.to(onlineUsers[recipientId].socketId).emit("typing", {
        senderId: socket.user.id,
      });
    }
  });

  socket.on("stop-typing", (data) => {
    const { recipientId } = data;
    if (onlineUsers[recipientId]) {
      io.to(onlineUsers[recipientId].socketId).emit("stop-typing", {
        senderId: socket.user.id,
      });
    }
  });
};

module.exports = { chatHandlers };
