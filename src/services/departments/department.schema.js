const { Schema, model } = require("mongoose");

const DepartmentSchema = new Schema(
  {
    dept_name: {
      type: String,
      required: [true, "Department Name is required"],
    },
    dept_level: {
      type: String,
      enum: ["1", "2", "3"],
      default: "3",
    },
    status: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
  },
  { timestamps: true, virtuals: true }
);

DepartmentSchema.methods.toJSON = function () {
  const dept = this;
  const deptObject = dept.toObject();

  delete deptObject.__v;
  return deptObject;
};

DepartmentSchema.static("trashDept", async function (id) {
  const mail = await DepartmentModel.findByIdAndUpdate(id, {
    $set: {
      status: 1,
    },
  });
  if (mail) {
    return "Department trashed successfully";
  }
});

DepartmentSchema.static("restoreDept", async function (id) {
  const mail = await DepartmentModel.findByIdAndUpdate(id, {
    $set: {
      status: 0,
    },
  });
  if (mail) {
    return "Department restored successfully";
  }
});

DepartmentSchema.static("deleteDept", async function (id) {
  const mail = await DepartmentModel.findByIdAndDelete(req.params.id);
  return "Department deleted successfully";
});

const DepartmentModel = model("departments", DepartmentSchema);
module.exports = DepartmentModel;
