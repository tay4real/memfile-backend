const jwt = require("jsonwebtoken");
const UserModel = require("../../services/users/users.schema");

const authenticate = async (user) => {
  try {
    const accessToken = await generateJWT({ _id: user._id });
    return { accessToken };
  } catch (error) {
    throw new Error(error);
  }
};

const generateJWT = async (payload) => {
  try {
    const token = await jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    return token;
  } catch (error) {
    console.log(error);
  }
};

const verifyJWT = async (token) => {
  try {
    const payload = await jwt.verify(token, process.env.JWT_SECRET);
    return payload;
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = { authenticate, verifyJWT };
