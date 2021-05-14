const { Schema, model } = require("mongoose");

const DepartmentSchema = new Schema(
  {
    dept_name: {
      type: String,
      required: [true, "Department Name is required"],
    },
    code: String,
  },
  { timestamps: true, virtuals: true }
);

DepartmentSchema.methods.toJSON = function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  delete object.__v;
  return object;
};

const DepartmentModel = model("departments", DepartmentSchema);
module.exports = DepartmentModel;
