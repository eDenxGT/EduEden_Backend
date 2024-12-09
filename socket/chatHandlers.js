const Message = require("../models/messageModel");
const Chat = require("../models/chatModel");

const chatHandlers = (io, socket, onlineTutors, onlineStudents) => {
  socket.on("send-message", async (data) => {
    const { message_id, sender_id, receiver_id, message_text, time_stamp } =
      data;
    console.log(data);

    try {
      let chat;
      if (socket.user.role === "student") {
        chat = await Chat.findOne({
          student_id: sender_id,
          tutor_id: receiver_id,
        });
      } else if (socket.user.role === "tutor") {
        chat = await Chat.findOne({
          student_id: receiver_id,
          tutor_id: sender_id,
        });
      }

      if (!chat) {
        chat = await Chat.create({
          student_id: socket.user.role === "student" ? sender_id : receiver_id,
          tutor_id: socket.user.role === "tutor" ? sender_id : receiver_id,
        });
      }

      await Message.create({
        chat_id: chat._id,
        message_id,
        sender_id,
        receiver_id,
        message_text,
        time_stamp,
      });

      chat.last_message = { message_text, time_stamp };
      if (socket.user.role === "student") {
        chat.unread_message_count += 1;
      } else {
        chat.unread_message_count += 1;
      }
      await chat.save();

      if (socket.user.role === "student") {
        io.to(onlineTutors[receiver_id].socketId).emit("receive-message", {
          message_id,
          sender_id,
          message_text,
          time_stamp,
        });
      } else if (socket.user.role === "tutor") {
        io.to(onlineStudents[receiver_id].socketId).emit("receive-message", {
          message_id,
          sender_id,
          message_text,
          time_stamp,
        });
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
