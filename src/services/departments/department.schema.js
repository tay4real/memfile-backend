const { Schema, model } = require("mongoose");

const DepartmentSchema = new Schema(
  {
    dept_name: {
      type: String,
      required: [true, "Department Name is required"],
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

const DepartmentModel = model("departments", DepartmentSchema);
module.exports = DepartmentModel;
