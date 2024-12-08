const nodemailer = require("nodemailer");
const dotenv = require("dotenv").config();

const createTransporter = () => {
	return nodemailer.createTransport({
		service: "Gmail",
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
		tls: {
			rejectUnauthorized: false,
		},
	});
};

const sendEmail = async (email, subject, htmlContent) => {
	try {
		const transporter = createTransporter();
		const mailOptions = {
			from: `"EduEden" <${process.env.EMAIL_USER}>`,
			to: email,
			subject: subject,
			html: htmlContent,
		};

		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.error("Error sending email:", error);
				throw new Error("Error in sending email");
			} else {
				console.log("Email sent:", info.response);
			}
		});
	} catch (error) {
		console.error("Email sending error: ", error);
		throw new Error("Error in sending email");
	}
};
const sendOTPEmail = async (email, otp) => {
	const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
         <!-- Logo Text Section -->
         <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 48px; font-weight: bold; margin: 0;">
               🎓 <span style="color: #333333;">Edu</span><span style="color: #FF5722;">Eden</span>
            </h1>
         </div>

         <h2 style="color: #ff5722; text-align: center; margin-bottom: 30px;">
            Welcome to Your Learning Journey! 🌱
         </h2>
         
         <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            We're excited to have you join our community of learners! Let's make your education journey amazing together. 📚✨
         </p>
         
         <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
            <p style="margin-bottom: 10px; font-size: 16px;">Your verification code is:</p>
            <h1 style="background-color: #f2f2f2; color: #ff5722; font-size: 36px; margin: 10px 0; padding: 20px; border-radius: 8px; letter-spacing: 5px;">
               ${otp}
            </h1>
            <p style="color: #666; font-size: 14px;">
               ⏰ Code expires in 2 minutes
            </p>
         </div>
         
         <p style="font-size: 14px; color: #666; margin-top: 20px;">
            🔒 For your security, please don't share this code with anyone.
         </p>
         
         <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="font-size: 14px; color: #888;">
               Questions? We're here to help! 💡<br>
               Contact us at <a href="mailto:support@edueden.com" style="color: #ff5722; text-decoration: none;">support@edueden.com</a>
            </p>
         </div>

         <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #888;">
            © ${new Date().getFullYear()} EduEden. All rights reserved.
         </div>
      </div>
   `;

	const subject = "🔑 Verify Your EduEden Account";
	await sendEmail(email, subject, htmlContent);
};

const sendWelcomeMail = async (email) => {
	const subject = "Welcome to EduEden";
	sendEmail(email, subject);
};

const sendPasswordResetEmail = async (email, resetLink) => {
	console.log(resetLink);

	const htmlContent = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background: #fff;">
    <div style="text-align: center; margin-bottom: 30px; position: relative;">
        <h1 style="font-size: 48px; font-weight: bold; margin: 0;">
            🎓 <span style="color: #333333;">Edu</span><span style="color: #FF5722;">Eden</span>
        </h1>
        <p style="color: #666; font-size: 16px; margin: 10px 0 0 0;">Your Learning Journey Continues</p>
    </div>

    <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #ff5722; font-size: 28px; margin: 0;">
            Password Reset Request 🔐
        </h2>
        <p style="color: #666; font-size: 16px; margin: 10px 0 0 0;">
            Don't worry, we'll help you get back on track! ✨
        </p>
    </div>

    <div style="border: 2px border-radius: 15px; padding: 25px; margin-bottom: 25px; background: linear-gradient(to bottom, #fff, #fcfcfc);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; text-align: center;">
            We received a request to reset your password for your EduEden account. 
            Your security is our top priority! 🛡️
        </p>
        
        <!-- Action Button Section -->
        <div style=" border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
            <p style="margin-bottom: 20px; font-size: 16px; color: #444;">
                Click the button below to securely reset your password:
            </p>
            
            <a href="${resetLink}" style="background-color: #FF5722; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 500; display: inline-block; margin: 10px 0; font-size: 16px; box-shadow: 0 2px 4px rgba(255, 87, 34, 0.2); transition: all 0.3s ease;">
                Reset Password 🔐
            </a>

            <p style="color: #666; font-size: 14px; margin-top: 20px;">
                ⏰ For security, this link expires in 60 minutes
            </p>
        </div>
    </div>

    <div style=" border-radius: 8px; padding: 20px; margin: 25px 0; background-color: #FFF8E1; box-shadow: 0 2px 8px rgba(255, 184, 0, 0.15);">
        <div style="text-align: left; margin-bottom: 15px; display: flex; align-items: center;">
            <span style="font-size: 24px; margin-right: 10px;">⚠️</span>
            <h3 style="color: #B76E00; margin: 0; font-size: 18px;">Security Reminders</h3>
        </div>
        <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="font-size: 14px; color: #8B5800; margin: 8px 0; display: flex; align-items: center;">
                <span style="color: #FFB800; margin-right: 8px;">•</span> Never share this link with anyone
            </li>
            <li style="font-size: 14px; color: #8B5800; margin: 8px 0; display: flex; align-items: center;">
                <span style="color: #FFB800; margin-right: 8px;">•</span> EduEden will never ask for your password
            </li>
            <li style="font-size: 14px; color: #8B5800; margin: 8px 0; display: flex; align-items: center;">
                <span style="color: #FFB800; margin-right: 8px;">•</span> Ensure you're on our official website before logging in
            </li>
        </ul>
    </div>

    <div style="margin-top: 30px; padding: 20px; border-top: 2px dashed #eee; text-align: center; background-color: #fafafa; border-radius: 12px;">
        <p style="font-size: 16px; color: #666; margin-bottom: 10px;">
            Need assistance? We're here to help! 💫
        </p>
        <a href="mailto:support@edueden.in" style="color: #ff5722; text-decoration: none; font-weight: 500; font-size: 16px;">
            support@edueden.in
        </a>
    </div>

    <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #888; margin: 0;">
            © ${new Date().getFullYear()} EduEden. All rights reserved. 
            <br>
            <span style="color: #FF5722;">✦</span> Empowering Education <span style="color: #FF5722;">✦</span>
        </p>
    </div>
</div>
   `;

	const subject = "🔑 Reset Your EduEden Password";
	await sendEmail(email, subject, htmlContent);
};

const sendTutorAcceptanceEmail = async (email, tutorName, dashboardLink) => {
	const htmlContent = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background: #fff;">
    <div style="text-align: center; margin-bottom: 30px; position: relative;">
        <h1 style="font-size: 48px; font-weight: bold; margin: 0;">
            🎓 <span style="color: #333333;">Edu</span><span style="color: #FF5722;">Eden</span>
        </h1>
        <p style="color: #666; font-size: 16px; margin: 10px 0 0 0;">Empowering Education Together</p>
    </div>

    <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #ff5722; font-size: 28px; margin: 0;">
            Congratulations, ${tutorName}! 🎉
        </h2>
        <p style="color: #666; font-size: 16px; margin: 10px 0 0 0;">
            Your journey as an EduEden instructor begins now! 🚀
        </p>
    </div>

    <div style="border: 2px solid #f0f0f0; border-radius: 15px; padding: 25px; margin-bottom: 25px; background: linear-gradient(to bottom, #fff, #fcfcfc);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; text-align: center;">
            We're thrilled to inform you that your application to become an instructor has been accepted! 
            Welcome to the EduEden family of educators. 🌟
        </p>
        
        <!-- Action Button Section -->
        <div style="border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
            <p style="margin-bottom: 20px; font-size: 16px; color: #444;">
                To get started with creating and uploading your courses, click the button below:
            </p>
            
            <a href="${dashboardLink}" style="background-color: #FF5722; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 500; display: inline-block; margin: 10px 0; font-size: 16px; box-shadow: 0 2px 4px rgba(255, 87, 34, 0.2); transition: all 0.3s ease;">
                Access Instructor Login 📚
            </a>
        </div>
    </div>

    <div style="border-radius: 8px; padding: 20px; margin: 25px 0; background-color: #E3F2FD; box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15);">
        <div style="text-align: left; margin-bottom: 15px; display: flex; align-items: center;">
            <span style="font-size: 24px; margin-right: 10px;">📋</span>
            <h3 style="color: #1565C0; margin: 0; font-size: 18px;">Your Responsibilities</h3>
        </div>
        <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="font-size: 14px; color: #0D47A1; margin: 8px 0; display: flex; align-items: center;">
                <span style="color: #2196F3; margin-right: 8px;">•</span> Create engaging and informative course content
            </li>
            <li style="font-size: 14px; color: #0D47A1; margin: 8px 0; display: flex; align-items: center;">
                <span style="color: #2196F3; margin-right: 8px;">•</span> Upload high-quality video lectures and materials
            </li>
            <li style="font-size: 14px; color: #0D47A1; margin: 8px 0; display: flex; align-items: center;">
                <span style="color: #2196F3; margin-right: 8px;">•</span> Interact with students and provide timely feedback
            </li>
            <li style="font-size: 14px; color: #0D47A1; margin: 8px 0; display: flex; align-items: center;">
                <span style="color: #2196F3; margin-right: 8px;">•</span> Maintain and update your courses regularly
            </li>
        </ul>
    </div>

    <div style="margin-top: 30px; padding: 20px; border-top: 2px dashed #eee; text-align: center; background-color: #fafafa; border-radius: 12px;">
        <p style="font-size: 16px; color: #666; margin-bottom: 10px;">
            Need assistance? Our instructor support team is here to help! 💫
        </p>
        <a href="mailto:instructor-support@edueden.in" style="color: #ff5722; text-decoration: none; font-weight: 500; font-size: 16px;">
            instructor-support@edueden.in
        </a>
    </div>

    <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #888; margin: 0;">
            © ${new Date().getFullYear()} EduEden. All rights reserved. 
            <br>
            <span style="color: #FF5722;">✦</span> Empowering Education Together <span style="color: #FF5722;">✦</span>
        </p>
    </div>
</div>
    `;

	const subject = "🎊 Welcome to EduEden's Instructor Community!";
	await sendEmail(email, subject, htmlContent);
};

const sendTutorRejectionEmail = async (email, applicantName, supportLink) => {
	const htmlContent = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background: #fff;">
    <div style="text-align: center; margin-bottom: 30px; position: relative;">
        <h1 style="font-size: 48px; font-weight: bold; margin: 0;">
            🎓 <span style="color: #333333;">Edu</span><span style="color: #FF5722;">Eden</span>
        </h1>
        <p style="color: #666; font-size: 16px; margin: 10px 0 0 0;">Empowering Education Together</p>
    </div>

    <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #ff5722; font-size: 28px; margin: 0;">
            Application Update
        </h2>
        <p style="color: #666; font-size: 16px; margin: 10px 0 0 0;">
            Thank you for your interest in becoming an EduEden instructor
        </p>
    </div>

    <div style="border: 2px solid #f0f0f0; border-radius: 15px; padding: 25px; margin-bottom: 25px; background: linear-gradient(to bottom, #fff, #fcfcfc);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; text-align: center;">
            Dear ${applicantName},
            <br><br>
            We appreciate the time and effort you put into your application to become an instructor at EduEden. 
            After careful consideration, we regret to inform you that we are unable to accept your application at this time.
        </p>
        
        <!-- Action Button Section -->
        <div style="border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
            <p style="margin-bottom: 20px; font-size: 16px; color: #444;">
                For further inquiries, please reach out to our support team at <a href="mailto:instructor-support@edueden.in" style="color: #FF5722; text-decoration: none;">instructor-support@edueden.in</a>.
            </p>
        </div>
    </div>

    <div style="border-radius: 8px; padding: 20px; margin: 25px 0; background-color: #FFF3E0; box-shadow: 0 2px 8px rgba(255, 152, 0, 0.15);">
        <div style="text-align: left; margin-bottom: 15px; display: flex; align-items: center;">
            <span style="font-size: 24px; margin-right: 10px;">💡</span>
            <h3 style="color: #E65100; margin: 0; font-size: 18px;">Tips for a Successful Application</h3>
        </div>
        <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="font-size: 14px; color: #E65100; margin: 8px 0; display: flex; align-items: center;">
                <span style="color: #FF9800; margin-right: 8px;">•</span> Showcase your expertise in your chosen subject area
            </li>
            <li style="font-size: 14px; color: #E65100; margin: 8px 0; display: flex; align-items: center;">
                <span style="color: #FF9800; margin-right: 8px;">•</span> Highlight your teaching experience and methodologies
            </li>
            <li style="font-size: 14px; color: #E65100; margin: 8px 0; display: flex; align-items: center;">
                <span style="color: #FF9800; margin-right: 8px;">•</span> Provide a clear and engaging sample lesson or course outline
            </li>
            <li style="font-size: 14px; color: #E65100; margin: 8px 0; display: flex; align-items: center;">
                <span style="color: #FF9800; margin-right: 8px;">•</span> Demonstrate your commitment to student engagement and success
            </li>
        </ul>
    </div>

    <div style="margin-top: 30px; padding: 20px; border-top: 2px dashed #eee; text-align: center; background-color: #fafafa; border-radius: 12px;">
        <p style="font-size: 16px; color: #666; margin-bottom: 10px;">
            Have questions or need further clarification? We're here to help! 💫
        </p>
        <a href="mailto:instructor-support@edueden.in" style="color: #ff5722; text-decoration: none; font-weight: 500; font-size: 16px;">
            instructor-support@edueden.in
        </a>
    </div>

    <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #888; margin: 0;">
            © ${new Date().getFullYear()} EduEden. All rights reserved. 
            <br>
            <span style="color: #FF5722;">✦</span> Empowering Education Together <span style="color: #FF5722;">✦</span>
        </p>
    </div>
</div>
    `;

	const subject = "Update on Your EduEden Instructor Application";
	await sendEmail(email, subject, htmlContent);
};

const sendOTPEmailForUpdate = async (email, otp) => {
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
         <!-- Logo Text Section -->
         <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 48px; font-weight: bold; margin: 0;">
               🎓 <span style="color: #333333;">Edu</span><span style="color: #FF5722;">Eden</span>
            </h1>
         </div>

         <h2 style="color: #ff5722; text-align: center; margin-bottom: 30px;">
            Verify Your New Email Address 📧
         </h2>
         
         <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            You've requested to update your email address on EduEden. To ensure the security of your account, please verify this new email address.
         </p>
         
         <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
            <p style="margin-bottom: 10px; font-size: 16px;">Your verification code is:</p>
            <h1 style="background-color: #f2f2f2; color: #ff5722; font-size: 36px; margin: 10px 0; padding: 20px; border-radius: 8px; letter-spacing: 5px;">
               ${otp}
            </h1>
            <p style="color: #666; font-size: 14px;">
               ⏰ Code expires in 2 minutes
            </p>
         </div>
         
         <p style="font-size: 14px; color: #666; margin-top: 20px;">
            🔒 For your security:
            <ul>
               <li>Don't share this code with anyone.</li>
               <li>Our team will never ask for this code.</li>
               <li>If you didn't request this change, please contact us immediately.</li>
            </ul>
         </p>
         
         <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="font-size: 14px; color: #888;">
               Need assistance? We're here to help! 💡<br>
               Contact us at <a href="mailto:support@edueden.com" style="color: #ff5722; text-decoration: none;">support@edueden.com</a>
            </p>
         </div>

         <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #888;">
            © ${new Date().getFullYear()} EduEden. All rights reserved.
         </div>
      </div>
   `;

    const subject = "🔐 Verify Your New Email Address - EduEden";
    await sendEmail(email, subject, htmlContent);
};

module.exports = {
	sendOTPEmail,
	sendWelcomeMail,
	sendPasswordResetEmail,
	sendTutorAcceptanceEmail,
	sendTutorRejectionEmail,
    sendOTPEmailForUpdate
};
