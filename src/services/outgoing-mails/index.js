/**
 * @swagger
 * tags:
 *   name: Outgoing Mails
 *   description: Operations related to receiving and managing outgoing mails
 */
const mailRouter = require('express').Router();
const fs = require('fs');
const { join } = require('path');
const mongoose = require('mongoose');

const PDFDocument = require('pdfkit');
const {
  cloudinaryOutgoingMail,
  cloudinaryDestroy,
} = require('../../utils/cloudinary');
const q2m = require('query-to-mongo');

const { authorize, isAdmin } = require('../../utils/auth/middleware');

const mailModel = require('./mail.schema');


/**
 * @swagger
 * /outgoing-mails:
 *   get:
 *     summary: Get all outgoing mails
 *     tags: [Outgoing Mails]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of outgoing mails
 *       500:
 *         description: Server error
 */

mailRouter.get('/', authorize, async (req, res, next) => {
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



/**
 * @swagger
 * /outgoing-mails/{id}:
 *   get:
 *     summary: Get a specific outgoing mail by ID
 *     tags: [Outgoing Mails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Mail ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Outgoing mail object
 *       404:
 *         description: Mail not found
 */

mailRouter.get('/:id', authorize, async (req, res, next) => {
  try {
    const mail = await mailModel.findById(req.params.id);
    res.send(mail);
  } catch (error) {
    next(new Error(error.message));
  }
});


/**
 * @swagger
 * /outgoing-mails:
 *   post:
 *     summary: Create a new outgoing mail
 *     tags: [Outgoing Mails]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Outgoing mail object
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OutgoingMail'
 *     responses:
 *       200:
 *         description: Mail created successfully
 *       500:
 *         description: Server error
 */

mailRouter.post('/', authorize, async (req, res, next) => {
  try {
    const newMail = await new mailModel(req.body).save();
    res.send(newMail._id);
  } catch (error) {
    next(res.status(500).send(error.message));
  }
});


/**
 * @swagger
 * /outgoing-mails/{id}/upload:
 *   post:
 *     summary: Upload a file for an outgoing mail
 *     tags: [Outgoing Mails]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: mail
 *         in: formData
 *         type: file
 *         required: true
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       500:
 *         description: Upload failed
 */

mailRouter.post(
  '/:id/upload',
  authorize,
  cloudinaryOutgoingMail.single('mail'),
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
        res.send('Uploaded Successfully');
      }
    } catch (error) {
      next(error);
    }
  }
);


/**
 * @swagger
 * /outgoing-mails/{id}:
 *   put:
 *     summary: Update an existing outgoing mail
 *     tags: [Outgoing Mails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Mail ID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Updated mail object
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OutgoingMail'
 *     responses:
 *       200:
 *         description: Mail updated successfully
 *       404:
 *         description: Mail not found
 */

mailRouter.put('/:id', authorize, async (req, res, next) => {
  try {
    const mail = await mailModel.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    });
    if (mail) {
      res.send('Outgoing mail updated successfully');
    } else {
      res.status(404).send('Outgoing mail not found');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});



/**
 * @swagger
 * /outgoing-mails/{id}/pdf:
 *   get:
 *     summary: Download PDF version of outgoing mail
 *     tags: [Outgoing Mails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Mail ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF document
 *       404:
 *         description: Mail not found
 */

mailRouter.get('/:id/pdf', authorize, async (req, res, next) => {
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
      'Content-Type': 'application/pdf',
    });
    res.status(201).send('OK');
  } catch (error) {
    next(error);
  }
});



/**
 * @swagger
 * /outgoing-mails/changestatus/{id}:
 *   put:
 *     summary: Change filing status of an outgoing mail (Admin only)
 *     tags: [Outgoing Mails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Mail ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status updated
 *       500:
 *         description: Server error
 */

mailRouter.put(
  '/changestatus/:id',
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



/**
 * @swagger
 * /outgoing-mails/{id}:
 *   delete:
 *     summary: Delete a single outgoing mail by ID
 *     tags: [Outgoing Mails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Mail ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mail deleted successfully
 *       404:
 *         description: Mail not found
 */

mailRouter.delete('/:id', authorize, isAdmin, async (req, res, next) => {
  try {
    const mail = await mailModel.findByIdAndDelete(req.params.id);
    if (mail) {
      res.send('Delete successful');
    } else {
      res.status(404).send('Mail Not found');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});



/**
 * @swagger
 * /outgoing-mails:
 *   delete:
 *     summary: Delete all outgoing mails (Admin only)
 *     tags: [Outgoing Mails]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All mails deleted
 *       500:
 *         description: Server error
 */

mailRouter.delete('/', authorize, isAdmin, async (req, res, next) => {
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
          'Some error occurred while removing all outgoing mails.',
      })
    );
  }
});


/**
 * @swagger
 * /outgoing-mails/report/stats:
 *   get:
 *     summary: Monthly stats of outgoing mails
 *     tags: [Outgoing Mails]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly mail counts
 *       500:
 *         description: Server error
 */

mailRouter.get('/report/stats', authorize, async (req, res) => {
  try {
    const data = await mailModel.aggregate([
      {
        $project: {
          month: { $month: '$createdAt' },
        },
      },
      {
        $group: {
          _id: '$month',
          total: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json(error);
  }
});



/**
 * @swagger
 * /outgoing-mails/report/counts:
 *   get:
 *     summary: Total count of outgoing mails
 *     tags: [Outgoing Mails]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total count
 *       500:
 *         description: Server error
 */

mailRouter.get('/report/counts', authorize, async (req, res) => {
  try {
    const total = await mailModel.countDocuments();
    res.status(200).json({ total });
  } catch (error) {
    res.status(500).json(error);
  }
});



/**
 * @swagger
 * /outgoing-mails/search/results:
 *   post:
 *     summary: Search outgoing mails
 *     tags: [Outgoing Mails]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Search criteria
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               criteria:
 *                 type: string
 *                 example: Subject keyword or Ref number
 *     responses:
 *       200:
 *         description: Search results
 *       500:
 *         description: Server error
 */

mailRouter.post('/search/results', authorize, async (req, res) => {
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

    const arr = searchVariable.split(' ');
    for (let i = 0; i < arr.length; i++) {
      arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
    }
    const capitalizeFirstLetterPerWord = arr.join(' ');

    search.push(capitalizeFirstLetterPerWord);

    const searchResult = [];

    for (let i = 0; i < search.length; i++) {
      const result = await mailModel.find({
        ref_no: new RegExp('.*' + search[i] + '.*'),
      });
      if (result) {
        searchResult.push(...result);
      }
      const result2 = await mailModel.find({
        subject: new RegExp('.*' + search[i] + '.*'),
      });
      if (result2) {
        searchResult.push(...result2);
      }
      const result3 = await mailModel.find({
        to: new RegExp('.*' + search[i] + '.*'),
      });
      if (result3) {
        searchResult.push(...result3);
      }
      const result4 = await mailModel.find({
        sender: new RegExp('.*' + search[i] + '.*'),
      });
      if (result4) {
        searchResult.push(...result4);
      }
      const result5 = await mailModel.find({
        recipient: new RegExp('.*' + search[i] + '.*'),
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
