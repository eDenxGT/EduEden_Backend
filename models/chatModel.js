const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  student_id: {
    type: String,
    ref: "Student",
    required: true,
  },
  tutor_id: {
    type: String,
    ref: "Tutor",
    required: true,
  },
  last_message: {
    sender_id: {
      type: String,
      default: null,
    },
    message_text: {
      type: String,
      default: null,
    },
    time_stamp: {
      type: Date,
      default: null,
    },
  },
  unread_message_count: {
    student: {
      type: Number,
      default: 0,
    },
    tutor: {
      type: Number,
      default: 0,
    },
  },
  student_is_online: {
    type: Boolean,
    default: false,
  },
  tutor_is_online: {
    type: Boolean,
    default: false,
  },
  is_blocked: {
    status: {
      type: Boolean,
      default: false,
    },
    blocked_by: {
      type: String,
      default: null,
    },
    reason: { type: String, default: "" },
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Chat", chatSchema);
