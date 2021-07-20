const usersRouter = require("express").Router();
const UserModel = require("../users/users.schema");

const transporter = require("../../utils/email");

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
      if (req.body.email) {
        let mailOptions = {
          from: process.env.SMTP_USER,
          to: req.body.email,
          subject: "Welcome to MEMFILE",
          html: `<h1>Welcome</h1><p>Your MEMFILE account has been created successfully.</p><p>Please take note of your account details: <br/> Username: ${req.body.email} <br /> password: ${req.body.password} <br> <small>Please note your are advised to change your password on first login </small></p><p>Administrator Memfile</p>`,
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
          }
        });
      }
      res.send(newUser);
    } catch (error) {
      if (error.code === 11000) next(new Error("Email is already in use"));
      next(error);
    }
  }
);

module.exports = usersRouter;
