const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
	{
		contact: {
			type: String, 
			required: true,
		},
		otp: {
			type: String,
			required: true,
		},
		type: {
			type: String,
			enum: ["email", "phone"],
			required: true,
		},
      used: {
         type: Boolean,
         default: false,
      },
      role: {
         type: String,
         enum: ["student", "tutor"],
         required: true,
      },
		expires_at: {
			type: Date,
			required: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Otp", otpSchema);
