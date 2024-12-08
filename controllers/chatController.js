const Chat = require("../models/chatModel");
const Message = require("../models/messageModel");
const Student = require("../models/studentModel");
const Course = require("../models/courseModel");
const Tutor = require("../models/tutorModel");

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
					"userDetails.full_name": 1,
					"userDetails.avatar": 1,
				},
			},
		]);
      console.log(chats)

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
		res.status(200).json(messages);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const createChat = async (req, res) => {
	try {
		const { student_id, tutor_id } = req.body;
      const isChatExists = await Chat.findOne({
         $and: [{ student_id }, { tutor_id }]
      }) 

      if (isChatExists) {
         return res.status(200).json(isChatExists)
      }

		const chat = await Chat.create({ student_id, tutor_id });
		res.status(200).json(chat);
	} catch (error) {
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

		// Create new message
		const newMessage = await Message.create({
			chat_id,
			sender_id,
			message,
		});

		// Update last message in chat
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

module.exports = {
	getChatsByUserId,
	getMessagesByChatId,
	createChat,
	deleteChat,
	createMessage,
	getStudentsByTutorId,
};
