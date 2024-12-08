const cron = require("node-cron");
const Otp = require("../models/otpModel");

cron.schedule("5 0 * * *", async () => {
	try {
		const expiredOtps = await Otp.deleteMany({
			expires_at: { $lt: new Date() },
		});
		console.log(expiredOtps);
		console.log(`Deleted ${expiredOtps.deletedCount} expired OTPs.`);
	} catch (error) {
		console.log("Error Cleaning Expired Tokens: ", error);
	}
});
