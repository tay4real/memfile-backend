const superUserRouter = require("express").Router();
const UserModel = require("../users/users.schema");
const { authenticate } = require("../../utils/auth/tools");
const { authorize, checkSuperUser } = require("../../utils/auth/middleware");
const q2m = require("query-to-mongo");

superUserRouter.get(
  "/users",
  authorize,
  checkSuperUser,
  async (req, res, next) => {
    try {
      const query = q2m(req.query);
      const total = await UserModel.countDocuments(query.criteria);

      const users = await UserModel.find(query.criteria, query.options.fields)
        .find(query.criteria)
        .sort(query.options.sort)
        .skip(query.options.skip)
        .limit(query.options.limit)
        .populate("departments");

      res.send({ links: query.links("/users", total), users });
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

superUserRouter.get(
  "/users/active",
  authorize,
  checkSuperUser,
  async (req, res, next) => {
    try {
      const query = q2m(req.query);
      const total = await UserModel.countDocuments(query.criteria);

      const users = await UserModel.find(query.criteria, query.options.fields)
        .skip(query.options.skip)
        .limit(query.options.limit)
        .sort(query.options.sort);

      const active_users = users.filter((user) => user.status === 0);
      res.send({ links: query.links("/users", total), active_users });
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

superUserRouter.get(
  "/users/trashed",
  authorize,
  checkSuperUser,
  async (req, res, next) => {
    try {
      const query = q2m(req.query);
      const total = await UserModel.countDocuments(query.criteria);

      const users = await UserModel.find(query.criteria, query.options.fields)
        .skip(query.options.skip)
        .limit(query.options.limit)
        .sort(query.options.sort);

      const trashed_users = users.filter((user) => user.status === 1);
      res.send({ links: query.links("/users", total), trashed_users });
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

superUserRouter.get(
  "/user/:id",
  authorize,
  checkSuperUser,
  async (req, res, next) => {
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
  }
);

superUserRouter.put(
  "/user/:id",
  authorize,
  checkSuperUser,
  async (req, res, next) => {
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
  }
);

superUserRouter.put(
  "/users/trash/:id",
  authorize,
  checkSuperUser,
  async (req, res, next) => {
    try {
      const trashUser = await UserModel.trashUser(req.params.id);
      if (trashUser) {
        res.send(trashUser);
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

superUserRouter.put(
  "/users/restore/:id",
  authorize,
  checkSuperUser,
  async (req, res, next) => {
    try {
      const restoreUser = await UserModel.restoreUser(req.params.id);
      if (restoreUser) {
        res.send(restoreUser);
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

superUserRouter.delete(
  "/users/delete/:id",
  authorize,
  checkSuperUser,
  async (req, res, next) => {
    try {
      const user = await UserModel.deleteUser(req.params.id);
      if (user) {
        res.send("User account deleted successfully");
      } else {
        next();
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

module.exports = superUserRouter;