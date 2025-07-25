const mdaRouter = require('express').Router();
const { authorize, isAdmin } = require('../../utils/auth/middleware');
const q2m = require('query-to-mongo');
const MDAModel = require('../mdas/mda.schema');

/**
 * @swagger
 * tags:
 *   name: Departments
 *   description: API endpoints for managing departments within an MDA
 */

/**
 * @swagger
 * /mdas/{id}/departments:
 *   post:
 *     summary: Add a new department to an MDA
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MDA ID
 *     requestBody:
 *       description: Department data to add
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Department added successfully
 *       400:
 *         description: Bad request
 */

mdaRouter.post('/:id/departments/', async (req, res, next) => {
  try {
    const department = { ...req.body };
    const updated = await MDAModel.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          departments: department,
        },
      },
      { runValidators: true, new: true }
    );
    res.status(201).send(updated);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /mdas/{id}/departments:
 *   get:
 *     summary: Get all departments under a specific MDA
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MDA ID
 *     responses:
 *       200:
 *         description: List of departments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *       404:
 *         description: MDA not found
 */

mdaRouter.get('/:id/departments', async (req, res, next) => {
  try {
    const { departments } = await MDAModel.findById(req.params.id, {
      departments: 1,
      _id: 0,
    });
    res.send(departments);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

/**
 * @swagger
 * /mdas/{id}/departments/{departmentId}:
 *   put:
 *     summary: Update a department under an MDA
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MDA ID
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *     requestBody:
 *       description: Department update data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Department updated successfully
 *       404:
 *         description: Department not found
 */

mdaRouter.put(
  '/:id/departments/:departmentId',

  async (req, res, next) => {
    try {
      const { departments } = await MDAModel.findOne(
        {
          _id: mongoose.Types.ObjectId(req.params.id),
        },
        {
          _id: 0,
          departments: {
            $elemMatch: {
              _id: mongoose.Types.ObjectId(req.params.departmentId),
            },
          },
        }
      );

      if (departments && departments.length > 0) {
        const departmentToReplace = {
          ...departments[0].toObject(),
          ...req.body,
        };

        const modifiedDepartments = await MDAModel.findOneAndUpdate(
          {
            _id: mongoose.Types.ObjectId(req.params.id),
            'departments._id': mongoose.Types.ObjectId(req.params.departmentId),
          },
          { $set: { 'departments.$': departmentToReplace } },
          {
            runValidators: true,
            new: true,
          }
        );
        res.send(modifiedDepartments);
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
 * /mdas/{id}/departments/{departmentId}:
 *   delete:
 *     summary: Delete a department from an MDA
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MDA ID
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department deleted successfully
 *       404:
 *         description: Department not found
 */

mdaRouter.delete('/:id/departments/:departmentId', async (req, res, next) => {
  try {
    const modifiedDepartments = await personnelModel.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          departments: {
            _id: mongoose.Types.ObjectId(req.params.departmentId),
          },
        },
      },
      {
        new: true,
      }
    );
    if (modifiedDepartments) {
      res.send('Deleted Successfully');
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

module.exports = mdaRouter;
