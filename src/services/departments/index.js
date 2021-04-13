const deptRouter = require("express").Router();
const {
  authorize,
  checkSuperUser,
  checkAdmin,
  checkImplementationOfficer,
} = require("../../utils/middlewares");
const { APIError } = require("../../utils");

const deptModel = require("./department.schema");

// list all departments [accessible to SuperUser and Admin ]
deptRouter.get(
  "/",
  authorize,
  checkSuperUser || checkAdmin,

  async (req, res, next) => {
    try {
      const depts = await deptModel.find();
      res.send(depts);
    } catch (error) {
      next(new APIError(error.message, 500));
    }
  }
);

// retrieve department using id [accessible to SuperUser and Admin]
deptRouter.get(
  "/:id",
  authorize,
  checkSuperUser || checkAdmin,

  async (req, res, next) => {
    try {
      const id = req.params.id;
      const dept = await deptModel.findById(id);
      if (dept) {
        res.send(dept);
      } else {
        next(new APIError("Department not found", 404));
      }
    } catch (error) {
      next(new APIError(error.message, 500));
    }
  }
);

// add new department [access only to SuperUser]
deptRouter.post(
  "/add/new",
  authorize,
  checkSuperUser,
  async (req, res, next) => {
    try {
      const newDept = new deptModel(req.body);
      const { _id } = await newDept.save();

      res.status(201).send(_id);
    } catch (error) {
      next(new APIError(error.message, 500));
    }
  }
);

// edit department [ accesible only to SuperUser]
deptRouter.put("/:id", authorize, checkSuperUser, async (req, res, next) => {
  try {
    const dept = await deptModel.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    });
    if (dept) {
      res.send(dept);
    } else {
      next(new APIError("Department not found", 404));
    }
  } catch (error) {
    next(new APIError(error.message, 500));
  }
});

deptRouter.put(
  "/trash/:id",
  authorize,
  checkSuperUser,
  async (req, res, next) => {
    try {
      const trashDept = await deptModel.trashDept(req.params.id);
      if (trashDept) {
        res.send(trashDept);
      }
    } catch (error) {
      next(new APIError(error.message, 500));
    }
  }
);

deptRouter.put(
  "/restore/:id",
  authorize,
  checkSuperUser,
  async (req, res, next) => {
    try {
      const restoreDept = await deptModel.restoreDept(req.params.id);
      if (restoreDept) {
        res.send(restoreDept);
      }
    } catch (error) {
      next(new APIError(error.message, 500));
    }
  }
);

deptRouter.delete(
  "/delete/:id",
  authorize,
  checkSuperUser,
  async (req, res, next) => {
    try {
      const file = await deptModel.deleteDept(req.params.id);
      if (file) {
        res.send("Deleted");
      } else {
        next();
      }
    } catch (error) {
      next(new APIError(error.message, 500));
    }
  }
);

module.exports = deptRouter;
