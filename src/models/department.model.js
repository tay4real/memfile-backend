module.exports = (mongoose) => {
  const DepartmentSchema = new Schema(
    {
      dept_name: {
        type: String,
        required: [true, "Department Name is required"],
      },
      description: String,
      status: Boolean,
    },
    { timestamps: true, virtuals: true }
  );

  DepartmentSchema.methods.toJSON = function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  };

  DepartmentSchema.plugin(mongoosePaginate);

  const DepartmentModel = model("departments", DepartmentSchema);
  return DepartmentModel;
};
