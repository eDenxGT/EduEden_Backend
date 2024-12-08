const cron = require("node-cron");
const RefreshToken = require("../models/refreshTokenModel");

cron.schedule("0 0 * * *", async () => {
	try {
		const expiredTokens = await RefreshToken.deleteMany({
			expiresAt: { $lt: new Date() },
		});
      console.log(expiredTokens);
      
      console.log(`Deleted ${expiredTokens.deletedCount} expired refresh tokens.`)
	} catch (error) {
		console.log("Error Cleaning Expired Tokens: ", error);
	}
});
