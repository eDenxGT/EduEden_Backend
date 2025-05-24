const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: true,
    },
    user_name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
    },
		phone: {
			type: Number,
		},
		password: {
			type: String,
			required: function(){ return this.google_id ? false : true },
		},
    google_id: {
      type: String,
    },
    last_login : {
			type: Date
		},
    resetToken: {
			type: String,
		},
		resetTokenExpiry: {
			type: Date,
		},
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "admins",
  }
);

module.exports = mongoose.model("Admin", adminSchema);
