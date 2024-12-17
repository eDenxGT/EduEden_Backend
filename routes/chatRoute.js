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
  markMessageAsRead,
  handleEthenAIBotChat
} = require("../controllers/chatController");

const { verifyTutor, verifyStudent } = require("../middlewares/auth");

chatRouter
  .get("/get-messages/:chat_id", getMessagesByChatId)
  .get("/get-chats/:user_id", getChatsByUserId)
  .get("/get-students/:tutor_id", verifyTutor, getStudentsByTutorId)
  .get("/get-tutors/:student_id", verifyStudent, getTutorsByStudentId)
  .post("/create-chat", createChat)
  .delete("/delete-chat/:chat_id", deleteChat)
  .post("/send-message", createMessage)
  .put("/read-message", markMessageAsRead)
  .post("/ethen-ai", handleEthenAIBotChat);

module.exports = chatRouter;
