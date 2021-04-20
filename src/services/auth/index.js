const usersRouter = require("express").Router();
const UserModel = require("../users/users.schema");

const { authenticate } = require("../../utils/auth/tools");

usersRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findByCredentials(email, password);
    if (!user) {
      throw new Error();
    }
    const token = await authenticate(user);
    res.send(token);
  } catch (error) {
    next(res.status(401).send("Username or Password Incorrect"));
  }
});

usersRouter.post(
  "/register",

  async (req, res, next) => {
    try {
      const newUser = await new UserModel(req.body).save();
      res.send(newUser);
    } catch (error) {
      if (error.code === 11000) next(new Error("Email is already in use"));
      next(error);
    }
  }
);

module.exports = usersRouter;
