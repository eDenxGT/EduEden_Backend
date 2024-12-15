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
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  payment_method: {
    type: String,
    enum: ["card", "upi"],
    required: true,
  },
  upi_id: {
    type: String,
  },
  card_details: {
    card_number: {
      type: String,
    },
    owner_name: {
      type: String,
    },
    expiry_date: {
      type: String,
    },
    cvv: {
      type: String,
    },
    type: {
      type: String,
    },
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
