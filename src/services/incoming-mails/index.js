const mailRouter = require("express").Router();

const multer = require("multer");
const { writeFile } = require("fs-extra");
const { join } = require("path");
// const upload = multer({});

// const incomingMailStorage = join(
//   __dirname,
//   "../../../public/filestorage/incomingmails"
// );

const PDFDocument = require("pdfkit");

const {
  cloudinaryIncomingMail,
  cloudinaryDestroy,
} = require("../../utils/cloudinary");

const q2m = require("query-to-mongo");

const { authorize, isAdmin } = require("../../utils/auth/middleware");

const mailModel = require("./mail.schema");
const { Console } = require("console");

mailRouter.get("/", authorize, async (req, res, next) => {
  try {
    const query = q2m(req.query);

    const mails = await mailModel
      .find(query.criteria, query.options.fields)
      .skip(query.options.skip)
      .limit(query.options.limit)
      .sort(query.options.sort);

    res.send(mails);
  } catch (error) {
    next(new Error(error.message));
  }
});

mailRouter.get("/:id", authorize, async (req, res, next) => {
  try {
    const mail = await mailModel.findById(req.params.id);
    res.send(mail);
  } catch (error) {
    next(res.status(500).send(error.message));
  }
});

mailRouter.post("/", authorize, async (req, res, next) => {
  try {
    const newMail = await new mailModel(req.body).save();
    res.send(newMail._id);
  } catch (error) {
    next(res.status(500).send(error.message));
  }
});

// mailRouter.post("/:id/upload", upload.array("mail"), async (req, res, next) => {
//   try {
//     let image_path_arr = [];

//     const arrayOfPromises = req.files.map((file) => {
//       writeFile(join(incomingMailStorage, file.originalname), file.buffer);
//       image_path_arr.push(join(incomingMailStorage, file.originalname));
//     });
//     console.log(image_path_arr);
//     await Promise.all(arrayOfPromises);
//     if (image_path_arr.length !== 0) {
//       image_path_arr.map(async (image_path) => {
//         await mailModel.findByIdAndUpdate(
//           req.params.id,
//           { upload_url: image_path },
//           {
//             runValidators: true,
//             returnOriginal: false,
//             useFindAndModify: false,
//           }
//         );
//       });
//       res.send("Uploaded Successfully");
//     }
//   } catch (error) {
//     console.log(error);
//     next(error);
//   }
// });

mailRouter.post(
  "/:id/upload",
  authorize,
  cloudinaryIncomingMail.array("mail"),
  async (req, res, next) => {
    try {
      // let image_path_arr = [];

      const upload = await req.files.map(async (file) => {
        // image_path_arr.push(req.file.path);

        console.log(file);
        await mailModel.findByIdAndUpdate(req.params.id, {
          $push: {
            upload_url: file.path,
          },
        });
      });

      if (upload) {
        res.send("Uploaded Successfully");
      }
      // console.log(image_path_arr);
      // await Promise.all(arrayOfPromises);
      // if (image_path_arr.length !== 0) {
      //   image_path_arr.map(async (image_path) => {
      //     await mailModel.findByIdAndUpdate(
      //       req.params.id,
      //       { upload_url: image_path },
      //       {
      //         runValidators: true,
      //         returnOriginal: false,
      //         useFindAndModify: false,
      //       }
      //     );
      //   });
      //   res.send("Uploaded Successfully");
      // }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

// mailRouter.post(
//   "/:id/upload",
//   cloudinaryIncomingMail.single("mail"),
//   async (req, res, next) => {
//     try {
//       let img_path = await req.file.path;

//       await mailModel.findByIdAndUpdate(
//         req.params.id,
//         { upload_url: img_path },
//         {
//           runValidators: true,
//           returnOriginal: false,
//           useFindAndModify: false,
//         }
//       );
//       if (img_path) {
//         res.send("Uploaded Successfully");
//       }
//     } catch (error) {
//       next(error);
//     }
//   }
// );

mailRouter.put("/:id", authorize, async (req, res, next) => {
  try {
    const mail = await mailModel.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    });
    if (mail) {
      res.send("Incoming mail updated successfully");
    } else {
      res.status(404).send("Incoming mail not found");
    }
  } catch (error) {
    next(new Error(error.message));
  }
});

mailRouter.get("/:id/pdf", async (req, res, next) => {
  try {
    const mail = await mailModel.findById(req.params.id);
    let doc = new PDFDocument();
    doc.pipe(res);
    doc.text(
      `
      MEMO
    To: ${mail.receiver},
    From: ${mail.sender}, 
    cc: ${mail.cc},
    Date: ${mail.createdAt} ,
    Subject: ${mail.subject},
    Message: ${mail.body_text}
     `,
      100,
      100
    );
    doc.end();
    await res.writeHead(200, {
      "Content-Type": "application/pdf",
    });
    res.status(201).send("OK");
  } catch (error) {
    next(error);
  }
});

mailRouter.put(
  "/changestatus/:id",
  authorize,
  isAdmin,
  async (req, res, next) => {
    try {
      const status = await mailModel.fileup(req.params.id);
      if (status) {
        res.send(status);
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

mailRouter.delete("/:id", authorize, isAdmin, async (req, res, next) => {
  try {
    const mail = await mailModel.findByIdAndDelete(req.params.id);
    if (mail) {
      res.send("Deleted successfully");
    } else {
      res.status(404).send("Mail Not found");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

mailRouter.delete("/", authorize, isAdmin, async (req, res, next) => {
  try {
    const data = await MailModel.deleteMany({});
    if (data) {
      res.send({
        message: `${data.deletedCount} incoming mails were deleted successfully!`,
      });
    } else {
      next();
    }
  } catch (error) {
    next(
      new Error({
        message:
          err.message ||
          "Some error occurred while removing all incoming mails.",
      })
    );
  }
});

module.exports = mailRouter;
