const cloudinary = require("../config/cloudinary");
const STATUS_CODE = require("../constants/statusCode");

exports.generateSignature = (req, res) => {
	const { folder, public_id, timestamp, transformation } = req.body;

	const paramsToSign = {
		folder,
		public_id,
		timestamp,
		transformation,
	};

	try {
		const signature = cloudinary.utils.api_sign_request(
			paramsToSign,
			process.env.CLOUDINARY_API_SECRET
		);

		res.status(STATUS_CODE.OK).json({
			signature,
			apiKey: process.env.CLOUDINARY_API_KEY,
			cloudName: process.env.CLOUDINARY_CLOUD_NAME,
		});
	} catch (error) {
		console.error("Signature Generation Error: ", error);
		res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: "Failed to generate signature" });
	}
};
