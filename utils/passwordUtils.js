const bcrypt = require("bcryptjs");

const hashPassword = async (password) => {
	try {
		const hashedPassword = await bcrypt.hash(password, 10);
		return hashedPassword;
	} catch (error) {
		console.log("Hash Password error: ", error);
	}
};
const comparePassword = async (password, hashedPassword) => {
	try {
		const isMatch = await bcrypt.compare(password, hashedPassword);
		return isMatch;
	} catch (error) {
		console.log("Compare Password error: ", error);
	}
};

module.exports = {
	hashPassword,
	comparePassword,
};
