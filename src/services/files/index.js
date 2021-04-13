const fileRouter = require("express").Router();
const {
  authorize,
  checkAdmin,
  checkSuperUser,
  checkImplementationOfficer,
} = require("../../utils/middlewares");
const { APIError } = require("../../utils");
const q2m = require("query-to-mongo");

const filesModel = require("./files.schema");

// list all files - [Accessible to all users]
fileRouter.get("/", authorize, async (req, res, next) => {
  try {
    const query = q2m(req.query);
    const total = await filesModel.countDocuments(query.criteria);
    const allfiles = await filesModel
      .find(query.criteria)
      .sort(query.options.sort)
      .skip(query.options.skip)
      .limit(query.options.limit)
      .populate("mails");

    const files = allfiles.filter((file) => file.status === 0);

    res.send({ links: query.links("/files", total), files });
  } catch (error) {
    next(new APIError(error.message, 500));
  }
});

// list all personal files - [Accessible to all users]
fileRouter.get("/personalfiles", authorize, async (req, res, next) => {
  try {
    const query = q2m(req.query);
    const total = await filesModel.countDocuments(query.criteria);
    const files = await filesModel
      .find(query.criteria)
      .sort(query.options.sort)
      .skip(query.options.skip)
      .limit(query.options.limit)
      .populate("authors");

    const personal_files = files.filter(
      (file) => file.status === 0 && file.file_type === "Personal File"
    );
    res.send({ links: query.links("/personalfiles", total), personal_files });
  } catch (error) {
    next(new APIError(error.message, 500));
  }
});

// list all general files - [Accessible to all users]
fileRouter.get("/generalfiles", authorize, async (req, res, next) => {
  try {
    const query = q2m(req.query);
    const total = await filesModel.countDocuments(query.criteria);
    const files = await filesModel
      .find(query.criteria)
      .sort(query.options.sort)
      .skip(query.options.skip)
      .limit(query.options.limit)
      .populate("authors");

    const general_files = files.filter(
      (file) => file.status === 0 && file.file_type === "General File"
    );
    res.send({ links: query.links("/generalfiles", total), general_files });
  } catch (error) {
    next(new APIError(error.message, 500));
  }
});

// retrieve a file - [Accessible to all users]
fileRouter.get("/:id", authorize, async (req, res, next) => {
  try {
    const file = await filesModel.findFileWithMails(req.params.id);
    res.send(file);
  } catch (error) {
    next(error);
  }
});

fileRouter.post(
  "/newfile",
  authorize,
  checkSuperUser || checkAdmin || checkImplementationOfficer,
  async (req, res, next) => {
    try {
      const newFile = new filesModel(req.body);
      const { _id } = await newFile.save();

      res.status(201).send(_id);
    } catch (error) {
      next(new APIError(error.message, 500));
    }
  }
);

fileRouter.put(
  "/:id",
  authorize,
  checkSuperUser || checkAdmin || checkImplementationOfficer,
  async (req, res, next) => {
    try {
      const file = await filesModel.findByIdAndUpdate(req.params.id, req.body, {
        runValidators: true,
        new: true,
      });
      if (file) {
        res.send(file);
      } else {
        next(new APIError("File not found", 404));
      }
    } catch (error) {
      next(new APIError(error.message, 500));
    }
  }
);

fileRouter.put(
  "/:id/fileup/:mailid",
  authorize,
  checkSuperUser || checkAdmin || checkImplementationOfficer,
  async (req, res, next) => {
    try {
      const file = await filesModel.fileupDocument(
        req.params.id,
        req.params.mailid
      );
      if (file) {
        res.send(file);
      } else {
        next(new APIError("File not found", 404));
      }
    } catch (error) {
      next(new APIError(error.message, 500));
    }
  }
);

fileRouter.delete(
  "/:id/remove/:mailid",
  authorize,
  checkSuperUser || checkAdmin || checkImplementationOfficer,
  async (req, res, next) => {
    try {
      const file = await filesModel.removeDocument(
        req.params.id,
        req.params.mailid
      );
      if (file) {
        res.send(file);
      } else {
        next(new APIError("File not found", 404));
      }
    } catch (error) {
      next(new APIError(error.message, 500));
    }
  }
);

fileRouter.put(
  "/trash/:id",
  authorize,

  async (req, res, next) => {
    try {
      const trashFile = await filesModel.trashFile(req.params.id);
      if (trashFile) {
        res.send(trashFile);
      }
    } catch (error) {
      next(new APIError(error.message, 500));
    }
  }
);

fileRouter.put(
  "/restore/:id",
  authorize,

  async (req, res, next) => {
    try {
      const restoreFile = await filesModel.restoreFile(req.params.id);
      if (restoreFile) {
        res.send(restoreFile);
      }
    } catch (error) {
      next(new APIError(error.message, 500));
    }
  }
);

fileRouter.delete(
  "/delete/:id",
  authorize,
  checkSuperUser,
  async (req, res, next) => {
    try {
      const file = await filesModel.deleteFile(req.params.id);
      if (file) {
        res.send("File record deleted successfully");
      } else {
        next(new APIError("File not found", 404));
      }
    } catch (error) {
      next(new APIError(error.message, 500));
    }
  }
);

module.exports = fileRouter;
