const mongoose = require("mongoose");

const WithdrawalSchema = new mongoose.Schema({
  tutor_id: {
    type: String,
    ref: "Tutor",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0, 
  },
  status: {
    type: String,
    enum: ["pending", "completed", "rejected"],
    default: "pending",
  },
  payment_method: {
    type: String,
    enum: ["card", "upi"],
    required: true,
  },
  requested_at: {
    type: Date,
    default: Date.now, 
  },
  processed_at: {
    type: Date, 
  },
  transaction_id: {
    type: String, 
  },
  remarks: {
    type: String, 
  },
});

module.exports = mongoose.model("Withdrawal", WithdrawalSchema);
