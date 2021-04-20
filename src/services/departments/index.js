const deptRouter = require("express").Router();
const {
  authorize,
  checkSuperUser,
  checkAdmin,
} = require("../../utils/auth/middleware");
const q2m = require("query-to-mongo");
const deptModel = require("./department.schema");

// list all departments [accessible to SuperUser and Admin ]
deptRouter.get(
  "/",
  authorize,
  checkSuperUser || checkAdmin,

  async (req, res, next) => {
    try {
      const query = q2m(req.query);
      const total = await deptModel.countDocuments(query.criteria);
      const depts = await deptModel
        .find(query.criteria)
        .sort(query.options.sort)
        .skip(query.options.skip)
        .limit(query.options.limit);

      res.send({ links: query.links("/depts", total), depts, total });
    } catch (error) {
      next(new Error(error.message));
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
      next(new Error(error.message));
    }
  }
);

// add new department [access only to SuperUser]
deptRouter.post("/", authorize, checkSuperUser, async (req, res, next) => {
  try {
    console.log(req.body);
    const newDept = new deptModel(req.body);
    const { _id } = await newDept.save();

    res.status(201).send(newDept);
  } catch (error) {
    next(new Error(error.message));
  }
});

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
      next(new Error("Department not found", 404));
    }
  } catch (error) {
    next(new Error(error.message));
  }
});

deptRouter.delete(
  "/delete/:id",
  authorize,
  checkSuperUser,
  async (req, res, next) => {
    try {
      const dept = await deptModel.findByIdAndDelete(req.params.id);
      if (dept) {
        res.send("Deleted");
      } else {
        next();
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

deptRouter.delete("/", authorize, checkSuperUser, async (req, res, next) => {
  try {
    const data = await deptModel.deleteMany({});
    if (data) {
      res.send({
        message: `${data.deletedCount} departments were deleted successfully!`,
      });
    } else {
      next();
    }
  } catch (error) {
    next(
      new Error({
        message:
          err.message || "Some error occurred while removing all departments.",
      })
    );
  }
});

module.exports = deptRouter;
