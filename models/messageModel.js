const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
	{
		chat_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Chat",
			required: true,
		},
		message_id: {
			type: String,
			required: true,
		},
		sender_id: {
			type: String,
			required: true,
		}, 
		receiver_id: {
			type: String,
			required: true,
		},
		message_text: {
			type: String,
			required: true,
		},
		is_read: {
			type: Boolean,
			default: false,
		},
		time_stamp: {
			type: Date,
			default: Date.now,
		}, 
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
