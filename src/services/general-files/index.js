/**
 * @swagger
 * tags:
 *   name: General Files
 *   description: Operations related to general file management
 */

const fileRouter = require('express').Router();
const { authorize, isAdmin } = require('../../utils/auth/middleware');
const q2m = require('query-to-mongo');
const filesModel = require('./general-files.schema');
const { search } = require('../users');

/**
 * @swagger
 * /general-files/:
 *   get:
 *     summary: Get all general files
 *     tags: [General Files]
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *         description: Optional filters using query-to-mongo syntax
 *     responses:
 *       200:
 *         description: List of general files
 *       500:
 *         description: Server error
 */

fileRouter.get('/', authorize, async (req, res, next) => {
  try {
    const query = q2m(req.query);
    const total = await filesModel.countDocuments(query.criteria);
    const allfiles = await filesModel
      .find(query.criteria)
      .sort(query.options.sort)
      .skip(query.options.skip)
      .limit(query.options.limit)
      .populate('incomingmails')
      .populate('outgoingmails');

    res.send(allfiles);
  } catch (error) {
    next(new Error(error.message));
  }
});

/**
 * @swagger
 * /general-files/{id}:
 *   get:
 *     summary: Get a file by ID
 *     tags: [General Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File details with populated mails
 *       500:
 *         description: Server error
 */

fileRouter.get('/:id', authorize, async (req, res, next) => {
  try {
    const file = await filesModel.findFileWithMails(req.params.id);
    res.send(file);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /general-files/newfile:
 *   post:
 *     summary: Create a new file
 *     tags: [General Files]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mdaShortName:
 *                 type: string
 *               file_title:
 *                 type: string
 *               file_no:
 *                 type: string
 *               [other_fields]:
 *                 type: string
 *     responses:
 *       201:
 *         description: File created successfully
 *       400:
 *         description: File title already exists
 *       500:
 *         description: Server error
 */

fileRouter.post('/newfile', authorize, async (req, res, next) => {
  try {
    // check if File title already exist for a particular MDA entry
    const file = filesModel.find({
      mdaShortName: req.body.mdaShortName,
      file_title: req.body.file_title,
    });

    if ((await file).length === 0) {
      const newFile = new filesModel(req.body);
      const { _id } = await newFile.save();
      if (_id) {
        res.status(201).send('File created successfully');
      }
    } else {
      res.status(400).send('File Title already exist');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

/**
 * @swagger
 * /general-files/{id}:
 *   put:
 *     summary: Update file metadata
 *     tags: [General Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Fields to update
 *     responses:
 *       200:
 *         description: File updated successfully
 *       400:
 *         description: File not found
 *       500:
 *         description: Server error
 */

fileRouter.put('/:id', authorize, async (req, res, next) => {
  try {
    console.log(req.body);
    const file = await filesModel.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    });
    if (file) {
      res.send('File updated sucessfully');
    } else {
      res.status(400).send('File not found');
    }
  } catch (error) {
    next(new Error(error.message));
  }
});

/**
 * @swagger
 * /general-files/{id}/fileup-incoming/{mailid}:
 *   put:
 *     summary: Attach incoming mail to a file
 *     tags: [General Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *       - in: path
 *         name: mailid
 *         required: true
 *         schema:
 *           type: string
 *         description: Incoming mail ID
 *     responses:
 *       200:
 *         description: Document added to file successfully
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */

fileRouter.put(
  '/:id/fileup-incoming/:mailid',
  authorize,
  async (req, res, next) => {
    try {
      const file = await filesModel.fileupIncomingMail(
        req.params.id,
        req.params.mailid
      );
      if (file) {
        res.send('Document added to file successfully');
      } else {
        next(new Error('File not found'));
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

/**
 * @swagger
 * /general-files/{id}/fileup-outgoing/{mailid}:
 *   put:
 *     summary: Attach outgoing mail to a file
 *     tags: [General Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *       - in: path
 *         name: mailid
 *         required: true
 *         schema:
 *           type: string
 *         description: Outgoing mail ID
 *     responses:
 *       200:
 *         description: Document added to file successfully
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */

fileRouter.put(
  '/:id/fileup-outgoing/:mailid',
  authorize,

  async (req, res, next) => {
    try {
      const file = await filesModel.fileupOutgoingMail(
        req.params.id,
        req.params.mailid
      );
      if (file) {
        res.send('Document added to file successfully');
      } else {
        next(new Error('File not found'));
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

/**
 * @swagger
 * /general-files/{id}/remove/{mailid}:
 *   delete:
 *     summary: Remove a document from a file
 *     tags: [General Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *       - in: path
 *         name: mailid
 *         required: true
 *         schema:
 *           type: string
 *         description: Mail/document ID
 *     responses:
 *       200:
 *         description: Document removed from file successfully
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */

fileRouter.delete(
  '/:id/remove/:mailid',
  authorize,

  async (req, res, next) => {
    try {
      const file = await filesModel.removeDocument(
        req.params.id,
        req.params.mailid
      );
      if (file) {
        res.send('Document removed from file successfully');
      } else {
        next(new Error('File not found'));
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

/**
 * @swagger
 * /general-files/trash/{id}:
 *   put:
 *     summary: Move file to trash
 *     tags: [General Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File moved to trash
 *       500:
 *         description: Server error
 */

fileRouter.put(
  '/trash/:id',
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

/**
 * @swagger
 * /general-files/restore/{id}:
 *   put:
 *     summary: Restore a file from trash
 *     tags: [General Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File restored
 *       500:
 *         description: Server error
 */

fileRouter.put(
  '/restore/:id',
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

/**
 * @swagger
 * /general-files/delete/{id}:
 *   delete:
 *     summary: Permanently delete a file (admin only)
 *     tags: [General Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */

fileRouter.delete('/delete/:id', authorize, isAdmin, async (req, res, next) => {
  try {
    const file = await filesModel.deleteFile(req.params.id);
    if (file) {
      res.send('File record deleted successfully');
    } else {
      next(new Error('File not found'));
    }
  } catch (error) {
    next(new Error(error.message));
  }
});

/**
 * @swagger
 * /general-files/report/counts:
 *   get:
 *     summary: Get total number of files
 *     tags: [General Files]
 *     responses:
 *       200:
 *         description: Total file count
 *       500:
 *         description: Server error
 */

fileRouter.get('/report/counts', authorize, async (req, res) => {
  try {
    const total = await filesModel.countDocuments();
    res.status(200).json({ total });
  } catch (error) {
    res.status(500).json(error);
  }
});

/**
 * @swagger
 * /general-files/search/results:
 *   post:
 *     summary: Search for files by title or number
 *     tags: [General Files]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               criteria:
 *                 type: string
 *                 example: "Procurement"
 *     responses:
 *       200:
 *         description: Matching search results
 *       500:
 *         description: Server error
 */

fileRouter.post('/search/results', authorize, async (req, res) => {
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
      const result = await filesModel.find({
        file_title: new RegExp('.*' + search[i] + '.*'),
      });
      if (result) {
        searchResult.push(...result);
      }
      const result2 = await filesModel.find({
        file_no: new RegExp('.*' + search[i] + '.*'),
      });
      if (result2) {
        searchResult.push(...result2);
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
    m;
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = fileRouter;
