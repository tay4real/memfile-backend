const fileRouter = require("express").Router();
const {
  authorize,
  isPermanentSecretary,
  isAdmin,
  isRegistryOfficer,
} = require("../../utils/auth/middleware");
const q2m = require("query-to-mongo");
const filesModel = require("./personal-files.schema");

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
      .populate("personnels");

    res.send(allfiles);
  } catch (error) {
    next(new Error(error.message));
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
  isAdmin || isPermanentSecretary || isRegistryOfficer,
  async (req, res, next) => {
    try {
      // check if File title already exist for a particular MDA entry
      const file = filesModel.find({
        mdaShortName: req.body.mdaShortName,
        file_title: req.body.file_title,
      });

      console.log();

      if ((await file).length === 0) {
        const newFile = new filesModel(req.body);
        const { _id } = await newFile.save();
        res.status(201).send(_id);
      } else {
        next(new Error("File Title already exist"));
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

fileRouter.put(
  "/:id",
  authorize,
  isAdmin || isPermanentSecretary || isRegistryOfficer,
  async (req, res, next) => {
    try {
      const file = await filesModel.findByIdAndUpdate(req.params.id, req.body, {
        runValidators: true,
        new: true,
      });
      if (file) {
        res.send(file);
      } else {
        next(new Error("File not found"));
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

fileRouter.put(
  "/:id/fileup/:mailid",
  authorize,
  isAdmin || isPermanentSecretary || isRegistryOfficer,
  async (req, res, next) => {
    try {
      const file = await filesModel.fileupDocument(
        req.params.id,
        req.params.mailid
      );
      if (file) {
        res.send(file);
      } else {
        next(new Error("File not found"));
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

fileRouter.delete(
  "/:id/remove/:mailid",
  authorize,
  isAdmin || isPermanentSecretary || isRegistryOfficer,
  async (req, res, next) => {
    try {
      const file = await filesModel.removeDocument(
        req.params.id,
        req.params.mailid
      );
      if (file) {
        res.send(file);
      } else {
        next(new Error("File not found"));
      }
    } catch (error) {
      next(new Error(error.message));
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
      next(new APIError(error.message));
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
      next(new Error(error.message));
    }
  }
);

fileRouter.delete("/delete/:id", authorize, isAdmin, async (req, res, next) => {
  try {
    const file = await filesModel.deleteFile(req.params.id);
    if (file) {
      res.send("File record deleted successfully");
    } else {
      next(new Error("File not found"));
    }
  } catch (error) {
    next(new Error(error.message));
  }
});

module.exports = fileRouter;
