const { Schema, model } = require("mongoose");

const FilesSchema = new Schema(
  {
    file_title: String,
    file_no: String,
    mdaShortName: String,
    personnels: [{ type: Schema.Types.ObjectId, ref: "personnels" }],
    status: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    file_location: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    chargeFile: [
      {
        from: String,
        to: String,
        pageIndex: Number,
        remark: String,
        dateCharged: Date,
      },
    ],
    fileRequest: [
      {
        by: String,
        dateRequested: Date,
      },
    ],
    fileReturn: [
      {
        by: String,
        dateReturned: Date,
      },
    ],
  },
  { timestamps: true, virtuals: true }
);

FilesSchema.methods.toJSON = function () {
  const file = this;
  const fileObject = file.toObject();

  delete fileObject.__v;
  return fileObject;
};

FilesSchema.static("findFileWithMails", async function (id) {
  const file = await FileModel.findById(id).populate("mails");
  return file;
});

FilesSchema.static("fileupDocument", async function (id, mail_id) {
  const file = await FileModel.findByIdAndUpdate(
    id,
    {
      $push: {
        mails: mail_id,
      },
    },
    {
      runValidators: true,
      new: true,
    }
  );
  if (file) {
    return file;
  }
});

FilesSchema.static("removeDocument", async function (id, mail_id) {
  const file = await FileModel.findByIdAndUpdate(
    id,
    {
      $pull: {
        mails: mail_id,
      },
    },
    {
      runValidators: true,
      new: true,
    }
  );
  if (file) {
    return file;
  }
});

FilesSchema.static("trashFile", async function (id) {
  const file = await FileModel.findByIdAndUpdate(id, {
    $set: {
      status: 1,
    },
  });
  if (file) {
    return "File trashed";
  }
});

FilesSchema.static("restoreFile", async function (id) {
  const file = await FileModel.findByIdAndUpdate(id, {
    $set: {
      status: 0,
    },
  });
  if (file) {
    return "File Recovered from trash";
  }
});

FilesSchema.static("deleteFile", async function (id) {
  const mail = await FileModel.findByIdAndDelete(id);
  return "File deleted permanently";
});

const FileModel = model("personalfiles", FilesSchema);
module.exports = FileModel;
