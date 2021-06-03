const { Schema, model } = require("mongoose");

const MDASchema = new Schema(
  {
    name: String,
    shortName: String,
    departments: [
      {
        deptName: {
          type: String,
          required: [true, "Department Name is required"],
        },
        deptShortName: String,
      },
    ],
  },
  { timestamps: true, virtuals: true }
);

MDASchema.methods.toJSON = function () {
  const mda = this;
  const mdaObject = mda.toObject();

  delete mdaObject.__v;
  return mdaObject;
};

const MDAModel = model("mdas", MDASchema);

module.exports = MDAModel;
