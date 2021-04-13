const jwt = require("jsonwebtoken");
const UserModel = require("../../services/users/users.schema");
const { APIError } = require("../../utils");

const authenticate = async (user) => {
  try {
    const accessToken = await generateJWT({ _id: user._id });
    const refreshToken = await generateRefreshJWT({ _id: user._id });
    user.refreshTokens = user.refreshTokens.concat({ token: refreshToken });
    await user.save();
    return { accessToken, refreshToken };
  } catch (error) {
    throw new APIError(500, error.message);
  }
};

const generateJWT = (payload) =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 9000 },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );

const verifyJWT = (token) =>
  new Promise((res, rej) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      console.log("decoded: ", decoded);
      if (err) rej(err);
      res(decoded);
    });
  });

const generateRefreshJWT = (payload) =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.REFRESH_JWT_SECRET,
      { expiresIn: "1 week" },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );

const verifyRefreshToken = (token) =>
  new Promise((res, rej) =>
    jwt.verify(token, process.env.REFRESH_JWT_SECRET, (err, decoded) => {
      if (err) rej(err);
      res(decoded);
    })
  );

const refreshToken = async (oldRefreshToken) => {
  if (oldRefreshToken) {
    try {
      const decoded = await verifyRefreshToken(oldRefreshToken);
      if (!decoded) throw new APIError(`Invalid refresh token`, 400);
      const user = await UserModel.findOne({ _id: decoded._id });
      if (!user) throw new APIError(`Unauthorized Access`, 401);
      const currentRefreshToken = user.refreshTokens.find(
        (t) => t.token === oldRefreshToken
      );
      if (!currentRefreshToken)
        throw new APIError(`Invalid refresh token`, 400);
      const accessToken = await generateJWT({ _id: user._id });
      const refreshToken = await generateRefreshJWT({ _id: user._id });
      const newRefreshTokens = user.refreshTokens
        .filter((t) => t.token !== oldRefreshToken)
        .concat({ token: refreshToken });
      user.refreshTokens = [...newRefreshTokens];
      await user.save();
      return { accessToken, refreshToken };
    } catch (error) {
      next(new APIError(error.message, 400));
    }
  } else {
    next(new APIError("Refresh token missing", 400));
  }
};

module.exports = { authenticate, verifyJWT, refreshToken };
