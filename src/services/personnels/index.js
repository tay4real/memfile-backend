const router = require("express").Router();
const fs = require("fs");
const mongoose = require("mongoose");

const PDFDocument = require("pdfkit");
const {
  cloudinaryLeaves,
  cloudinaryPromotions,
  cloudinaryQualifications,
  cloudinaryQueries,
  cloudinaryDestroy,
} = require("../../utils/cloudinary");
const q2m = require("query-to-mongo");

const { authorize, isAdmin } = require("../../utils/auth/middleware");

const personnelModel = require("./personnel.schema");

router.post("/", async (req, res, next) => {
  try {
    const newPersonnel = new personnelModel(req.body);
    const { _id } = await newPersonnel.save();
    res.status(201).send(_id);
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const personnels = await personnelModel.find();
    res.send(personnels);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const personnel = await personnelModel.findById(req.params.id);
    res.send(personnel);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const modifiedPersonnel = await personnelModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        runValidators: true,
        new: true,
      }
    );
    if (modifiedPersonnel) {
      res.send(modifiedPersonnel);
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const personnel = await personnelModel.findByIdAndDelete(req.params.id);
    if (personnel) {
      res.send(personnel);
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post(
  "/:id/qualifications/",
  cloudinaryQualifications.single("qualification"),
  async (req, res, next) => {
    try {
      const qualification = { ...req.body, certificateURL: req.file.path };
      const updated = await personnelModel.findByIdAndUpdate(
        req.params.id,
        {
          $push: {
            qualifications: qualification,
          },
        },
        { runValidators: true, new: true }
      );
      res.status(201).send(updated);
    } catch (error) {
      next(error);
    }
  }
);

router.get("/:id/qualifications/", async (req, res, next) => {
  try {
    const { qualifications } = await personnelModel.findById(req.params.id, {
      qualifications: 1,
      _id: 0,
    });
    res.send(qualifications);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get("/:id/qualifications/:qualificationId", async (req, res, next) => {
  try {
    const { qualifications } = await personnelModel.findOne(
      {
        _id: mongoose.Types.ObjectId(req.params.id),
      },
      {
        _id: 0,
        qualifications: {
          $elemMatch: {
            _id: mongoose.Types.ObjectId(req.params.qualificationId),
          },
        },
      }
    );

    if (qualifications && qualifications.length > 0) {
      res.send(qualifications[0]);
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.delete(
  "/:id/qualifications/:qualificationId",
  async (req, res, next) => {
    try {
      const modifiedQualifications = await personnelModel.findByIdAndUpdate(
        req.params.id,
        {
          $pull: {
            qualifications: {
              _id: mongoose.Types.ObjectId(req.params.qualificationId),
            },
          },
        },
        {
          new: true,
        }
      );
      res.send(modifiedQualifications);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

router.put(
  "/:id/qualifications/:qualificationId",

  async (req, res, next) => {
    try {
      const { qualifications } = await personnelModel.findOne(
        {
          _id: mongoose.Types.ObjectId(req.params.id),
        },
        {
          _id: 0,
          qualifications: {
            $elemMatch: {
              _id: mongoose.Types.ObjectId(req.params.qualificationId),
            },
          },
        }
      );

      if (qualifications && qualifications.length > 0) {
        const qualificationToReplace = {
          ...qualifications[0].toObject(),
          ...req.body,
        };

        const modifiedQualifications = await personnelModel.findOneAndUpdate(
          {
            _id: mongoose.Types.ObjectId(req.params.id),
            "qualifications._id": mongoose.Types.ObjectId(
              req.params.qualificationId
            ),
          },
          { $set: { "qualifications.$": qualificationToReplace } },
          {
            runValidators: true,
            new: true,
          }
        );
        res.send(modifiedQualifications);
      } else {
        next();
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

router.post(
  "/:id/leave_requests",
  cloudinaryLeaves.single("request"),
  async (req, res, next) => {
    try {
      const leaveRequest = { ...req.body, requestUpload: req.file.path };
      const updated = await personnelModel.findByIdAndUpdate(
        req.params.id,
        {
          $push: {
            leaves: leaveRequest,
          },
        },
        { runValidators: true, new: true }
      );
      res.status(201).send(updated);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id/leaves/:leaveId/request",
  cloudinaryLeaves.single("request"),
  async (req, res, next) => {
    try {
      const { leaves } = await personnelModel.findOne(
        {
          _id: mongoose.Types.ObjectId(req.params.id),
        },
        {
          _id: 0,
          leaves: {
            $elemMatch: {
              _id: mongoose.Types.ObjectId(req.params.leaveId),
            },
          },
        }
      );

      const leaveRequest = { ...req.body, requestUpload: req.file.path };

      if (leaves && leaves.length > 0) {
        const leaveToReplace = {
          ...leaves[0].toObject(),
          ...leaveRequest,
        };

        const modifiedLeaves = await personnelModel.findOneAndUpdate(
          {
            _id: mongoose.Types.ObjectId(req.params.id),
            "leaves._id": mongoose.Types.ObjectId(req.params.leaveId),
          },
          { $set: { "leaves.$": leaveToReplace } },
          {
            runValidators: true,
            new: true,
          }
        );
        res.send(modifiedLeaves);
      } else {
        next();
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

router.put(
  "/:id/leaves/:leaveId/approval",
  cloudinaryLeaves.single("approval"),
  async (req, res, next) => {
    try {
      const { leaves } = await personnelModel.findOne(
        {
          _id: mongoose.Types.ObjectId(req.params.id),
        },
        {
          _id: 0,
          leaves: {
            $elemMatch: {
              _id: mongoose.Types.ObjectId(req.params.leaveId),
            },
          },
        }
      );

      const leaveApproval = { ...req.body, approvalUpload: req.file.path };

      if (leaves && leaves.length > 0) {
        const leaveToReplace = {
          ...leaves[0].toObject(),
          ...leaveApproval,
        };

        const modifiedLeaves = await personnelModel.findOneAndUpdate(
          {
            _id: mongoose.Types.ObjectId(req.params.id),
            "leaves._id": mongoose.Types.ObjectId(req.params.leaveId),
          },
          { $set: { "leaves.$": leaveToReplace } },
          {
            runValidators: true,
            new: true,
          }
        );
        res.send(modifiedLeaves);
      } else {
        next();
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

router.get("/:id/leaves/", async (req, res, next) => {
  try {
    const { leaves } = await personnelModel.findById(req.params.id, {
      leaves: 1,
      _id: 0,
    });
    res.send(leaves);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get("/:id/leaves/:leaveId", async (req, res, next) => {
  try {
    const { leaves } = await personnelModel.findOne(
      {
        _id: mongoose.Types.ObjectId(req.params.id),
      },
      {
        _id: 0,
        leaves: {
          $elemMatch: {
            _id: mongoose.Types.ObjectId(req.params.leaveId),
          },
        },
      }
    );

    if (leaves && leaves.length > 0) {
      res.send(leaves[0]);
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.delete("/:id/leaves/:leaveId", async (req, res, next) => {
  try {
    const modifiedLeaves = await personnelModel.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          leaves: {
            _id: mongoose.Types.ObjectId(req.params.leaveId),
          },
        },
      },
      {
        new: true,
      }
    );
    res.send(modifiedLeaves);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post(
  "/:id/promotions",
  cloudinaryPromotions.single("promotion"),
  async (req, res, next) => {
    try {
      const promotion = { ...req.body, promotionUpload: req.file.path };
      const updated = await personnelModel.findByIdAndUpdate(
        req.params.id,
        {
          $push: {
            promotions: promotion,
          },
        },
        { runValidators: true, new: true }
      );
      res.status(201).send(updated);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id/promotions/:promotionId",
  cloudinaryPromotions.single("promotion"),
  async (req, res, next) => {
    try {
      const { promotions } = await personnelModel.findOne(
        {
          _id: mongoose.Types.ObjectId(req.params.id),
        },
        {
          _id: 0,
          promotions: {
            $elemMatch: {
              _id: mongoose.Types.ObjectId(req.params.promotionId),
            },
          },
        }
      );

      const promotion = { ...req.body, promotionUpload: req.file.path };

      if (promotions && promotions.length > 0) {
        const promotionToReplace = {
          ...promotions[0].toObject(),
          ...promotion,
        };

        const modifiedPromotion = await personnelModel.findOneAndUpdate(
          {
            _id: mongoose.Types.ObjectId(req.params.id),
            "promotions._id": mongoose.Types.ObjectId(req.params.promotionId),
          },
          { $set: { "promotions.$": promotionToReplace } },
          {
            runValidators: true,
            new: true,
          }
        );
        res.send(modifiedPromotion);
      } else {
        next();
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

router.get("/:id/promotions/", async (req, res, next) => {
  try {
    const { promotions } = await personnelModel.findById(req.params.id, {
      promotions: 1,
      _id: 0,
    });
    res.send(promotions);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get("/:id/promotions/:promotionId", async (req, res, next) => {
  try {
    const { promotions } = await personnelModel.findOne(
      {
        _id: mongoose.Types.ObjectId(req.params.id),
      },
      {
        _id: 0,
        promotions: {
          $elemMatch: {
            _id: mongoose.Types.ObjectId(req.params.promotionId),
          },
        },
      }
    );

    if (promotions && promotions.length > 0) {
      res.send(promotions[0]);
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.delete("/:id/promotions/:promotionId", async (req, res, next) => {
  try {
    const modifiedPromotions = await personnelModel.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          promotions: {
            _id: mongoose.Types.ObjectId(req.params.promotionId),
          },
        },
      },
      {
        new: true,
      }
    );
    res.send(modifiedPromotions);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post(
  "/:id/query-issues",
  cloudinaryLeaves.single("issuedQuery"),
  async (req, res, next) => {
    try {
      const queryIssued = { ...req.body, queryUpload: req.file.path };
      const updated = await personnelModel.findByIdAndUpdate(
        req.params.id,
        {
          $push: {
            queries: queryIssued,
          },
        },
        { runValidators: true, new: true }
      );
      res.status(201).send(updated);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id/queries/:queryId/",
  cloudinaryLeaves.single("issuedQuery"),
  async (req, res, next) => {
    try {
      const { queries } = await personnelModel.findOne(
        {
          _id: mongoose.Types.ObjectId(req.params.id),
        },
        {
          _id: 0,
          queries: {
            $elemMatch: {
              _id: mongoose.Types.ObjectId(req.params.queryId),
            },
          },
        }
      );

      const queryIssued = { ...req.body, queryUpload: req.file.path };

      if (queries && queries.length > 0) {
        const queryToReplace = {
          ...queries[0].toObject(),
          ...queryIssued,
        };

        const modifiedQueries = await personnelModel.findOneAndUpdate(
          {
            _id: mongoose.Types.ObjectId(req.params.id),
            "queries._id": mongoose.Types.ObjectId(req.params.queryId),
          },
          { $set: { "queries.$": queryToReplace } },
          {
            runValidators: true,
            new: true,
          }
        );
        res.send(modifiedQueries);
      } else {
        next();
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

router.put(
  "/:id/queries/:queryId/response",
  cloudinaryQueries.single("queryResponse"),
  async (req, res, next) => {
    try {
      const { queries } = await personnelModel.findOne(
        {
          _id: mongoose.Types.ObjectId(req.params.id),
        },
        {
          _id: 0,
          queries: {
            $elemMatch: {
              _id: mongoose.Types.ObjectId(req.params.queryId),
            },
          },
        }
      );

      const queryResponse = { ...req.body, responseUpload: req.file.path };

      if (queries && queries.length > 0) {
        const queryToReplace = {
          ...queries[0].toObject(),
          ...queryResponse,
        };

        const modifiedQueries = await personnelModel.findOneAndUpdate(
          {
            _id: mongoose.Types.ObjectId(req.params.id),
            "queries._id": mongoose.Types.ObjectId(req.params.queryId),
          },
          { $set: { "queries.$": queryToReplace } },
          {
            runValidators: true,
            new: true,
          }
        );
        res.send(modifiedQueries);
      } else {
        next();
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

router.get("/:id/queries/", async (req, res, next) => {
  try {
    const { queries } = await personnelModel.findById(req.params.id, {
      queries: 1,
      _id: 0,
    });
    res.send(queries);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get("/:id/queries/:queryId", async (req, res, next) => {
  try {
    const { queries } = await personnelModel.findOne(
      {
        _id: mongoose.Types.ObjectId(req.params.id),
      },
      {
        _id: 0,
        queries: {
          $elemMatch: {
            _id: mongoose.Types.ObjectId(req.params.queryId),
          },
        },
      }
    );

    if (queries && queries.length > 0) {
      res.send(queries[0]);
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.delete("/:id/queries/:queryId", async (req, res, next) => {
  try {
    const modifiedQueries = await personnelModel.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          queries: {
            _id: mongoose.Types.ObjectId(req.params.queryId),
          },
        },
      },
      {
        new: true,
      }
    );
    res.send(modifiedQueries);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

module.exports = router;
