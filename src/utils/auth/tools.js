const jwt = require('jsonwebtoken');
const UserModel = require('../../services/users/users.schema');

// Token generation helper
const generateAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

// Save refresh token to DB
const saveRefreshToken = async (userId, refreshToken) => {
  await UserModel.findByIdAndUpdate(userId, {
    refreshToken,
  });
};

// Main auth function
const authenticate = async (user) => {
  try {
    const accessToken = generateAccessToken({ _id: user._id });
    const refreshToken = generateRefreshToken({ _id: user._id });

    await saveRefreshToken(user._id, refreshToken);

    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error(error);
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

const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

module.exports = {
  authenticate,
  verifyJWT,
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  saveRefreshToken,
};
