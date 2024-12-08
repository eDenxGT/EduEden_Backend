const Student = require("../models/studentModel");
const Tutor = require("../models/tutorModel");

const { comparePassword, hashPassword } = require("../utils/passwordUtils");

const updateStudent = async (req, res) => {
	try {
		const { studentId, currentPassword, newPassword, ...updatedFields } =
			req.body;

		const student = await Student.findById(studentId);
		if (!student) {
			return res.status(404).json({ message: "Student not found" });
		}

		if (
			updatedFields.user_name &&
			updatedFields.user_name !== student.user_name
		) {
			const existingStudent = await Student.findOne({
				user_name: updatedFields.user_name,
				_id: { $ne: studentId },
			});
			const existingTutor = await Tutor.findOne({
				user_name: updatedFields.user_name,
			});

			if (existingStudent || existingTutor) {
				return res
					.status(400)
					.json({ message: "Username already exists" });
			}
		}

		if (updatedFields.email && updatedFields.email !== student.email) {
			const existingStudent = await Student.findOne({
				email: updatedFields.email,
				_id: { $ne: studentId },
			});
			const existingTutor = await Tutor.findOne({
				email: updatedFields.email,
			});

			if (existingStudent || existingTutor) {
				return res
					.status(400)
					.json({ message: "Email already exists" });
			}
		}

		if (updatedFields.phone && updatedFields.phone !== student.phone) {
			const existingStudent = await Student.findOne({
				phone: updatedFields.phone,
				_id: { $ne: studentId },
			});
			const existingTutor = await Tutor.findOne({
				phone: updatedFields.phone,
			});

			if (existingStudent || existingTutor) {
				return res
					.status(400)
					.json({ message: "Phone number already exists" });
			}
		}

		
		if (currentPassword && typeof student.password === "string") {

			const isPasswordValid = await comparePassword(
				currentPassword,
				student.password
			);
			if (!isPasswordValid) {
				return res
					.status(401)
					.json({ message: "Invalid current password" });
			} else if (currentPassword === newPassword) {
				return res.status(400).json({
					message:
						"New password cannot be the same as the current password",
				});
			}
		}

		if (newPassword) {
			const hashedPassword = await hashPassword(newPassword);
			updatedFields.password = hashedPassword;
		}

		Object.keys(updatedFields).forEach((key) => {
			if (updatedFields[key] !== undefined) {
				student[key] = updatedFields[key];
			}
		});

		await student.save();

		const { password: _, ...studentWithoutPassword } = student.toObject();

		res.status(200).json({
			message: "Profile updated successfully",
			studentData: studentWithoutPassword,
		});
	} catch (error) {
		console.error("Error updating student:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

const getStudentDetails = async (req, res) => {
	try {
		const { student_id } = req.params;
		console.log(student_id);
		const student = await Student.findOne({ user_id: student_id });

		if (!student) {
			return res.status(404).json({ message: "Student not found" });
		}
		res.status(200).json({ student });
	} catch (error) {
		console.error("Error retrieving student:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

module.exports = {
	updateStudent,
	getStudentDetails,
};
