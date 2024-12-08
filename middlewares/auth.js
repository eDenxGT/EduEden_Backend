const jwt = require("jsonwebtoken");
const chalk = require("chalk")

const SECRET_KEYS = {
	student: process.env.JWT_STUDENT_ACCESS_TOKEN_SECRET,
	tutor: process.env.JWT_TUTOR_ACCESS_TOKEN_SECRET,
	admin: process.env.JWT_ADMIN_ACCESS_TOKEN_SECRET,
};

const verifyToken = (role) => {
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];
    console.log(chalk.yellowBright("Auth Header: ", chalk.blueBright(authHeader)));
    
    if (!authHeader ) {
      return res.status(403).json({ message: "No token provided.", role });
    }
    // console.log("authHeader2",authHeader)
    
    const token = authHeader.split(" ")[1];

    if (!token || token.split(".").length !== 3) {
      return res.status(400).json({ message: "Invalid token format." });
    }

    const secretKey = SECRET_KEYS[role];
    if (!secretKey) {
      return res.status(400).json({ message: "Invalid role specified.", role });
    }


    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Token is invalid or expired.", role });
      }
      req.user = decoded
      next();
    });
  };
};



module.exports = {
	verifyStudent: verifyToken("student"),
	verifyTutor: verifyToken("tutor"),
	verifyAdmin: verifyToken("admin"),
};
