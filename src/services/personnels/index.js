/**
 * @swagger
 * tags:
 *   name: Personnels
 *   description: API for managing personnel records, including their qualifications, leaves, promotions, and queries.
 */

const router = require('express').Router();
const fs = require('fs');
const mongoose = require('mongoose');

const PDFDocument = require('pdfkit');
const {
  cloudinaryLeaves,
  cloudinaryPromotions,
  cloudinaryQualifications,
  cloudinaryQueries,
  cloudinaryDestroy,
} = require('../../utils/cloudinary');
const q2m = require('query-to-mongo');

const { authorize, isAdmin } = require('../../utils/auth/middleware');

const personnelModel = require('./personnel.schema');

/**
 * @swagger
 * /personnels:
 *   post:
 *     summary: Create a new personnel
 *     tags: [Personnels]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               firstName: John
 *               lastName: Doe
 *               email: john@example.com
 *               // Add other personnel fields here
 *     responses:
 *       201:
 *         description: Created
 */

router.post('/', async (req, res, next) => {
  try {
    const newPersonnel = new personnelModel(req.body);
    const { _id } = await newPersonnel.save();
    res.status(201).send(_id);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /personnels:
 *   get:
 *     summary: Get all personnels
 *     tags: [Personnels]
 *     responses:
 *       200:
 *         description: OK
 */

router.get('/', async (req, res, next) => {
  try {
    const personnels = await personnelModel.find();
    res.send(personnels);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

/**
 * @swagger
 * /personnels/{id}:
 *   get:
 *     summary: Get a specific personnel by ID
 *     tags: [Personnels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */

router.get('/:id', async (req, res, next) => {
  try {
    const personnel = await personnelModel.findById(req.params.id);
    res.send(personnel);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

/**
 * @swagger
 * /personnels/{id}:
 *   put:
 *     summary: Update personnel details
 *     tags: [Personnels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Personnel ID
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               position: Senior Officer
 *     responses:
 *       200:
 *         description: Personnel updated successfully
 */

router.put('/:id', async (req, res, next) => {
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

/**
 * @swagger
 * /personnels/{id}:
 *   delete:
 *     summary: Delete a personnel by ID
 *     tags: [Personnels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Personnel ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Personnel deleted successfully
 */

router.delete('/:id', async (req, res, next) => {
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

/**
 * @swagger
 *
 * /personnels/{id}/qualifications/:
 *   post:
 *     summary: Add a qualification for a personnel.
 *     tags: [Personnel]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Personnel ID
 *       - in: formData
 *         name: qualification
 *         type: file
 *         required: true
 *         description: Qualification document file
 *     responses:
 *       201:
 *         description: Qualification added successfully.
 *
 *   get:
 *     summary: Get all qualifications for a personnel.
 *     tags: [Personnel]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Personnel ID
 *     responses:
 *       200:
 *         description: List of qualifications.
 *
 * /personnels/{id}/qualifications/{qualificationId}:
 *   get:
 *     summary: Get a specific qualification by ID.
 *     tags: [Personnel]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: qualificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Qualification found.
 *
 *   put:
 *     summary: Update a specific qualification.
 *     tags: [Personnel]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: qualificationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               title: Updated Degree
 *               institution: New University
 *     responses:
 *       200:
 *         description: Qualification updated.
 *
 *   delete:
 *     summary: Delete a specific qualification.
 *     tags: [Personnel]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: qualificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Qualification deleted.
 *
 *
 *
 */

router.post(
  '/:id/qualifications/',
  cloudinaryQualifications.single('qualification'),
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

router.get('/:id/qualifications/', async (req, res, next) => {
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

router.get('/:id/qualifications/:qualificationId', async (req, res, next) => {
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
  '/:id/qualifications/:qualificationId',
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
  '/:id/qualifications/:qualificationId',

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
            'qualifications._id': mongoose.Types.ObjectId(
              req.params.qualificationId
            ),
          },
          { $set: { 'qualifications.$': qualificationToReplace } },
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

/**
 * @swagger
 * /personnel/{id}/leave_requests:
 *   post:
 *     summary: Add a new leave request to a personnel record
 *     tags: [Personnel - Leaves]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID of the personnel
 *         required: true
 *         schema:
 *           type: string
 *       - in: formData
 *         name: request
 *         type: file
 *         required: true
 *         description: File attachment for the leave request
 *       - in: formData
 *         name: type
 *         type: string
 *         description: Type of leave
 *       - in: formData
 *         name: startDate
 *         type: string
 *         format: date
 *       - in: formData
 *         name: endDate
 *         type: string
 *         format: date
 *       - in: formData
 *         name: reason
 *         type: string
 *     responses:
 *       201:
 *         description: Leave request added successfully
 *       400:
 *         description: Validation error or invalid data
 */

router.post(
  '/:id/leave_requests',
  cloudinaryLeaves.single('request'),
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

/**
 * @swagger
 * /personnel/{id}/leaves/{leaveId}/request:
 *   put:
 *     summary: Update an existing leave request with a new file or data
 *     tags: [Personnel - Leaves]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: leaveId
 *         required: true
 *         schema: { type: string }
 *       - in: formData
 *         name: request
 *         type: file
 *         required: true
 *       - in: formData
 *         name: type
 *         type: string
 *       - in: formData
 *         name: startDate
 *         type: string
 *         format: date
 *       - in: formData
 *         name: endDate
 *         type: string
 *         format: date
 *       - in: formData
 *         name: reason
 *         type: string
 *     responses:
 *       200:
 *         description: Leave request updated
 *       404:
 *         description: Leave not found
 */

router.put(
  '/:id/leaves/:leaveId/request',
  cloudinaryLeaves.single('request'),
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
            'leaves._id': mongoose.Types.ObjectId(req.params.leaveId),
          },
          { $set: { 'leaves.$': leaveToReplace } },
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

/**
 * @swagger
 * /personnel/{id}/leaves/{leaveId}/approval:
 *   put:
 *     summary: Approve or update approval document for a leave request
 *     tags: [Personnel - Leaves]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: path
 *         name: leaveId
 *         required: true
 *       - in: formData
 *         name: approval
 *         type: file
 *         required: true
 *       - in: formData
 *         name: approvalStatus
 *         type: string
 *         enum: [Approved, Rejected, Pending]
 *     responses:
 *       200:
 *         description: Leave approval updated
 *       404:
 *         description: Leave not found
 */

router.put(
  '/:id/leaves/:leaveId/approval',
  cloudinaryLeaves.single('approval'),
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
            'leaves._id': mongoose.Types.ObjectId(req.params.leaveId),
          },
          { $set: { 'leaves.$': leaveToReplace } },
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

/**
 * @swagger
 * /personnel/{id}/leaves:
 *   get:
 *     summary: Get all leave requests of a specific personnel
 *     tags: [Personnel - Leaves]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: List of leave records
 *       404:
 *         description: Personnel not found
 */

router.get('/:id/leaves/', async (req, res, next) => {
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

/**
 * @swagger
 * /personnel/{id}/leaves/{leaveId}:
 *   get:
 *     summary: Get a specific leave request by ID
 *     tags: [Personnel - Leaves]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: path
 *         name: leaveId
 *         required: true
 *     responses:
 *       200:
 *         description: Leave record found
 *       404:
 *         description: Leave not found
 */

router.get('/:id/leaves/:leaveId', async (req, res, next) => {
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

/**
 * @swagger
 * /personnel/{id}/leaves/{leaveId}:
 *   delete:
 *     summary: Delete a specific leave record from a personnel profile
 *     tags: [Personnel - Leaves]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: path
 *         name: leaveId
 *         required: true
 *     responses:
 *       200:
 *         description: Leave record deleted
 *       404:
 *         description: Record not found
 */

router.delete('/:id/leaves/:leaveId', async (req, res, next) => {
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

/**
 * @swagger
 * /personnels/{id}/promotions:
 *   post:
 *     summary: Add a promotion record
 *     tags: [Personnel - Promotions]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: formData
 *         name: promotion
 *         type: file
 *         description: Promotion letter file
 *     responses:
 *       201:
 *         description: Promotion added
 */

router.post(
  '/:id/promotions',
  cloudinaryPromotions.single('promotion'),
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

/**
 * @swagger
 * /personnels/{id}/promotions/{promotionId}:
 *   put:
 *     summary: Update a promotion record
 *     tags: [Personnel - Promotions]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: path
 *         name: promotionId
 *         required: true
 *       - in: formData
 *         name: promotion
 *         type: file
 *         description: Updated promotion file
 *     responses:
 *       200:
 *         description: Promotion updated
 */

router.put(
  '/:id/promotions/:promotionId',
  cloudinaryPromotions.single('promotion'),
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
            'promotions._id': mongoose.Types.ObjectId(req.params.promotionId),
          },
          { $set: { 'promotions.$': promotionToReplace } },
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

/**
 * @swagger
 * /personnels/{id}/promotions:
 *   get:
 *     summary: List all promotions for a personnel
 *     tags: [ Personnel - Promotions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: List of promotions
 */

router.get('/:id/promotions/', async (req, res, next) => {
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

/**
 * @swagger
 * /personnels/{id}/promotions/{promotionId}:
 *   get:
 *     summary: Get a specific promotion by ID
 *     tags: [Personnel - Promotions]
 *     parameters:
 *       - in: path
 *         name: id
 *       - in: path
 *         name: promotionId
 *     responses:
 *       200:
 *         description: Promotion details
 */

router.get('/:id/promotions/:promotionId', async (req, res, next) => {
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

/**
 * @swagger
 * /personnels/{id}/promotions/{promotionId}:
 *   delete:
 *     summary: Delete a promotion by ID
 *     tags: [Personnel - Promotions]
 *     parameters:
 *       - in: path
 *         name: id
 *       - in: path
 *         name: promotionId
 *     responses:
 *       200:
 *         description: Promotion deleted
 */

router.delete('/:id/promotions/:promotionId', async (req, res, next) => {
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

/**
 * @swagger
 * /personnels/{id}/query-issues:
 *   post:
 *     summary: Issue a query to personnel
 *     tags: [Personnel - Queries]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: formData
 *         name: issuedQuery
 *         type: file
 *         description: Issued query file
 *     responses:
 *       201:
 *         description: Query issued successfully
 */

router.post(
  '/:id/query-issues',
  cloudinaryLeaves.single('issuedQuery'),
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

/**
 * @swagger
 * /personnels/{id}/queries/{queryId}:
 *   put:
 *     summary: Update a query
 *     tags: [Personnel - Queries]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *       - in: path
 *         name: queryId
 *       - in: formData
 *         name: issuedQuery
 *         type: file
 *     responses:
 *       200:
 *         description: Query updated
 */

router.put(
  '/:id/queries/:queryId/',
  cloudinaryLeaves.single('issuedQuery'),
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
            'queries._id': mongoose.Types.ObjectId(req.params.queryId),
          },
          { $set: { 'queries.$': queryToReplace } },
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

/**
 * @swagger
 * /personnels/{id}/queries/{queryId}/response:
 *   put:
 *     summary: Upload a query response
 *     tags: [Personnel - Queries]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *       - in: path
 *         name: queryId
 *       - in: formData
 *         name: queryResponse
 *         type: file
 *         description: Query response file
 *     responses:
 *       200:
 *         description: Query response uploaded
 */

router.put(
  '/:id/queries/:queryId/response',
  cloudinaryQueries.single('queryResponse'),
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
            'queries._id': mongoose.Types.ObjectId(req.params.queryId),
          },
          { $set: { 'queries.$': queryToReplace } },
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

/**
 * @swagger
 * /personnels/{id}/queries:
 *   get:
 *     summary: Get all issued queries for a personnel
 *     tags: [Personnel - Queries]
 *     parameters:
 *       - in: path
 *         name: id
 *     responses:
 *       200:
 *         description: List of queries
 */

router.get('/:id/queries/', async (req, res, next) => {
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

/**
 * @swagger
 * /personnels/{id}/queries/{queryId}:
 *   get:
 *     summary: Get a specific query by ID
 *     tags: [Personnel - Queries]
 *     parameters:
 *       - in: path
 *         name: id
 *       - in: path
 *         name: queryId
 *     responses:
 *       200:
 *         description: Query details
 */

router.get('/:id/queries/:queryId', async (req, res, next) => {
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

/**
 * @swagger
 * /personnel/{id}/queries/{queryId}:
 *   delete:
 *     summary: Delete a query by ID
 *     tags: [Personnel - Queries]
 *     parameters:
 *       - in: path
 *         name: id
 *       - in: path
 *         name: queryId
 *     responses:
 *       200:
 *         description: Query deleted
 */

router.delete('/:id/queries/:queryId', async (req, res, next) => {
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
