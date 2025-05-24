const cloudinary = require("../config/cloudinary");

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

		res.status(200).json({
			signature,
			apiKey: process.env.CLOUDINARY_API_KEY,
			cloudName: process.env.CLOUDINARY_CLOUD_NAME,
		});
	} catch (error) {
		console.error("Signature Generation Error: ", error);
		res.status(500).json({ error: "Failed to generate signature" });
	}
};
