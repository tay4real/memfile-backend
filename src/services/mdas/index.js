const mdaRouter = require("express").Router();
const { authorize, isAdmin } = require("../../utils/auth/middleware");
const q2m = require("query-to-mongo");
const MDAModel = require("./mda.schema");
const mongoose = require("mongoose");

// List all MDAS
mdaRouter.get("/", authorize, async (req, res, next) => {
  try {
    const query = q2m(req.query);
    const total = await MDAModel.countDocuments(query.criteria);
    const mdas = await MDAModel.find(query.criteria)
      .sort(query.options.sort)
      .skip(query.options.skip)
      .limit(query.options.limit);

    res.send(mdas);
  } catch (error) {
    next(new Error(error.message));
  }
});

// Returns an MDA
mdaRouter.get("/:id", authorize, async (req, res, next) => {
  try {
    const mda = await MDAModel.findById(req.params.id);
    res.send(mda);
  } catch (error) {
    next(new Error(error.message));
  }
});

// create a new MDA
mdaRouter.post("/", authorize, isAdmin, async (req, res, next) => {
  try {
    console.log(req.body);

    const name = await MDAModel.findOne({ name: req.body.name });
    const shortName = await MDAModel.findOne({ shortName: req.body.shortName });
    if (name || shortName) {
      res.status(400).send("MDA record already exist");
    } else {
      const mda = await new MDAModel(req.body).save();
      console.log(mda);
      const id = mda._id;
      console.log(id);
      if (id) {
        res.status(201).send("MDA added successfully");
      }
    }
  } catch (error) {
    next(new Error(error.message));
  }
});

mdaRouter.put("/:id", authorize, isAdmin, async (req, res, next) => {
  try {
    const mda = await MDAModel.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    });
    if (mda) {
      res.status(201).send("MDA updated successfully");
    } else {
      next(new Error("MDA not found"));
    }
  } catch (error) {
    next(new Error(error.message));
  }
});

mdaRouter.delete("/:id", authorize, isAdmin, async (req, res, next) => {
  try {
    const mda = await MDAModel.findByIdAndDelete(req.params.id);
    if (mda) {
      res.send("MDA record deleted successfully");
    } else {
      next(new Error("MDA not found"));
    }
  } catch (error) {
    next(new Error(error.message));
  }
});

mdaRouter.delete("/", authorize, isAdmin, async (req, res, next) => {
  try {
    const data = await MDAModel.deleteMany({});
    if (data) {
      res.send({
        message: `${data.deletedCount} mdas were deleted successfully!`,
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

mdaRouter.post(
  "/:id/departments/",
  authorize,
  isAdmin,
  async (req, res, next) => {
    try {
      const department = { ...req.body };

      const { departments } = await MDAModel.findOne(
        {
          _id: mongoose.Types.ObjectId(req.params.id),
        },
        {
          _id: 0,
          departments: {
            $elemMatch: {
              deptName: department.deptName,
            },
          },
        }
      );

      if (departments.length === 0) {
        const updated = await MDAModel.findByIdAndUpdate(
          req.params.id,
          {
            $push: {
              departments: department,
            },
          },
          { runValidators: true, new: true }
        );
        res.status(201).send("Department added successfully");
      } else {
        res.status(400).send("Department already exist");
      }
    } catch (error) {
      next(error);
    }
  }
);

mdaRouter.get("/:id/departments/", authorize, async (req, res, next) => {
  try {
    const { departments } = await MDAModel.findById(req.params.id, {
      departments: 1,
      _id: 0,
    });
    res.send(departments);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

mdaRouter.get(
  "/:id/departments/:departmentId",
  authorize,
  async (req, res, next) => {
    try {
      const { departments } = await MDAModel.findOne(
        {
          _id: mongoose.Types.ObjectId(req.params.id),
        },
        {
          _id: 0,
          departments: {
            $elemMatch: {
              _id: mongoose.Types.ObjectId(req.params.departmentId),
            },
          },
        }
      );
      res.send(departments);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

mdaRouter.put(
  "/:id/departments/:departmentId",
  authorize,
  isAdmin,

  async (req, res, next) => {
    try {
      const { departments } = await MDAModel.findOne(
        {
          _id: mongoose.Types.ObjectId(req.params.id),
        },
        {
          _id: 0,
          departments: {
            $elemMatch: {
              _id: mongoose.Types.ObjectId(req.params.departmentId),
            },
          },
        }
      );

      if (departments && departments.length > 0) {
        const departmentToReplace = {
          ...departments[0].toObject(),
          ...req.body,
        };

        const modifiedDepartments = await MDAModel.findOneAndUpdate(
          {
            _id: mongoose.Types.ObjectId(req.params.id),
            "departments._id": mongoose.Types.ObjectId(req.params.departmentId),
          },
          { $set: { "departments.$": departmentToReplace } },
          {
            runValidators: true,
            new: true,
          }
        );
        if (modifiedDepartments) {
          res.send("Updated successfully");
        }
      } else {
        next();
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

mdaRouter.delete(
  "/:id/departments/:departmentId",
  authorize,
  isAdmin,
  async (req, res, next) => {
    try {
      const modifiedDepartments = await MDAModel.findByIdAndUpdate(
        req.params.id,
        {
          $pull: {
            departments: {
              _id: mongoose.Types.ObjectId(req.params.departmentId),
            },
          },
        },
        {
          new: true,
        }
      );
      if (modifiedDepartments) {
        res.send("Deleted Successfully");
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

module.exports = mdaRouter;
