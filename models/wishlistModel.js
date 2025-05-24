const mongoose = require("mongoose");

const WishlistSchema = new mongoose.Schema({
  user_id: {
    type: String,
    ref: "Student",
    required: true,
  },
  courses: [
    {
      course_id: {
        type: String,
        ref: "Course",
        required: true,
      },
      added_at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

module.exports = mongoose.model("Wishlist", WishlistSchema);
