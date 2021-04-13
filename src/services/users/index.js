const usersRouter = require("express").Router();

const { authorize } = require("../../utils/middlewares");

const { APIError } = require("../../utils");

const { defaultAvatar } = require("../../utils/users");
const {
  cloudinaryAvatar,
  cloudinaryDestroy,
} = require("../../utils/middlewares/cloudinary");

usersRouter
  .route("/me")
  .get(authorize, async (req, res, next) => {
    try {
      res.send(req.user.toJSON());
    } catch (error) {
      next(new APIError(error.message, 500));
    }
  })
  .put(authorize, async (req, res, next) => {
    try {
      const updates = Object.keys(req.body);
      updates.forEach((update) => (req.user[update] = req.body[update]));
      await req.user.save();
      res.send(req.user);
    } catch (error) {
      next(new APIError(error.message, 500));
    }
  });

usersRouter
  .route("/me/avatar")
  .post(
    authorize,
    cloudinaryAvatar.single("avatar"),
    async (req, res, next) => {
      try {
        const data = parse(req.user.avatar);
        if (data.name) await cloudinaryDestroy(data);
        req.user.avatar = req.file.path;
        await req.user.save();
        res.status(201).send(req.user);
      } catch (error) {
        next(new APIError(error.message, 401));
      }
    }
  )
  .delete(authorize, async (req, res, next) => {
    try {
      const data = parse(req.user.avatar);
      if (data.name) await cloudinaryDestroy(data);
      req.user.avatar = defaultAvatar(req.user.firstName, req.user.lastName);
      delete req.user.avatar.public_id;
      await req.user.save();
      res.send(req.user);
    } catch (error) {
      next(error);
    }
  });

module.exports = usersRouter;
