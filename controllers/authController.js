//* ====== Import Required Models ====== *//
const UnverifiedUser = require("../models/unverifiedUserModel");
const Student = require("../models/studentModel");
const Tutor = require("../models/tutorModel");
const Admin = require("../models/adminModel");
const RefreshToken = require("../models/refreshTokenModel");
const Otp = require("../models/otpModel");

//* ====== Import Modules and Functions ====== *//
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const { OAuth2Client } = require("google-auth-library");
const chalk = require("chalk");
dotenv.config();
const { hashPassword, comparePassword } = require("../utils/passwordUtils");
const {
  sendOTPEmail,
  sendPasswordResetEmail,
  sendOTPEmailForUpdate,
} = require("../utils/emailUtils");
const storeToken = require("../utils/JWT/storeCookie");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/JWT/generateTokens");
const { sendPhoneVerification } = require("../utils/smsUtils");

const FRONTEND_URL = process.env.CLIENT_URL;
const JWT_SECRET = process.env.JWT_SECRET;

const createToken = (data) => {
  return jwt.sign({ id: data }, JWT_SECRET, { expiresIn: "4m" });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const studentSignUp = async (req, res) => {
  try {
    const { full_name, user_name, email, phone, password } = req.body;

    const isTutorExists = await Tutor.findOne({
      $or: [{ email }, { user_name }, { phone }],
    });

    const isUserVerified = await Student.findOne({
      $or: [{ email }, { user_name }, { phone }],
    });
    const isUserExists = await UnverifiedUser.findOne({
      $or: [{ email }, { user_name }, { phone }],
    });

    if (isUserExists || isUserVerified || isTutorExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await hashPassword(password);

    const otp = generateOTP();
    console.log(chalk.green(`OTP:${chalk.yellow(otp)} `));

    const otpExpiry = Date.now() + 60000;

    const unverifiedStudent = new UnverifiedUser({
      full_name,
      user_name,
      email,
      phone,
      password: hashedPassword,
      otp,
      otpExpiry,
      role: "student",
    });

    await unverifiedStudent.save();

    await sendOTPEmail(email, otp);

    return res.status(201).json({
      message: "OTP sent to your email.",
    });
  } catch (error) {
    console.log("SignUp Error: ", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const studentSignIn = async (req, res) => {
  try {
    const { email, password, remember } = req.body;

    const student = await Student.findOne({
      $or: [{ email }, { user_name: email }],
    });

    const isTutorAccount = await Tutor.findOne({
      $or: [{ email }, { user_name: email }],
    });

    if (isTutorAccount) {
      return res
        .status(400)
        .json({ message: "This account is a tutor account" });
    }

    const isUserUnverified = await UnverifiedUser.findOne({
      $or: [{ email }, { user_name: email }],
    });

    if (isUserUnverified && isUserUnverified.role !== "student") {
      return res
        .status(400)
        .json({ message: "This account is a tutor account" });
    }

    if (isUserUnverified) {
      return res
        .status(403)
        .json({ not_verified: true, message: "Verify your email" });
    }

    if (!student && !isUserUnverified) {
      return res.status(400).json({ message: "Account not found" });
    }

    const isMatch = await comparePassword(password, student?.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect Password" });
    }

    if (student.is_blocked) {
      return res.status(401).json({
        message:
          "Your account has been blocked. Please contact the support team.",
      });
    }

    const studentDataToGenerateToken = {
      _id: student?._id,
      email: student?.email,
      user_id: student?.user_id,
      role: "student",
    };

    const accessToken = generateAccessToken(
      "student",
      studentDataToGenerateToken
    );
    const refreshToken = generateRefreshToken(
      "student",
      studentDataToGenerateToken
    );
    console.log(accessToken, refreshToken);

    const newRefreshToken = new RefreshToken({
      token: refreshToken,
      user: studentDataToGenerateToken?.role,
      user_id: studentDataToGenerateToken?._id,
      expires_at: remember
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    const savedToken = await newRefreshToken.save();

    const { password: _, ...studentDetails } = student.toObject();

    if (savedToken) {
      storeToken(
        "studentRefreshToken",
        refreshToken,
        remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
        res
      );

      res.status(200).json({
        success: true,
        message: "Student login successfully",
        studentData: studentDetails,
        accessToken,
        role: "student",
      });
    }
  } catch (error) {
    console.log("SignIn Error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const unverifiedUser = await UnverifiedUser.findOne({ email });

    if (!unverifiedUser) {
      return res.status(400).json({ message: "User not found." });
    }

    if (unverifiedUser.otp != otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (Date.now() > unverifiedUser.otpExpiry) {
      return res.status(400).json({ message: "OTP has expired" });
    }
    const randomPart = Math.random().toString(36).substring(2, 6);
    const timestampPart = Date.now().toString().slice(-4);
    const uniqueUserId = `edueden${randomPart}${timestampPart}`;

    let userData;
    if (unverifiedUser.role === "student") {
      userData = new Student({
        full_name: unverifiedUser.full_name,
        user_name: unverifiedUser.user_name,
        email: unverifiedUser.email,
        phone: unverifiedUser.phone,
        password: unverifiedUser.password,
        is_verified: true,
        user_id: uniqueUserId,
      });
      await userData.save();
    } else if (unverifiedUser.role === "tutor") {
      userData = new Tutor({
        full_name: unverifiedUser.full_name,
        user_name: unverifiedUser.user_name,
        email: unverifiedUser.email,
        phone: unverifiedUser.phone,
        password: unverifiedUser.password,
        is_verified: true,
        user_id: uniqueUserId,
        field_name: unverifiedUser.field_name,
        experience: unverifiedUser.experience,
        is_identity_verified: "pending",
      });
      await userData.save();
    }

    const { password: _, ...otherDetails } = userData.toObject();

    const token = createToken(userData._id);

    await UnverifiedUser.deleteOne({ email });

    res.status(200).json({
      message: "Email verified successfully.",
      userData: otherDetails,
      token: token,
    });
  } catch (error) {
    console.log("OTP Verification Error: ", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email, role } = req.body;
    const unverifiedUser = await UnverifiedUser.findOne({ email });

    if (!unverifiedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (unverifiedUser.role !== role && role === "student") {
      return res.status(400).json({ message: "This is a Tutor Account" });
    } else if (unverifiedUser.role !== role && role === "tutor") {
      return res.status(400).json({ message: "This is a Student Account" });
    }

    const remainingTime = unverifiedUser.otpExpiry - Date.now();

    if (remainingTime <= 5000) {
      unverifiedUser.otp = generateOTP();
      unverifiedUser.otpExpiry = new Date(Date.now() + 120000);
    }
    await unverifiedUser.save();
    console.log(
      chalk.greenBright(`Resent OTP:${chalk.yellowBright(unverifiedUser.otp)} `)
    );

    await sendOTPEmail(email, unverifiedUser.otp);

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully.",
    });
  } catch (error) {
    console.log("OTP Resent error: ", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while resending OTP.",
    });
  }
};

// const googleAuth = async (req, res) => {
// 	const { token, role } = req.body;

// 	if (!token || !role) {
// 		return res.status(400).json({ error: "Token and role are required" });
// 	}

// 	if (!["student", "tutor"].includes(role)) {
// 		return res.status(400).json({ error: "Invalid role specified" });
// 	}

// 	try {
// 		const client = new OAuth2Client({
// 			clientId: process.env.GOOGLE_CLIENT_ID,
// 			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
// 		});

// 		const ticket = await client.verifyIdToken({
// 			idToken: token,
// 			audience: process.env.GOOGLE_CLIENT_ID,
// 		});

// 		const payload = ticket.getPayload();

// 		if (!payload.email_verified) {
// 			console.log("Unverified email: ", payload.email);
// 			return res.status(401).json({ message: "Email not verified" });
// 		}

// 		const { name, email, sub, picture } = payload;

// 		const isOtherRoleExists = await (async () => {
// 			if (role === "student") {
// 				return await Tutor.findOne({ email });
// 			} else if (role === "tutor") {
// 				return await Student.findOne({ email });
// 			}
// 			return false;
// 		})();

// 		if (isOtherRoleExists) {
// 			return res.status(401).json({
// 				message: `This account is a ${
// 					role === "student" ? "Tutor" : "Student"
// 				} account.`,
// 			});
// 		}

// 		const User = role === "student" ? Student : Tutor;

// 		let user = await User.findOne({ email });

// 		if (user && user.is_blocked) {
// 			return res.status(401).json({
// 				message:
// 					"Your account has been blocked. Please contact the support team.",
// 			});
// 		}

// 		if (!user) {
// 			user = new User({
// 				full_name: name,
// 				email,
// 				google_id: sub,
// 				avatar: picture,
// 			});
// 		} else if (!user.google_id) {
// 			user.google_id = sub;
// 			if (!user.avatar) {
// 				user.avatar = picture;
// 			}
// 		}
// 		await user.save();

// 		const userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
// 			expiresIn: "1d",
// 		});

// 		const { password, ...userDetails } = user.toObject();

// 		return res
// 			.status(200)
// 			.json({ token: userToken, userData: userDetails });
// 	} catch (error) {
// 		console.error("Google Auth Error: ", error.stack || error);
// 		res.status(500).json({
// 			message: "Internal server error. Please try again.",
// 		});
// 	}
// };

const googleAuth = async (req, res) => {
  const { token, role } = req.body;

  if (!token || !role) {
    return res.status(400).json({ error: "Token and role are required" });
  }

  if (!["student", "tutor"].includes(role)) {
    return res.status(400).json({ error: "Invalid role specified" });
  }

  try {
    const client = new OAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    });

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload.email_verified) {
      console.log("Unverified email: ", payload.email);
      return res.status(401).json({ message: "Email not verified" });
    }

    const { name, email, sub, picture } = payload;

    const isOtherRoleExists = await (async () => {
      if (role === "student") {
        return await Tutor.findOne({ email });
      } else if (role === "tutor") {
        return await Student.findOne({ email });
      }
      return false;
    })();

    if (isOtherRoleExists) {
      return res.status(401).json({
        message: `This account is a ${
          role === "student" ? "Tutor" : "Student"
        } account.`,
      });
    }

    const User = role === "student" ? Student : Tutor;

    let user = await User.findOne({ email });

    if (user && user.is_blocked) {
      return res.status(401).json({
        message:
          "Your account has been blocked. Please contact the support team.",
      });
    }
    
    if (role === "tutor") {
      if (user.is_identity_verified === "pending") {
        return res.status(403).json({
          message: "Account verification in progress. Please try again later.",
          under_identity_verification: true,
        });
      } else if (user.is_identity_verified === "rejected") {
        return res.status(403).json({
          message:
            "Your account has been rejected. Please contact the support team.",
          under_identity_verification: true,
        });
      }
    }

    const randomPart = Math.random().toString(36).substring(2, 6);
    const timestampPart = Date.now().toString().slice(-4);
    const uniqueUserId = `edueden${randomPart}${timestampPart}`;
  
    if (!user) {
      user = new User({
        full_name: name,
        email,
        google_id: sub,
        avatar: picture,
        user_id: uniqueUserId,
      });
    } else if (!user.google_id) {
      user.google_id = sub;
      if (!user.avatar) {
        user.avatar = picture;
      }
    }
    await user.save();

    const userDataToGenerateToken = {
      _id: user._id,
      user_id: user?.user_id,
      email: user.email,
      role,
    };

    const accessToken = generateAccessToken(role, userDataToGenerateToken);
    const refreshToken = generateRefreshToken(role, userDataToGenerateToken);

    const newRefreshToken = new RefreshToken({
      token: refreshToken,
      user: role,
      user_id: user._id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const savedToken = await newRefreshToken.save();

    const { password, ...userDetails } = user.toObject();

    if (savedToken) {
      storeToken(
        `${role}RefreshToken`,
        refreshToken,
        7 * 24 * 60 * 60 * 1000,
        res
      );

      return res.status(200).json({
        success: true,
        message: `${
          role.charAt(0).toUpperCase() + role.slice(1)
        } logged in successfully`,
        userData: userDetails,
        accessToken,
        role,
      });
    }

    res.status(500).json({ message: "Failed to log in" });
  } catch (error) {
    console.error("Google Auth Error: ", error.stack || error);
    res.status(500).json({
      message: "Internal server error. Please try again.",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email, role } = req.body;
    console.log(req.body);

    let user;

    if (role === "student") {
      user = await Student.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
    } else if (role === "tutor") {
      user = await Tutor.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
    } else if (role === "admin") {
      user = await Admin.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
    } else {
      return res.status(400).json({ error: "No roles Found." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const link = `${FRONTEND_URL}/reset-password/${token}?name=${encodeURIComponent(
      user.full_name
    )}&role=${role}`;
    await sendPasswordResetEmail(email, link);

    return res.status(200).json({ message: "Email sent successfully." });
  } catch (error) {
    console.error("Forgot Password Error: ", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const role = req.query.role;
    const { newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Password does not match" });
    }
    let user;

    if (role === "student") {
      user = await Student.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() },
      });
    } else if (role === "tutor") {
      user = await Tutor.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() },
      });
    } else if (role === "admin") {
      user = await Admin.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() },
      });
    }
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }
    const oldPassword = await comparePassword(
      newPassword,
      user?.password || ""
    );
    if (oldPassword) {
      return res
        .status(400)
        .json({ message: "Password cannot be same as old password" });
    }

    const hashedPassword = await hashPassword(newPassword);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    return res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log("Reset password Error: ", error);
  }
};

const tutorSignUp = async (req, res) => {
  try {
    const {
      full_name,
      user_name,
      email,
      phone,
      password,
      field_name,
      experience,
    } = req.body;
    console.log(req.body);

    const isUserVerified = await Tutor.findOne({
      $or: [{ email }, { user_name }, { phone }],
    });
    const isStudentExists = await Student.findOne({ email });
    const isUserExists = await UnverifiedUser.findOne({
      $or: [{ email }, { user_name }, { phone }],
    });

    if (isUserVerified || isStudentExists || isUserExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await hashPassword(password);

    const otp = generateOTP();
    console.log(chalk.greenBright(`OTP:${chalk.yellowBright(otp)} `));

    const otpExpiry = Date.now() + 60000;

    const unverifiedTutor = new UnverifiedUser({
      full_name,
      user_name,
      email,
      phone,
      password: hashedPassword,
      otp,
      otpExpiry,
      field_name,
      experience,
      role: "tutor",
    });

    await unverifiedTutor.save();

    await sendOTPEmail(email, otp);

    return res.status(201).json({
      message: "OTP sent to your email.",
    });
  } catch (error) {
    console.log("Tutor SignUp Error: ", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const tutorSignIn = async (req, res) => {
  try {
    const { email, password, remember } = req.body;
    const tutor = await Tutor.findOne({
      $or: [{ email }, { user_name: email }],
    });

    const isStudentAccount = await Student.findOne({
      $or: [{ email }, { user_name: email }],
    });

    if (isStudentAccount) {
      return res
        .status(400)
        .json({ message: "This account is a student account" });
    }

    const isUserUnverified = await UnverifiedUser.findOne({
      $or: [{ email }, { user_name: email }],
    });

    if (isUserUnverified && isUserUnverified.role !== "tutor") {
      return res
        .status(400)
        .json({ message: "This account is a student account" });
    }

    if (isUserUnverified) {
      return res
        .status(403)
        .json({ not_verified: true, message: "Verify your email" });
    }

    if (!tutor && !isUserUnverified) {
      return res.status(400).json({ message: "Account not found" });
    }

    const isMatch = await comparePassword(password, tutor?.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect Password" });
    }
    if (tutor.is_identity_verified === "pending") {
      return res.status(403).json({
        message: "Account verification in progress. Please try again later.",
        under_identity_verification: true,
      });
    } else if (tutor.is_identity_verified === "rejected") {
      return res.status(403).json({
        message:
          "Your account has been rejected. Please contact the support team.",
        under_identity_verification: true,
      });
    }

    if (tutor.is_blocked) {
      return res.status(401).json({
        message:
          "Your account has been blocked. Please contact the support team.",
      });
    }

    const tutorDataToGenerateToken = {
      _id: tutor?._id,
      user_id: tutor?.user_id,
      email: tutor?.email,
      role: "tutor",
    };

    const accessToken = generateAccessToken("tutor", tutorDataToGenerateToken);
    const refreshToken = generateRefreshToken(
      "tutor",
      tutorDataToGenerateToken
    );

    const newRefreshToken = new RefreshToken({
      token: refreshToken,
      user: tutorDataToGenerateToken?.role,
      user_id: tutorDataToGenerateToken?._id,
      expires_at: remember
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const savedToken = await newRefreshToken.save();

    const { password: _, ...tutorDetails } = tutor.toObject();

    if (savedToken) {
      storeToken(
        "tutorRefreshToken",
        refreshToken,
        remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
        res
      );

      return res.status(200).json({
        success: true,
        message: "Tutor logged in successfully",
        tutorData: tutorDetails,
        accessToken,
        role: "tutor",
      });
    }
  } catch (error) {
    console.log("SignIn Error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const adminSignIn = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({
      $or: [{ email }, { user_name: email }],
    });
    if (!admin) {
      return res.status(400).json({ message: "Account not found" });
    }

    const isMatch = await comparePassword(password, admin?.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect Password" });
    }
    const adminDataToGenerateToken = {
      _id: admin?._id,
      email: admin?.email,
      role: "admin",
    };

    const accessToken = generateAccessToken("admin", adminDataToGenerateToken);
    const refreshToken = generateRefreshToken(
      "admin",
      adminDataToGenerateToken
    );
    // console.log(accessToken,"fffe", refreshToken);

    const newRefreshToken = new RefreshToken({
      token: refreshToken,
      user: adminDataToGenerateToken?.role,
      user_id: adminDataToGenerateToken?._id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    const savedToken = await newRefreshToken.save();

    const { password: _, ...adminDetails } = admin.toObject();

    if (savedToken) {
      storeToken(
        "adminRefreshToken",
        refreshToken,
        7 * 24 * 60 * 60 * 1000,
        res
      );

      res.status(200).json({
        message: "Admin logged in successfully",
        adminData: adminDetails,
        success: true,
        accessToken,
        role: "admin",
      });
    }
  } catch (error) {
    console.log("Admin Sign In Error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const refreshAccessToken = async (req, res) => {
  console.log(chalk.greenBright("~~~~~Refreshing Token~~~~~"));
  console.log(req.cookies);
  try {
    const refreshToken =
      req?.cookies?.studentRefreshToken ||
      req?.cookies?.adminRefreshToken ||
      req?.cookies?.tutorRefreshToken;

    if (!refreshToken) {
      console.log(chalk.redBright("~~~~~Refreshing Failed~~~~~"));
      return res.status(403).json({
        message: "Refresh token expired. Login to your account",
        success: false,
      });
    }

    const tokenDoc = await RefreshToken.findOne({ token: refreshToken });
    if (!tokenDoc) {
      console.log(chalk.redBright("~~~~~Refreshing Failed~~~~~"));
      return res.status(403).json({
        message: "Invalid refresh token",
        success: false,
      });
    }

    const roleSecrets = {
      student: {
        refreshSecret: process.env.JWT_STUDENT_REFRESH_TOKEN_SECRET,
        accessSecret: process.env.JWT_STUDENT_ACCESS_TOKEN_SECRET,
      },
      tutor: {
        refreshSecret: process.env.JWT_TUTOR_REFRESH_TOKEN_SECRET,
        accessSecret: process.env.JWT_TUTOR_ACCESS_TOKEN_SECRET,
      },
      admin: {
        refreshSecret: process.env.JWT_ADMIN_REFRESH_TOKEN_SECRET,
        accessSecret: process.env.JWT_ADMIN_ACCESS_TOKEN_SECRET,
      },
    };

    const { user: role, expiresAt } = tokenDoc;

    if (!roleSecrets[role]) {
      return res.status(403).json({
        message: "Invalid role in refresh token",
        success: false,
        role,
      });
    }

    const { refreshSecret, accessSecret } = roleSecrets[role];

    if (expiresAt <= new Date()) {
      await RefreshToken.deleteOne({ token: refreshToken });

      res.clearCookie(`${role}RefreshToken`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      });

      return res.status(403).json({
        message: "Refresh token expired. Login to your account",
        success: false,
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, refreshSecret);

      const newAccessToken = jwt.sign(
        {
          _id: decoded?.data?._id,
          email: decoded?.data?.email,
          role: decoded?.data?.role,
		  user_id: decoded?.data?.user_id,
        },
        accessSecret,

        { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES }
      );
      console.log(
        chalk.cyanBright(
          "New Access Token:",
          chalk.magentaBright(newAccessToken)
        )
      );
      console.log(chalk.greenBright("~~~~~Refreshing Completed~~~~~"));

      return res.status(200).json({
        message: "Access Token created successfully",
        success: true,
        access_token: newAccessToken,
        role,
      });
    } catch (err) {
      console.error("Invalid Refresh Token:", err.message);
      return res.status(403).json({
        message: "Invalid refresh token",
        success: false,
      });
    }
  } catch (error) {
    console.error("Error in Refresh Token:", error.message);
    return res.status(500).json({
      message: "Something went wrong",
      success: false,
      error: error.message,
    });
  }
};

const userLogout = async (req, res) => {
  const { role } = req.body;
  console.log("role", role);
  const refreshToken = req.cookies[`${role}RefreshToken`];
  if (!refreshToken) {
    return res.status(403).json({
      message: "Refresh token expired. Login to your account",
      success: false,
    });
  }

  await RefreshToken.deleteOne({ token: refreshToken });

  res.clearCookie(`${role}RefreshToken`, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  return res.status(200).json({ message: "Logged out successfully." });
};

const sendOtpForProfileUpdate = async (req, res) => {
  try {
    const { role, email } = req.body;
    console.log(role, email);

    if (!role || !email) {
      return res.status(400).json({ error: "Role and email are required." });
    }

    const optExists = await Otp.findOne({ contact: email, type: "email" });
    if (optExists && optExists.role === role) {
      if (optExists.expires_at > new Date()) {
        console.log("existS");
        console.log(chalk.green(`OTP:${chalk.yellow(optExists.otp)} `));
        await sendOTPEmailForUpdate(email, optExists.otp);
        return res.status(200).json({ message: "OTP sent successfully." });
      } else if (optExists.expires_at <= new Date() || optExists.used) {
        console.log("OTP EXPIRED");
        await Otp.deleteOne({ contact: email, type: "email" });
      }
    }

    const validRoles = ["student", "tutor"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role provided." });
    }

    const [student, tutor, unverifiedUser, admin] = await Promise.all([
      Student.findOne({ email }),
      Tutor.findOne({ email }),
      UnverifiedUser.findOne({ email }),
      Admin.findOne({ email }),
    ]);

    const userExists = student || tutor || unverifiedUser || admin;

    console.log(userExists);
    if (userExists) {
      return res.status(404).json({
        message:
          "An account with this email already exists. Please use a different email.",
      });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);
    console.log(chalk.green(`OTP:${chalk.yellow(otp)} `));

    await Otp.create({
      contact: email,
      otp,
      type: "email",
      role,
      expires_at: expiresAt,
    });

    await sendOTPEmailForUpdate(email, otp);

    return res.status(200).json({ message: "OTP sent to your email." });
  } catch (error) {
    console.error("Error in sendOtpForProfileUpdate: ", error);
    return res
      .status(500)
      .json({ error: "Failed to send OTP. Please try again." });
  }
};

const verifyOtpProfileUpdate = async (req, res) => {
  try {
    const { email, otp, role, user_id } = req.body;
    console.log(req.body);
    if (!email || !otp || !role || !user_id) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const otpEntry = await Otp.findOne({
      contact: email,
      otp,
      role,
      type: "email",
    });

    if (!otpEntry) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    if (otpEntry.expires_at < new Date()) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    if (otpEntry.used) {
      return res.status(400).json({ error: "OTP has already been used." });
    }

    await Otp.deleteOne({ _id: otpEntry._id });

    // if (role === "tutor") {
    // 	await Tutor.updateOne(
    // 		{ user_id },
    // 		{ $set: { email,  } }
    // 	);
    // } else {
    // 	await Student.updateOne(
    // 		{ user_id },
    // 		{ $set: { email, updated_at: new Date()} }
    // 	);
    // }

    return res
      .status(200)
      .json({ message: "Email verified. Click on Save Changes to update." });
  } catch (err) {
    console.error("Error in verifyOtpProfileUpdate: ", err);
    return res
      .status(500)
      .json({ error: "Failed to verify OTP. Please try again." });
  }
};

module.exports = {
  studentSignIn,
  studentSignUp,
  verifyOtp,
  resendOtp,
  googleAuth,
  forgotPassword,
  resetPassword,
  tutorSignUp,
  tutorSignIn,
  adminSignIn,
  refreshAccessToken,
  userLogout,
  verifyOtpProfileUpdate,
  sendOtpForProfileUpdate,
};
