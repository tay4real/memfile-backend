const { Schema, model } = require("mongoose");

const FilesSchema = new Schema(
  {
    file_title: String,
    file_no: String,
    paper_fileno: String,
    mdaShortName: String,
    incomingmails: [{ type: Schema.Types.ObjectId, ref: "incomingmails" }],
    outgoingmails: [{ type: Schema.Types.ObjectId, ref: "outgoingmails" }],
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
        doc_id: String,
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
  const file = await FileModel.findById(id)
    .populate("incomingmails")
    .populate("outgoingmails");
  return file;
});

FilesSchema.static("fileupIncomingMail", async function (id, mail_id) {
  const file = await FileModel.findByIdAndUpdate(
    id,
    {
      $push: {
        incomingmails: mail_id,
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

FilesSchema.static("fileupOutgoingMail", async function (id, mail_id) {
  const file = await FileModel.findByIdAndUpdate(
    id,
    {
      $push: {
        outgoingmails: mail_id,
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
        incomingmails: mail_id,
        outgoingmails: mail_id,
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

const FileModel = model("generalfiles", FilesSchema);
module.exports = FileModel;
