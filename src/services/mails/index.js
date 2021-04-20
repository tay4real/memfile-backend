const mailRouter = require("express").Router();
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const { cloudinaryMail, cloudinaryDestroy } = require("../../utils/cloudinary");
const q2m = require("query-to-mongo");

const {
  authorize,
  checkSuperUser,
  checkAdmin,
} = require("../../utils/auth/middleware");

const mailModel = require("./mail.schema");

// list all mails - [Accessible to all users]
mailRouter.get("/", authorize, async (req, res, next) => {
  try {
    const query = q2m(req.query);
    const total = await mailModel.countDocuments(query.criteria);

    const allmails = await mailModel
      .find(query.criteria, query.options.fields)
      .skip(query.options.skip)
      .limit(query.options.limit)
      .sort(query.options.sort);

    const mails = allmails.filter((mail) => mail.status === 0);

    res.send({ links: query.links("/mails", total), mails });
  } catch (error) {
    next(new Error(error.message));
  }
});

mailRouter.get("/trash", authorize, async (req, res, next) => {
  try {
    const query = q2m(req.query);
    const total = await mailModel.countDocuments(query.criteria);

    const allmails = await mailModel
      .find(query.criteria, query.options.fields)
      .skip(query.options.skip)
      .limit(query.options.limit)
      .sort(query.options.sort);

    const mails = allmails.filter((mail) => mail.status === 1);

    res.send({ links: query.links("/mails", total), mails });
  } catch (error) {
    next(new Error(error.message));
  }
});

// list all Incoming mails - [Accessible to all users]
mailRouter.get("/incoming", authorize, async (req, res, next) => {
  try {
    const query = q2m(req.query);
    const total = await mailModel.countDocuments(query.criteria);

    const mails = await mailModel
      .find(query.criteria, query.options.fields)
      .skip(query.options.skip)
      .limit(query.options.limit)
      .sort(query.options.sort);

    const incoming_mails = mails.filter(
      (mail) => mail.status === 0 && mail.mail_mode === "incoming"
    );
    res.send({ links: query.links("/incoming", total), incoming_mails });
  } catch (error) {
    next(new Error(error.message));
  }
});

// list all Outgoing mails - [Accessible to all users]
mailRouter.get("/outgoing", authorize, async (req, res, next) => {
  try {
    const query = q2m(req.query);
    const total = await mailModel.countDocuments(query.criteria);

    const mails = await mailModel
      .find(query.criteria, query.options.fields)
      .skip(query.options.skip)
      .limit(query.options.limit)
      .sort(query.options.sort);

    const outgoing_mails = mails.filter(
      (mail) => mail.status === 0 && mail.mail_mode === "outgoing"
    );

    res.send({ links: query.links("/outgoing", total), outgoing_mails });
  } catch (error) {
    next(new Error(error.message));
  }
});

// retrieve a file - [Accessible to all users]
mailRouter.get("/:id", authorize, async (req, res, next) => {
  try {
    const mail = await mailModel.findById(req.params.id);

    if (mail) {
      if (mail.status === 0) {
        res.send(mail);
      } else {
        next(new APIError("Mail has been trashed", 404));
      }
    } else {
      next(new APIError("Mail not found", 404));
    }
  } catch (error) {
    console.log(error);
    next(new Error(error.message));
  }
});

mailRouter.post(
  "/add_mail",
  authorize,
  checkSuperUser,
  async (req, res, next) => {
    try {
      const newMail = await new mailModel(req.body).save();
      res.send(newMail._id);
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

mailRouter.post(
  "/:id/upload",
  cloudinaryMail.single("mail"),
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
      res.send(img_path);
    } catch (error) {
      next(error);
    }
  }
);

mailRouter.get("/memo/:id/pdf", async (req, res, next) => {
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

mailRouter.put("/:id", authorize, checkAdmin, async (req, res, next) => {
  try {
    const mail = await mailModel.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    });
    if (mail) {
      res.send(mail);
    } else {
      next(new APIError("Mail not found", 404));
    }
  } catch (error) {
    next(new Error(error.message));
  }
});

mailRouter.put(
  "/trash/:id",
  authorize,
  checkSuperUser,
  async (req, res, next) => {
    try {
      const trashMail = await mailModel.trashMail(req.params.id);
      if (trashMail) {
        res.send(trashMail);
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

mailRouter.put(
  "/trash/restore/:id",
  authorize,
  checkSuperUser,
  async (req, res, next) => {
    try {
      const restoreMail = await mailModel.restoreMail(req.params.id);
      if (restoreMail) {
        res.send(restoreMail);
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

mailRouter.delete(
  "/trash/delete/:id",
  authorize,
  checkSuperUser,
  async (req, res, next) => {
    try {
      const mail = await mailModel.deleteMail(req.params.id);
      if (mail) {
        res.send("Mail record deleted successfully");
      } else {
        next(new APIError("Mail not found", 404));
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

module.exports = mailRouter;
