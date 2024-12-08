const express = require("express");
const chatRouter = express.Router();

const {
  getChatsByUserId,
  getMessagesByChatId,
  getStudentsByTutorId,
  createChat,
  deleteChat,
  createMessage,
  getTutorsByStudentId,
} = require("../controllers/chatController");

chatRouter
  .get("/get-messages/:chat_id", getMessagesByChatId)
  .get("/get-chats/:user_id", getChatsByUserId)
  .get("/get-students/:tutor_id", getStudentsByTutorId)
  .get("/get-tutors/:student_id", getTutorsByStudentId)
  .post("/create-chat", createChat)
  .delete("/delete-chat/:chat_id", deleteChat)
  .post("/send-message", createMessage);

module.exports = chatRouter;
