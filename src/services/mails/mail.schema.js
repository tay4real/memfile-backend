const { Schema, model } = require("mongoose");

const MailSchema = new Schema(
  {
    ref_no: String,
    mail_mode: {
      type: String,
      enum: ["incoming", "outgoing"],
      default: "incoming",
    },
    mail_type: {
      type: String,
      enum: ["memo", "circular", "letter"],
      default: "memo",
    },
    sender: String,
    sender_address: String,
    receiver: String,
    receiver_address: String,
    cc: [String],
    subject: String,
    body_text: String,
    signature_url: String,
    upload_url: String,
    linked_document: [String],
    document_review: [
      {
        user_id: String,
        name: String,
        body_text: String,
      },
    ],
    file_no: String,
    status: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
  },
  { timestamps: true, virtuals: true }
);

MailSchema.methods.toJSON = function () {
  const mail = this;
  const mailObject = mail.toObject();

  delete mailObject.__v;
  return mailObject;
};

MailSchema.static("trashMail", async function (id) {
  const mail = await MailModel.findByIdAndUpdate(id, {
    $set: {
      status: 1,
    },
  });
  if (mail) {
    return "Mail Trashed successfully";
  }
});

MailSchema.static("restoreMail", async function (id) {
  const mail = await MailModel.findByIdAndUpdate(id, {
    $set: {
      status: 0,
    },
  });
  if (mail) {
    return "Mail Restored successfully";
  }
});

MailSchema.static("deleteMail", async function (id) {
  const mail = await MailModel.findByIdAndDelete(id);
  return "Mail Deleted";
});

const MailModel = model("mails", MailSchema);
module.exports = MailModel;
