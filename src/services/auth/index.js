const usersRouter = require("express").Router();
const UserModel = require("../users/users.schema");
const {
  APIError,
  accessTokenOptions,
  refreshTokenOptions,
} = require("../../utils");

const { authorize } = require("../../utils/middlewares");

const { authenticate } = require("../../utils/jwt");

usersRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findByCredentials(email, password);

    const { accessToken, refreshToken } = await authenticate(user);
    console.log(refreshToken);
    res
      .cookie("accessToken", accessToken)
      .cookie("refreshToken", refreshToken)
      .send("Welcome back");
  } catch (error) {
    console.log(error);
    next(new APIError("Invalid credentials", 401));
  }
});

usersRouter.post("/refreshToken", async (req, res, next) => {
  const oldRefreshToken = req.cookies.refreshToken;
  if (!oldRefreshToken) {
    next(new APIError("Refresh token missing", 400));
  } else {
    try {
      const { accessToken, refreshToken } = await refreshToken(oldRefreshToken);
      res
        .cookie("accessToken", accessToken)
        .cookie("refreshToken", refreshToken)
        .send("renewed");
    } catch (error) {
      next(new APIError(error.message, 403));
    }
  }
});

usersRouter.post("/logout", authorize, async (req, res, next) => {
  try {
    req.user.refreshTokens = req.user.refreshTokens.filter(
      (t) => t.token !== req.cookies.refreshTokens
    );
    await req.user.save();
    res
      .clearCookie("accessToken")
      .clearCookie("refreshToken")
      .redirect(`${process.env.FE_URL}\auth\login`);
  } catch (err) {
    next(err);
  }
});

usersRouter.post("/logoutAll", authorize, async (req, res, next) => {
  try {
    console.log(req.user);
    req.user.refreshTokens = [];
    await req.user.save();
    res.clearCookie("accessToken").clearCookie("refreshToken").send();
  } catch (err) {
    next(err);
  }
});

module.exports = usersRouter;
