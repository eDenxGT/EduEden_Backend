const Tutor = require("../models/tutorModel");
const Student = require("../models/studentModel");
const Order = require("../models/orderModel");
const Withdrawal = require("../models/withdrawalModel");

const { comparePassword, hashPassword } = require("../utils/passwordUtils");

const updateTutor = async (req, res) => {
  try {
    const { tutorId, currentPassword, newPassword, ...updatedFields } =
      req.body;
    console.log(updatedFields);
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
	console.log(tutor);
    if (apiFor === "earningsPage") {
      const tutorDetailsToSent = {
        total_earnings: tutor?.total_revenue,
        total_withdrawn_amount: tutor?.withdrawn_amount,
        current_balance: tutor?.total_revenue - tutor?.withdrawn_amount,
		card: tutor?.card_details || null
      };
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
    res.status(200).json({ earnings: tutor });
  } catch (error) {
    console.error("Error retrieving tutor earnings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getTutorWithdrawals = async (req, res) => {
  try {
    const { user_id } = req.user;
    const tutor = await Tutor.findOne({ user_id });
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    res.status(200).json({ withdrawals: tutor.withdrawals });
  } catch (error) {
    console.error("Error retrieving tutor withdrawals:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const withdrawTutorEarnings = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { amount } = req.body;
    const tutor = await Tutor.findOne({ user_id });
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    tutor.earnings -= amount;
    tutor.withdrawals += amount;
    await tutor.save();
    res.status(200).json({ message: "Withdrawal successful" });
  } catch (error) {
    console.error("Error withdrawing tutor earnings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const addCard = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { card } = req.body;
    const tutor = await Tutor.findOne({ user_id });
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    tutor.cards.push(card);
    await tutor.save();
    res.status(200).json({ message: "Card added successfully" });
  } catch (error) {
    console.error("Error adding card:", error);
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
};
