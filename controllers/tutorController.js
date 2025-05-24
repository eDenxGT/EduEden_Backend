const Tutor = require("../models/tutorModel");
const Student = require("../models/studentModel");
const Order = require("../models/orderModel");
const Course = require("../models/courseModel");
const Withdrawal = require("../models/withdrawalModel");

const { comparePassword, hashPassword } = require("../utils/passwordUtils");

const updateTutor = async (req, res) => {
  try {
    const { tutorId, currentPassword, newPassword, ...updatedFields } =
      req.body;
    const tutor = await Tutor.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    if (
      updatedFields.user_name &&
      updatedFields.user_name !== tutor.user_name
    ) {
      const existingTutor = await Tutor.findOne({
        user_name: updatedFields.user_name,
        _id: { $ne: tutorId },
      });
      const existingStudent = await Student.findOne({
        user_name: updatedFields.user_name,
      });

      if (existingTutor || existingStudent) {
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    if (updatedFields.email && updatedFields.email !== tutor.email) {
      const existingTutor = await Tutor.findOne({
        email: updatedFields.email,
        _id: { $ne: tutorId },
      });
      const existingStudent = await Student.findOne({
        email: updatedFields.email,
      });

      if (existingTutor || existingStudent) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    if (updatedFields.phone && updatedFields.phone !== tutor.phone) {
      const existingTutor = await Tutor.findOne({
        phone: updatedFields.phone,
        _id: { $ne: tutorId },
      });
      const existingStudent = await Student.findOne({
        phone: updatedFields.phone,
      });

      if (existingTutor || existingStudent) {
        return res.status(400).json({ message: "Phone number already exists" });
      }
    }

    if (currentPassword && typeof tutor.password === "string") {
      const isPasswordValid = await comparePassword(
        currentPassword,
        tutor.password
      );
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid current password" });
      } else if (currentPassword === newPassword) {
        return res.status(400).json({
          message: "New password cannot be the same as the current password",
        });
      }
    }
    if (newPassword) {
      const hashedPassword = await hashPassword(newPassword);
      updatedFields.password = hashedPassword;
    }

    const {
      website,
      instagram,
      linkedin,
      whatsapp,
      youtube,
      title,
      biography,
    } = updatedFields;
    if (title) {
      updatedFields.job_title = title;
    }
    if (biography) {
      updatedFields.bio = biography;
    }
    if (website || instagram || linkedin || whatsapp || youtube) {
      updatedFields.social_profiles = {
        ...tutor.social_profiles,
        website,
        instagram,
        linkedin,
        whatsapp,
        youtube,
      };
    }

    Object.keys(updatedFields).forEach((key) => {
      if (updatedFields[key] !== undefined) {
        tutor[key] = updatedFields[key];
      }
    });

    await tutor.save();

    const { password: _, ...tutorWithoutPassword } = tutor.toObject();

    res.status(200).json({
      message: "Profile updated successfully",
      tutorData: tutorWithoutPassword,
    });
  } catch (error) {
    console.error("Error updating tutor:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getTutorDetails = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { apiFor } = req.query;
    const tutor = await Tutor.findOne({ user_id });
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    if (apiFor === "earningsPage") {
      const tutorDetailsToSent = {
        total_earnings: tutor?.total_revenue,
        total_withdrawn_amount: tutor?.withdrawn_amount,
        current_balance: tutor?.total_revenue - tutor?.withdrawn_amount,
        card: tutor?.card_details || null,
      };
      console.log("dwadaww", tutorDetailsToSent);
      return res.status(200).json({ details: tutorDetailsToSent });
    }
    res.status(200).json({ tutor });
  } catch (error) {
    console.error("Error retrieving tutor details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getTutorEarnings = async (req, res) => {
  try {
    const { user_id } = req.user;
    const tutor = await Tutor.findOne({ user_id });
    console.log(tutor, user_id);
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    const earnings = {
      total_earnings: tutor?.total_revenue,
      total_withdrawn_amount: tutor?.withdrawn_amount,
      current_balance: tutor?.total_revenue - tutor?.withdrawn_amount,
    };
    res.status(200).json({ earnings });
  } catch (error) {
    console.error("Error retrieving tutor earnings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getTutorWithdrawals = async (req, res) => {
  try {
    const { user_id } = req.user;
    const withdrawals = await Withdrawal.find({ tutor_id: user_id });
    if (!withdrawals) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    withdrawals.sort((a, b) => b.requested_at - a.requested_at);
    console.log(withdrawals);
    res.status(200).json({ withdrawals });
  } catch (error) {
    console.error("Error retrieving tutor withdrawals:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const withdrawTutorEarnings = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { method, amount, upi_id } = req.body;
    const tutor = await Tutor.findOne({ user_id });
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    let withdrawal = null;
    if (method === "card") {
      withdrawal = await Withdrawal.create({
        tutor_id: user_id,
        amount,
        payment_method: method,
        card_details: tutor?.card_details,
        requested_at: Date.now(),
      });
    } else if (method === "upi") {
      withdrawal = await Withdrawal.create({
        tutor_id: user_id,
        amount,
        payment_method: method,
        upi_id,
        requested_at: Date.now(),
      });
    } else {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    tutor.withdrawn_amount += Number(amount);
    await tutor.save();
    res
      .status(200)
      .json({
        message: "Withdrawal Request Submitted. Wait for the approval",
        withdrawal,
      });
  } catch (error) {
    console.error("Error withdrawing tutor earnings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const addCard = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { card } = req.body;
    console.log("carddetails", card);
    const tutor = await Tutor.findOne({ user_id });
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    tutor.card_details = card;
    await tutor.save();
    res.status(200).json({ message: "Card added successfully" });
  } catch (error) {
    console.error("Error adding card:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getCourseDetailsByTutorId = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { apiFor } = req.query;
    const courses = await Course.find({ tutor_id: user_id });
    if (!courses) {
      return res.status(404).json({ message: "Course not found" });
    }
    if (apiFor === "earningsPage") {
      const coursesDetailsToSent = courses.map((course) => ({
        title: course?.title,
        course_id: course?.course_id,
        total_revenue: course?.enrolled_count * course?.price,
      }));
      return res.status(200).json({ courses: coursesDetailsToSent });
    }
    res.status(200).json({ courses });
  } catch (error) {
    console.error("Error retrieving course details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  updateTutor,
  getTutorDetails,
  getTutorEarnings,
  getTutorWithdrawals,
  withdrawTutorEarnings,
  addCard,
  getCourseDetailsByTutorId,
};
