const deptRouter = require("express").Router();
const { authorize, isAdmin } = require("../../utils/auth/middleware");
const q2m = require("query-to-mongo");
const deptModel = require("./department.schema");

deptRouter.get("/", authorize, isAdmin, async (req, res, next) => {
  try {
    const query = q2m(req.query);

    const depts = await deptModel
      .find(query.criteria)
      .sort(query.options.sort)
      .skip(query.options.skip)
      .limit(query.options.limit);

    res.send(depts);
  } catch (error) {
    next(new Error(error.message));
  }
});

deptRouter.get("/:id", authorize, isAdmin, async (req, res, next) => {
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
});

deptRouter.post("/", authorize, isAdmin, async (req, res, next) => {
  try {
    console.log(req.body);
    const newDept = new deptModel(req.body);
    const { _id } = await newDept.save();
    res.status(201).send(_id);
  } catch (error) {
    next(new Error(error.message));
  }
});

deptRouter.put("/:id", authorize, isAdmin, async (req, res, next) => {
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

deptRouter.delete("/:id", authorize, isAdmin, async (req, res, next) => {
  try {
    const dept = await deptModel.findByIdAndDelete(req.params.id);
    if (dept) {
      res.send("Deleted Sucessfully");
    } else {
      next();
    }
  } catch (error) {
    next(new Error(error.message));
  }
});

deptRouter.delete("/", authorize, isAdmin, async (req, res, next) => {
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
