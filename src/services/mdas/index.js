/**
 * @swagger
 * tags:
 *   name: MDAs
 *  description: Operations related to Ministries, Departments, and Agencies (MDAs)
 */
const mdaRouter = require('express').Router();
const { authorize, isAdmin } = require('../../utils/auth/middleware');
const q2m = require('query-to-mongo');
const MDAModel = require('./mda.schema');
const mongoose = require('mongoose');

/**
 * @swagger
 * /mdas:
 *   get:
 *     tags:
 *       - MDAs
 *     summary: Get all MDAs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by MDA name
 *     responses:
 *       200:
 *         description: List of MDAs
 */

mdaRouter.get('/', authorize, async (req, res, next) => {
  try {
    const query = q2m(req.query);
    const total = await MDAModel.countDocuments(query.criteria);
    const mdas = await MDAModel.find(query.criteria)
      .sort(query.options.sort)
      .skip(query.options.skip)
      .limit(query.options.limit);

    res.send(mdas);
  } catch (error) {
    next(new Error(error.message));
  }
});

/**
 * @swagger
 * /mdas/{id}:
 *   get:
 *     tags:
 *       - MDAs
 *     summary: Get a single MDA by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MDA ID
 *     responses:
 *       200:
 *         description: Single MDA details
 */

mdaRouter.get('/:id', authorize, async (req, res, next) => {
  try {
    const mda = await MDAModel.findById(req.params.id);
    res.send(mda);
  } catch (error) {
    next(new Error(error.message));
  }
});

/**
 * @swagger
 * /mdas:
 *   post:
 *     tags:
 *       - MDAs
 *     summary: Create a new MDA
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               shortName:
 *                 type: string
 *     responses:
 *       201:
 *         description: MDA added successfully
 */

mdaRouter.post('/', authorize, isAdmin, async (req, res, next) => {
  try {
    console.log(req.body);

    const name = await MDAModel.findOne({ name: req.body.name });
    const shortName = await MDAModel.findOne({ shortName: req.body.shortName });
    if (name || shortName) {
      res.status(400).send('MDA record already exist');
    } else {
      const mda = await new MDAModel(req.body).save();
      console.log(mda);
      const id = mda._id;
      console.log(id);
      if (id) {
        res.status(201).send('MDA added successfully');
      }
    }
  } catch (error) {
    next(new Error(error.message));
  }
});

/**
 * @swagger
 * /mdas/{id}:
 *   put:
 *     tags:
 *       - MDAs
 *     summary: Update an MDA
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: MDA ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: MDA updated successfully
 */

mdaRouter.put('/:id', authorize, isAdmin, async (req, res, next) => {
  try {
    const mda = await MDAModel.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    });
    if (mda) {
      res.status(201).send('MDA updated successfully');
    } else {
      next(new Error('MDA not found'));
    }
  } catch (error) {
    next(new Error(error.message));
  }
});

/**
 * @swagger
 * /mdas/{id}:
 *   delete:
 *     tags:
 *       - MDAs
 *     summary: Delete a specific MDA
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: MDA ID
 *     responses:
 *       200:
 *         description: MDA record deleted successfully
 */

mdaRouter.delete('/:id', authorize, isAdmin, async (req, res, next) => {
  try {
    const mda = await MDAModel.findByIdAndDelete(req.params.id);
    if (mda) {
      res.send('MDA record deleted successfully');
    } else {
      next(new Error('MDA not found'));
    }
  } catch (error) {
    next(new Error(error.message));
  }
});

/**
 * @swagger
 * /mdas:
 *   delete:
 *     tags:
 *       - MDAs
 *     summary: Delete all MDAs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All MDAs deleted successfully
 */

mdaRouter.delete('/', authorize, isAdmin, async (req, res, next) => {
  try {
    const data = await MDAModel.deleteMany({});
    if (data) {
      res.send({
        message: `${data.deletedCount} mdas were deleted successfully!`,
      });
    } else {
      next();
    }
  } catch (error) {
    next(
      new Error({
        message:
          err.message || 'Some error occurred while removing all departments.',
      })
    );
  }
});

/**
 * @swagger
 * /mdas/{id}/departments:
 *   post:
 *     tags:
 *       - Departments
 *     summary: Add a new department to an MDA
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: MDA ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deptName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Department added successfully
 */

mdaRouter.post(
  '/:id/departments/',
  authorize,
  isAdmin,
  async (req, res, next) => {
    try {
      const department = { ...req.body };

      const { departments } = await MDAModel.findOne(
        {
          _id: mongoose.Types.ObjectId(req.params.id),
        },
        {
          _id: 0,
          departments: {
            $elemMatch: {
              deptName: department.deptName,
            },
          },
        }
      );

      if (departments.length === 0) {
        const updated = await MDAModel.findByIdAndUpdate(
          req.params.id,
          {
            $push: {
              departments: department,
            },
          },
          { runValidators: true, new: true }
        );
        res.status(201).send('Department added successfully');
      } else {
        res.status(400).send('Department already exist');
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /mdas/{id}/departments:
 *   get:
 *     tags:
 *       - Departments
 *     summary: Get all departments in a specific MDA
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: MDA ID
 *     responses:
 *       200:
 *         description: List of departments
 */

mdaRouter.get('/:id/departments/', authorize, async (req, res, next) => {
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
 *   get:
 *     tags:
 *       - Departments
 *     summary: Get a department by ID from an MDA
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: MDA ID
 *       - in: path
 *         name: departmentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department details
 */

mdaRouter.get(
  '/:id/departments/:departmentId',
  authorize,
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
      res.send(departments);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /mdas/{id}/departments/{departmentId}:
 *   put:
 *     tags:
 *       - Departments
 *     summary: Update a department in an MDA
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: MDA ID
 *       - in: path
 *         name: departmentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Department ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Department updated successfully
 */

mdaRouter.put(
  '/:id/departments/:departmentId',
  authorize,
  isAdmin,

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
        if (modifiedDepartments) {
          res.send('Updated successfully');
        }
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
 *     tags:
 *       - Departments
 *     summary: Delete a department from an MDA
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: MDA ID
 *       - in: path
 *         name: departmentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department deleted successfully
 */

mdaRouter.delete(
  '/:id/departments/:departmentId',
  authorize,
  isAdmin,
  async (req, res, next) => {
    try {
      const modifiedDepartments = await MDAModel.findByIdAndUpdate(
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
  }
);

module.exports = mdaRouter;
