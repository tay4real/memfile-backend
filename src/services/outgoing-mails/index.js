const mailRouter = require("express").Router();
const fs = require("fs");
const { join } = require("path");
const mongoose = require("mongoose");

const PDFDocument = require("pdfkit");
const {
  cloudinaryOutgoingMail,
  cloudinaryDestroy,
} = require("../../utils/cloudinary");
const q2m = require("query-to-mongo");

const { authorize, isAdmin } = require("../../utils/auth/middleware");

const mailModel = require("./mail.schema");

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
    res.status(500).send(error.message);
  }
});

mailRouter.get("/:id", authorize, async (req, res, next) => {
  try {
    const mail = await mailModel.findById(req.params.id);
    res.send(mail);
  } catch (error) {
    next(new Error(error.message));
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

// mailRouter.post(
//   "/",
//   cloudinaryOutgoingMail.array("mail"),
//   async (req, res, next) => {
//     try {
//       let arr = [];
//       const arrayOfPromises = req.files.map((file) => {
//         arr.push(file.path);
//       });
//       await Promise.all(arrayOfPromises);

//       const outgoingMail = { ...req.body, upload_url: arr };
//       const newMail = await new mailModel(outgoingMail).save();
//       res.send(newMail._id);
//     } catch (error) {
//       next(new Error(error.message));
//     }
//   }
// );

mailRouter.post(
  "/:id/upload",
  authorize,
  cloudinaryOutgoingMail.single("mail"),
  async (req, res, next) => {
    try {
      let img_path = await req.file.path;

      await mailModel.findByIdAndUpdate(
        req.params.id,
        { upload_url: img_path },
        {
          runValidators: true,
          returnOriginal: false,
          useFindAndModify: false,
        }
      );
      if (img_path) {
        res.send("Uploaded Successfully");
      }
    } catch (error) {
      next(error);
    }
  }
);

// mailRouter.put(
//   "/:id",
//   cloudinaryOutgoingMail.single("mail"),
//   async (req, res, next) => {
//     try {
//       const outgoingMail = { ...req.body, upload_url: req.file.path };

//       const mail = await mailModel.findByIdAndUpdate(
//         req.params.id,
//         outgoingMail,
//         {
//           runValidators: true,
//           returnOriginal: false,
//           useFindAndModify: false,
//         }
//       );
//       if (mail) {
//         res.send(mail);
//       } else {
//         next(new APIError("Mail not found", 404));
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
      res.send("Outgoing mail updated successfully");
    } else {
      res.status(404).send("Outgoing mail not found");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

mailRouter.get("/:id/pdf", authorize, async (req, res, next) => {
  try {
    const mail = await mailModel.findById(req.params.id);
    let doc = new PDFDocument();
    doc.pipe(res);
    doc.text(
      `
      MEMO
    To: ${mail.to},
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
      res.send("Delete successful");
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
        message: `${data.deletedCount} outgoing mails were deleted successfully!`,
      });
    } else {
      next();
    }
  } catch (error) {
    next(
      new Error({
        message:
          err.message ||
          "Some error occurred while removing all outgoing mails.",
      })
    );
  }
});

mailRouter.get("/report/stats", authorize, async (req, res) => {
  try {
    const data = await mailModel.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json(error);
  }
});

mailRouter.get("/report/counts", authorize, async (req, res) => {
  try {
    const total = await mailModel.countDocuments();
    res.status(200).json({ total });
  } catch (error) {
    res.status(500).json(error);
  }
});

mailRouter.post("/search/results", authorize, async (req, res) => {
  try {
    const searchVariable = req.body.criteria;
    const search = [];

    // convert to all posible format
    search.push(searchVariable);
    search.push(searchVariable.toUpperCase());
    search.push(searchVariable.toLowerCase());
    search.push(
      searchVariable.charAt(0).toUpperCase() + searchVariable.slice(1)
    );

    const arr = searchVariable.split(" ");
    for (let i = 0; i < arr.length; i++) {
      arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
    }
    const capitalizeFirstLetterPerWord = arr.join(" ");

    search.push(capitalizeFirstLetterPerWord);

    const searchResult = [];

    for (let i = 0; i < search.length; i++) {
      const result = await mailModel.find({
        ref_no: new RegExp(".*" + search[i] + ".*"),
      });
      if (result) {
        searchResult.push(...result);
      }
      const result2 = await mailModel.find({
        subject: new RegExp(".*" + search[i] + ".*"),
      });
      if (result2) {
        searchResult.push(...result2);
      }
      const result3 = await mailModel.find({
        to: new RegExp(".*" + search[i] + ".*"),
      });
      if (result3) {
        searchResult.push(...result3);
      }
      const result4 = await mailModel.find({
        sender: new RegExp(".*" + search[i] + ".*"),
      });
      if (result4) {
        searchResult.push(...result4);
      }
      const result5 = await mailModel.find({
        recipient: new RegExp(".*" + search[i] + ".*"),
      });
      if (result5) {
        searchResult.push(...result5);
      }
    }

    const uniqueResult = searchResult.filter((result, index) => {
      const _result = JSON.stringify(result);
      return (
        index ===
        searchResult.findIndex((obj) => {
          return JSON.stringify(obj) === _result;
        })
      );
    });

    res.status(200).json(uniqueResult);
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = mailRouter;
