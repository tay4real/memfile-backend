const { Schema, model } = require("mongoose");

const PersonnelSchema = new Schema(
  {
    emp_no: String,
    surname: String,
    firstname: String,
    personal_info: {
      dob: Date,
      phoneNo: String,
      address: String,
      email: String,
    },
    nok_info: {
      name: String,
      phoneNo: String,
      address: String,
      email: String,
    },
    emp_info: {
      dateOfFirstAppointment: Date,
      dateOfPresentAppointment: Date,
      currentPost: String,
      currentGradeLevel: String,
      parentMDA: String,
      presentMDA: String,
      department: String,
    },
    qualifications: [
      {
        title: String,
        from: String,
        yearObtained: Date,
        certificateURL: String,
      },
    ],
    leaves: [
      {
        request_From: Date,
        request_To: Date,
        requestUpload: String,
        approved_From: Date,
        approved_To: Date,
        approvalUpload: String,
        status: String,
      },
    ],
    promotions: [
      {
        promotionDate: Date,
        gradeLevel: String,
        post: String,
        promotionUpload: String,
      },
    ],
    queries: [
      {
        issuedDate: Date,
        queryUpload: String,
        responseDate: Date,
        responseUpload: String,
      },
    ],
  },
  { timestamps: true, virtuals: true }
);

PersonnelSchema.methods.toJSON = function () {
  const personnel = this;
  const personnelObject = personnel.toObject();

  delete personnelObject.__v;
  return personnelObject;
};

const PersonnelModel = model("personnels", PersonnelSchema);
module.exports = PersonnelModel;
