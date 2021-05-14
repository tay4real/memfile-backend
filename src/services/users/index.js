const usersRouter = require("express").Router();
const q2m = require("query-to-mongo");
const { authorize, isAdmin } = require("../../utils/auth/middleware");
const { defaultAvatar } = require("../../utils/defaultAvatar");
const {
  cloudinaryAvatar,
  cloudinaryDestroy,
} = require("../../utils/cloudinary");

usersRouter
  .route("/me")
  .get(authorize, async (req, res, next) => {
    try {
      res.send(req.user.toJSON());
    } catch (error) {
      next();
    }
  })
  .put(authorize, async (req, res, next) => {
    try {
      const updates = Object.keys(req.body);
      updates.forEach((update) => (req.user[update] = req.body[update]));
      await req.user.save();
      res.send(req.user);
    } catch (error) {
      next(error);
      //res.send({ error: true, message: error.message });
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
        next(error);
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

usersRouter.get("/", authorize, isAdmin, async (req, res, next) => {
  try {
    const query = q2m(req.query);

    const users = await UserModel.find(query.criteria, query.options.fields)
      .find(query.criteria)
      .sort(query.options.sort)
      .skip(query.options.skip)
      .limit(query.options.limit)
      .populate("mdas")
      .populate("departments");

    res.send(users);
  } catch (error) {
    next(new Error(error.message));
  }
});

usersRouter.get("/:id", authorize, isAdmin, async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);

    if (user) {
      if (user.status === 0) {
        res.send(user);
      } else {
        next(new APIError("User account has been removed", 404));
      }
    } else {
      next(new APIError("User not found", 404));
    }
  } catch (error) {
    console.log(error);
    next(new Error(error.message));
  }
});

usersRouter.put("/:id", authorize, isAdmin, async (req, res, next) => {
  try {
    const modifiedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        runValidators: true,
        new: true,
      }
    );
    if (modifiedUser) {
      res.send(modifiedUser);
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

usersRouter.put(
  "/deactivate/:id",
  authorize,
  isAdmin,
  async (req, res, next) => {
    try {
      const status = await UserModel.deactivate(req.params.id);
      if (status) {
        res.send(status);
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

usersRouter.put(
  "/activate/:id",
  authorize,
  isAdmin,
  async (req, res, next) => {
    try {
      const status = await UserModel.activate(req.params.id);
      if (status) {
        res.send(status);
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

usersRouter.delete("/:id", authorize, isAdmin, async (req, res, next) => {
  try {
    const user = await UserModel.findByIdAndDelete(req.params.id);
    if (user) {
      res.send("User account deleted successfully");
    } else {
      next();
    }
  } catch (error) {
    next(new Error(error.message));
  }
});

module.exports = usersRouter;
