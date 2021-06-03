const mdaRouter = require("express").Router();
const { authorize, isAdmin } = require("../../utils/auth/middleware");
const q2m = require("query-to-mongo");
const MDAModel = require("../mdas/mda.schema");

mdaRouter.post("/:id/departments/", async (req, res, next) => {
  try {
    const department = { ...req.body };
    const updated = await MDAModel.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          departments: department,
        },
      },
      { runValidators: true, new: true }
    );
    res.status(201).send(updated);
  } catch (error) {
    next(error);
  }
});

mdaRouter.get("/:id/departments", async (req, res, next) => {
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

mdaRouter.put(
  "/:id/departments/:departmentId",

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
        res.send(modifiedDepartments);
      } else {
        next();
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

mdaRouter.delete("/:id/departments/:departmentId", async (req, res, next) => {
  try {
    const modifiedDepartments = await personnelModel.findByIdAndUpdate(
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
});

module.exports = mdaRouter;
