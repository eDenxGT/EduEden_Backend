const Chat = require("../models/chatModel");
const Message = require("../models/messageModel");
const Student = require("../models/studentModel");
const Course = require("../models/courseModel");
const Tutor = require("../models/tutorModel");
const FRONTEND_URL = process.env.CLIENT_URL;

const ethenAiModel = require("../config/ethenAi");

const getChatsByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { role } = req.query;

    const isStudent = role === "student";
    const lookupCollection = isStudent ? "tutors" : "students";

    const chats = await Chat.aggregate([
      {
        $match: {
          $or: [{ student_id: user_id }, { tutor_id: user_id }],
        },
      },
      {
        $lookup: {
          from: lookupCollection,
          localField: isStudent ? "tutor_id" : "student_id",
          foreignField: "user_id",
          as: "userDetails",
        },
      },
      {
        $project: {
          student_id: 1,
          tutor_id: 1,
          last_message: 1,
          student_is_online: 1,
          tutor_is_online: 1,
          is_blocked: 1,
          unread_message_count: 1,
          "userDetails.full_name": 1,
          "userDetails.avatar": 1,
        },
      },
    ]);
    //   console.log(chats)

    res.status(200).json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ message: error.message });
  }
};

const getMessagesByChatId = async (req, res) => {
  try {
    const { chat_id } = req.params;
    const messages = await Message.find({ chat_id });
    // console.log(messages);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createChat = async (req, res) => {
  try {
    const { newChatDetails, role } = req.body;

    const { student_id, tutor_id } = newChatDetails;

    const isStudent = role === "student";
    const lookupCollection = isStudent ? "tutors" : "students";

    let chat = await Chat.findOne({ student_id, tutor_id });

    if (!chat) {
      chat = await Chat.create({ student_id, tutor_id });
    }

    // updateUserChatUi()

    const chatToSent = await Chat.aggregate([
      {
        $match: { _id: chat._id },
      },
      {
        $lookup: {
          from: lookupCollection,
          localField: isStudent ? "tutor_id" : "student_id",
          foreignField: "user_id",
          as: "userDetails",
        },
      },
      {
        $project: {
          student_id: 1,
          tutor_id: 1,
          last_message: 1,
          student_is_online: 1,
          tutor_is_online: 1,
          is_blocked: 1,
          unread_message_count: 1,
          "userDetails.full_name": 1,
          "userDetails.avatar": 1,
        },
      },
    ]);

    res.status(200).json(chatToSent[0] || {});
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteChat = async (req, res) => {
  try {
    const { chat_id } = req.params;
    const chat = await Chat.findByIdAndDelete(chat_id);
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createMessage = async (req, res) => {
  try {
    const { chat_id, sender_id, message } = req.body;

    const newMessage = await Message.create({
      chat_id,
      sender_id,
      message,
    });

    await Chat.findByIdAndUpdate(chat_id, {
      last_message: message,
      updated_at: new Date(),
      $inc: { unread_message_count: 1 },
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStudentsByTutorId = async (req, res) => {
  try {
    const { tutor_id } = req.params;
    const students = await Course.aggregate([
      {
        $match: { tutor_id },
      },
      {
        $lookup: {
          from: "students",
          localField: "course_id",
          foreignField: "active_courses",
          as: "courseStudents",
        },
      },
      {
        $unwind: "$courseStudents",
      },
      {
        $group: {
          _id: "$courseStudents.user_id",
          full_name: { $first: "$courseStudents.full_name" },
          avatar: { $first: "$courseStudents.avatar" },
          user_id: { $first: "$courseStudents.user_id" },
        },
      },
      {
        $project: {
          _id: 0,
          full_name: 1,
          avatar: 1,
          user_id: 1,
        },
      },
    ]);

    return res.status(200).json(students);
  } catch (error) {
    console.log("Getting students by tutorID error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getTutorsByStudentId = async (req, res) => {
  try {
    const { student_id } = req.params;

    const findTutors = await Student.aggregate([
      {
        $match: { user_id: student_id },
      },
      {
        $lookup: {
          from: "courses",
          localField: "active_courses",
          foreignField: "course_id",
          as: "courses",
        },
      },
      {
        $unwind: "$courses",
      },
      {
        $lookup: {
          from: "tutors",
          localField: "courses.tutor_id",
          foreignField: "user_id",
          as: "tutors",
        },
      },
      {
        $unwind: "$tutors",
      },
      {
        $group: {
          _id: "$tutors.user_id",
          full_name: { $first: "$tutors.full_name" },
          avatar: { $first: "$tutors.avatar" },
          user_id: { $first: "$tutors.user_id" },
        },
      },
      {
        $project: {
          _id: 0,
          full_name: 1,
          avatar: 1,
          user_id: 1,
        },
      },
    ]);
    //   console.log("TUTORE",findTutors);

    res.status(200).json(findTutors);
  } catch (error) {
    console.error("Error fetching tutors by student ID:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const markMessageAsRead = async (req, res) => {
  try {
    const { chat_id, user_role } = req.body;
    const chat = await Chat.findById(chat_id);
    console.log("ROLE", req.body);
    const isStudent = user_role === "student";

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    isStudent
      ? (chat.unread_message_count.student = 0)
      : (chat.unread_message_count.tutor = 0);

    await chat.save();

    res.status(200).json({ message: "Message marked as read" });
  } catch (error) {
    console.error("Error marking message as read:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//* =========== Ethen AI Bot =========== *//
const handleEthenAIBotChat = async (req, res) => {
  try {
    const { message } = req.body;

    const systemPrompt = `
      You are Ethen AI, an intelligent assistant created by eDenxGT for a coding and programming-based e-learning platform called EduEden.

      Your primary role is to assist students with programming, coding, and development-related questions. Follow these instructions carefully:

      1. **Answer Coding and Development Questions**:
        - Provide clear, concise, and accurate explanations for programming, coding, or development-related doubts.
        - Include examples or explanations as needed to make concepts easy to understand.
        - If the user asks about programming languages, frameworks, or tools (e.g., JavaScript, Python, React), answer professionally with relevant details.

      2. **Handle Identity Queries**:
        - If the user asks for your name (e.g., "What is your name?", "Who are you?"), respond simply with:
          - "I am Ethen AI. 😊" or "I am Ethen AI. 🤖" (random emojis for friendliness).
        - If the user asks deeply about your origin, creator, or purpose (e.g., "Who created you?", "Tell me more about yourself"), respond with:
          - "I am Ethen AI, an intelligent assistant developed by eDenxGT. I am designed to help students by answering programming, coding, and development-related questions. Whether you are learning a new language, solving coding problems, or exploring software development, I’m here to assist you in your learning journey. 😊"

      3. **Politely Avoid Irrelevant Questions**:
        - If the user asks non-programming-related questions (e.g., "What’s the weather?", "Tell me a joke"), respond politely but avoid answering:
          - "I specialize in programming, coding, and development-related topics. Let me know if you have any coding questions!"

      4. **Tone and Style**:
        - Maintain a professional, friendly, and conversational tone.
        - Avoid unnecessary formatting such as *stars*, bold text, or special symbols. Use clean, plain text for all responses.
        - Keep responses simple, direct, and easy to understand.

      5. **Handling Rude or Off-Topic Queries**:
        - If the user behaves rudely or asks inappropriate questions, respond politely and professionally:
          - "I’m here to help with programming and coding questions. Let me know how I can assist you with your learning goals!"

      Always prioritize being helpful, clear, and focused on programming and development-related content.
      `;

    const combinedPrompt = `${systemPrompt}\n\nUser: ${message}\nEthen AI:`;

    const aiReply = await ethenAiModel.generateContent(combinedPrompt);
    const aiResponse = aiReply.response.text().trim();

    // console.log("AI Response:", aiResponse);

    res.status(200).json({
      reply: aiResponse,
    });
  } catch (error) {
    console.error("Error handling bot chat:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getChatsByUserId,
  getMessagesByChatId,
  createChat,
  deleteChat,
  createMessage,
  getStudentsByTutorId,
  getTutorsByStudentId,
  markMessageAsRead,
  handleEthenAIBotChat,
};
