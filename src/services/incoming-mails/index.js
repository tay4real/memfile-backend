/**
 * @swagger
 * tags:
 *   name: Incoming Mails
 *   description: Operations related to receiving and managing incoming mails
 */
const mailRouter = require('express').Router();

const multer = require('multer');
const { writeFile } = require('fs-extra');
const { join } = require('path');

const PDFDocument = require('pdfkit');

const {
  cloudinaryIncomingMail,
  cloudinaryDestroy,
} = require('../../utils/cloudinary');

const q2m = require('query-to-mongo');

const { authorize, isAdmin } = require('../../utils/auth/middleware');

const mailModel = require('./mail.schema');
const { Console } = require('console');

/**
 * @swagger
 * /incoming-mails/:
 *   get:
 *     summary: Get all incoming mails
 *     tags: [Incoming Mails]
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *         description: Optional filters using query-to-mongo syntax
 *     responses:
 *       200:
 *         description: List of incoming mails
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
    next(new Error(error.message));
  }
});

/**
 * @swagger
 * /incoming-mails/{id}:
 *   get:
 *     summary: Get an incoming mail by ID
 *     tags: [Incoming Mails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Mail ID
 *     responses:
 *       200:
 *         description: Incoming mail details
 *       404:
 *         description: Mail not found
 *       500:
 *         description: Server error
 */

mailRouter.get('/:id', authorize, async (req, res, next) => {
  try {
    const mail = await mailModel.findById(req.params.id);
    res.send(mail);
  } catch (error) {
    next(res.status(500).send(error.message));
  }
});

/**
 * @swagger
 * /incoming-mails/:
 *   post:
 *     summary: Create a new incoming mail
 *     tags: [Incoming Mails]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ref_no:
 *                 type: string
 *               subject:
 *                 type: string
 *               sender:
 *                 type: string
 *               recipient:
 *                 type: string
 *               dispatcher:
 *                 type: string
 *               date_received:
 *                 type: string
 *                 format: date-time
 *               upload_url:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
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
 * /incoming-mails/{id}/upload:
 *   post:
 *     summary: Upload attachments for a specific incoming mail
 *     tags: [Incoming Mails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the mail to upload files to
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               mail:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *       500:
 *         description: Server error
 */

mailRouter.post(
  '/:id/upload',
  authorize,
  cloudinaryIncomingMail.array('mail'),
  async (req, res, next) => {
    try {
      const upload = await req.files.map(async (file) => {
        console.log(file);
        await mailModel.findByIdAndUpdate(req.params.id, {
          $push: {
            upload_url: file.path,
          },
        });
      });

      if (upload) {
        res.send('Uploaded Successfully');
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /incoming-mails/{id}:
 *   put:
 *     summary: Update an existing incoming mail
 *     tags: [Incoming Mails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Mail ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Mail fields to update
 *     responses:
 *       200:
 *         description: Incoming mail updated successfully
 *       404:
 *         description: Incoming mail not found
 *       500:
 *         description: Server error
 */

mailRouter.put('/:id', authorize, async (req, res) => {
  try {
    const mail = await mailModel.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    });
    if (mail) {
      res.send('Incoming mail updated successfully');
    } else {
      res.status(404).send('Incoming mail not found');
    }
  } catch (error) {
    next(new Error(error.message));
  }
});

/**
 * @swagger
 * /incoming-mails/{id}/pdf:
 *   get:
 *     summary: Generate a PDF version of the mail
 *     tags: [Incoming Mails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the mail
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Mail not found
 *       500:
 *         description: Server error
 */

mailRouter.get('/:id/pdf', async (req, res, next) => {
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
      'Content-Type': 'application/pdf',
    });
    res.status(201).send('OK');
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /incoming-mails/changestatus/{id}:
 *   put:
 *     summary: Mark an incoming mail as filed
 *     tags: [Incoming Mails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Mail ID
 *     responses:
 *       200:
 *         description: Status updated successfully
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
 * /incoming-mails/{id}:
 *   delete:
 *     summary: Delete a specific incoming mail
 *     tags: [Incoming Mails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Mail ID
 *     responses:
 *       200:
 *         description: Deleted successfully
 *       404:
 *         description: Mail not found
 *       500:
 *         description: Server error
 */

mailRouter.delete('/:id', authorize, isAdmin, async (req, res, next) => {
  try {
    const mail = await mailModel.findByIdAndDelete(req.params.id);
    if (mail) {
      res.send('Deleted successfully');
    } else {
      res.status(404).send('Mail Not found');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

/**
 * @swagger
 * /incoming-mails/:
 *   delete:
 *     summary: Delete all incoming mails
 *     tags: [Incoming Mails]
 *     responses:
 *       200:
 *         description: All mails deleted successfully
 *       500:
 *         description: Server error
 */

mailRouter.delete('/', authorize, isAdmin, async (req, res, next) => {
  try {
    const data = await mailModel.deleteMany({});
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
          'Some error occurred while removing all incoming mails.',
      })
    );
  }
});

/**
 * @swagger
 * /incoming-mails/report/stats:
 *   get:
 *     summary: Get monthly statistics of incoming mails
 *     tags: [Incoming Mails]
 *     responses:
 *       200:
 *         description: Monthly stats retrieved
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
 * /incoming-mails/report/counts:
 *   get:
 *     summary: Get total number of incoming mails
 *     tags: [Incoming Mails]
 *     responses:
 *       200:
 *         description: Total count returned
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
 * /incoming-mails/search/results:
 *   post:
 *     summary: Search incoming mails by ref_no, subject, sender or recipient
 *     tags: [Incoming Mails]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               criteria:
 *                 type: string
 *                 description: Search keyword
 *     responses:
 *       200:
 *         description: Search results returned
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
        sender: new RegExp('.*' + search[i] + '.*'),
      });
      if (result3) {
        searchResult.push(...result3);
      }
      const result4 = await mailModel.find({
        recipient: new RegExp('.*' + search[i] + '.*'),
      });
      if (result4) {
        searchResult.push(...result4);
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
