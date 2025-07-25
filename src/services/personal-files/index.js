/**
 * @swagger
 * tags:
 *   name: Personal Files
 *   description: Operations related to personal file management
 */
const fileRouter = require('express').Router();
const {
  authorize,
  isPermanentSecretary,
  isAdmin,
  isRegistryOfficer,
} = require('../../utils/auth/middleware');
const q2m = require('query-to-mongo');
const filesModel = require('./personal-files.schema');

/**
 * @swagger
 * /personal-files:
 *   get:
 *     summary: Get all personal files
 *     tags: [Personal Files]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of personal files
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
      .populate('personnels');

    res.send(allfiles);
  } catch (error) {
    next(new Error(error.message));
  }
});

/**
 * @swagger
 * /personal-files/{id}:
 *   get:
 *     summary: Get a specific personal file by ID
 *     tags: [Personal Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: File ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File data
 *       404:
 *         description: File not found
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
 * /personal-files/newfile:
 *   post:
 *     summary: Create a new personal file
 *     tags: [Personal Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Personal file object
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PersonalFile'
 *     responses:
 *       201:
 *         description: File created successfully
 *       400:
 *         description: File title already exists
 *       500:
 *         description: Server error
 */

fileRouter.post(
  '/newfile',
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
        next(new Error('File Title already exist'));
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

/**
 * @swagger
 * /personal-files/{id}:
 *   put:
 *     summary: Update a personal file
 *     tags: [Personal Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: File ID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Updated file data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PersonalFile'
 *     responses:
 *       200:
 *         description: File updated successfully
 *       404:
 *         description: File not found
 */

fileRouter.put(
  '/:id',
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
        next(new Error('File not found'));
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

/**
 * @swagger
 * /personal-files/{id}/fileup/{mailid}:
 *   put:
 *     summary: Attach a mail to a file
 *     tags: [Personal Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: mailid
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mail attached to file
 *       404:
 *         description: File not found
 */

fileRouter.put(
  '/:id/fileup/:mailid',
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
        next(new Error('File not found'));
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

/**
 * @swagger
 * /personal-files/{id}/remove/{mailid}:
 *   delete:
 *     summary: Remove a mail from a file
 *     tags: [Personal Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: mailid
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mail removed from file
 *       404:
 *         description: File not found
 */

fileRouter.delete(
  '/:id/remove/:mailid',
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
        next(new Error('File not found'));
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

/**
 * @swagger
 * /personal-files/trash/{id}:
 *   put:
 *     summary: Move a file to trash
 *     tags: [Personal Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File moved to trash
 *       404:
 *         description: File not found
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
 * /personal-files/restore/{id}:
 *   put:
 *     summary: Restore a trashed file
 *     tags: [Personal Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File restored
 *       404:
 *         description: File not found
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
 * /personal-files/delete/{id}:
 *   delete:
 *     summary: Permanently delete a file
 *     tags: [Personal Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted
 *       404:
 *         description: File not found
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

module.exports = fileRouter;
