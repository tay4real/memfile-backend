/**
 * @swagger
 * tags:
 *    name: Users
 *    description: API endpoints for managing user accounts, avatars, status, and reports
 *
 */
const usersRouter = require('express').Router();
const q2m = require('query-to-mongo');
const { authorize, isAdmin } = require('../../utils/auth/middleware');
const { defaultAvatar } = require('../../utils/defaultAvatar');
const {
  cloudinaryAvatar,
  cloudinaryDestroy,
} = require('../../utils/cloudinary');
const UserModel = require('../users/users.schema');

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *
 *   put:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Updated user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */

usersRouter
  .route('/me')
  .get(authorize, async (req, res, next) => {
    try {
      res.send(req.user.toJSON());
    } catch (error) {
      next();
    }
  })
  .put(authorize, async (req, res, next) => {
    try {
      const updates = Object.keys(req.body);
      updates.forEach((update) => (req.user[update] = req.body[update]));
      await req.user.save();
      res.send(req.user);
    } catch (error) {
      next(error);
    }
  });

/**
 * @swagger
 * /users/me/avatar:
 *   put:
 *     summary: Upload and update user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *
 *   delete:
 *     summary: Delete user avatar and restore default avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar deleted and replaced with default
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */

usersRouter
  .route('/me/avatar')
  .put(authorize, cloudinaryAvatar.single('avatar'), async (req, res, next) => {
    try {
      const data = parse(req.user.avatar);
      if (data.name) await cloudinaryDestroy(data);
      req.user.avatar = req.file.path;
      await req.user.save();
      res.status(201).send(req.user);
    } catch (error) {
      next(error);
    }
  })
  .delete(authorize, async (req, res, next) => {
    try {
      const data = parse(req.user.avatar);
      if (data.name) await cloudinaryDestroy(data);
      req.user.avatar = defaultAvatar(req.user.firstName, req.user.lastName);
      delete req.user.avatar.public_id;
      await req.user.save();
      res.send(req.user);
    } catch (error) {
      next(error);
    }
  });

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve list of all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Optional name filter
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */

usersRouter.get('/', authorize, async (req, res, next) => {
  try {
    const query = q2m(req.query);

    const users = await UserModel.find(query.criteria, query.options.fields)
      .find(query.criteria)
      .sort(query.options.sort)
      .skip(query.options.skip)
      .limit(query.options.limit)
      .populate('generalfiles');

    res.send(users);
  } catch (error) {
    next(new Error(error.message));
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a specific user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *
 *   put:
 *     summary: Update user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *
 *   delete:
 *     summary: Delete user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */

usersRouter.get('/:id', authorize, async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id).populate(
      'generalfiles'
    );
    console.log(req.params.id);
    if (user) {
      if (user.status === 0) {
        console.log('From Here', user);
        res.send(user);
      } else {
        next(new APIError('User account has been removed', 404));
      }
    } else {
      next(new APIError('User not found', 404));
    }
  } catch (error) {
    console.log(error);
    next(new Error(error.message));
  }
});

usersRouter.put('/:id', authorize, async (req, res, next) => {
  try {
    const modifiedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        runValidators: true,
        new: true,
      }
    );
    if (modifiedUser) {
      res.send(modifiedUser);
      console.log(modifiedUser);
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
 * /users/deactivate/{id}:
 *   put:
 *     summary: Deactivate a user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deactivated successfully
 */

usersRouter.put(
  '/deactivate/:id',
  authorize,
  isAdmin,
  async (req, res, next) => {
    try {
      const status = await UserModel.deactivate(req.params.id);
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
 * /users/activate/{id}:
 *   put:
 *     summary: Activate a previously deactivated user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User activated successfully
 */

usersRouter.put('/activate/:id', authorize, isAdmin, async (req, res, next) => {
  try {
    const status = await UserModel.activate(req.params.id);
    if (status) {
      res.send(status);
    }
  } catch (error) {
    next(new Error(error.message));
  }
});

usersRouter.delete('/:id', authorize, isAdmin, async (req, res, next) => {
  try {
    const user = await UserModel.findByIdAndDelete(req.params.id);
    if (user) {
      res.send('User account deleted successfully');
    } else {
      next();
    }
  } catch (error) {
    next(new Error(error.message));
  }
});

/**
 * @swagger
 * /users/report/stats:
 *   get:
 *     summary: Get monthly user registration stats
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly registration stats
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: integer
 *                     description: Month (1–12)
 *                   total:
 *                     type: integer
 *                     description: Total users registered that month
 */

usersRouter.get('/report/stats', authorize, async (req, res) => {
  try {
    const data = await UserModel.aggregate([
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
 * /users/report/counts:
 *   get:
 *     summary: Get total number of users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total user count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 */

usersRouter.get('/report/counts', authorize, async (req, res) => {
  try {
    const total = await UserModel.countDocuments();
    res.status(200).json({ total });
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = usersRouter;
