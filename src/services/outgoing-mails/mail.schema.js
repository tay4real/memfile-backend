const { Schema, model } = require("mongoose");

const MailSchema = new Schema(
  {
    ref_no: String,
    subject: String,
    to: String,
    author: String,
    recipient: String,
    date_sent: Date,
    status: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    upload_format: String,
    upload_url: [String],
  },
  { timestamps: true, virtuals: true }
);

MailSchema.methods.toJSON = function () {
  const mail = this;
  const mailObject = mail.toObject();

  delete mailObject.__v;
  return mailObject;
};

MailSchema.static("fileup", async function (id) {
  const mail = await MailModel.findByIdAndUpdate(id, {
    $set: {
      status: 1,
    },
  });
  if (mail) {
    return "Filed successfully";
  }
});

const MailModel = model("outgoing-mails", MailSchema);
module.exports = MailModel;
