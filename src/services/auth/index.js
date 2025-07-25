/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

const usersRouter = require('express').Router();
const UserModel = require('../users/users.schema');

const {
  authenticate,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../../utils/auth/tools');

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh an access token using a refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: your_refresh_token_here
 *     responses:
 *       200:
 *         description: New access and refresh token pair
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: No token provided
 *       403:
 *         description: Invalid or expired token
 */

usersRouter.post('/refresh-token', async (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const payload = verifyRefreshToken(token);
    const user = await UserModel.findById(payload._id);

    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    // Generate new tokens
    const accessToken = generateAccessToken({ _id: user._id });
    const refreshToken = generateRefreshToken({ _id: user._id });

    // Update refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ accessToken, refreshToken });
  } catch (err) {
    res
      .status(403)
      .json({ message: 'Token expired or invalid', error: err.message });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: yourPassword123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     surname:
 *                       type: string
 *                     firstname:
 *                       type: string
 *                     status:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 */

usersRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findByCredentials(email, password);
    if (!user) {
      console.log('User not found or invalid credentials');
      return res.status(401).send('Username or Password Incorrect');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await authenticate(user);

    // Store the refreshToken in the DB (optional but safer)
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        surname: user.surname,
        firstname: user.firstname,
        status: user.status,
        generalfiles: user.generalfiles,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    next(res.status(401).send('Username or Password Incorrect'));
  }
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - surname
 *               - firstname
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               surname:
 *                 type: string
 *               firstname:
 *                 type: string
 *               role:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: User registered successfully
 *       400:
 *         description: Email already exists or validation error
 */
usersRouter.post(
  '/register',

  async (req, res, next) => {
    try {
      const newUser = await new UserModel(req.body).save();

      res.send('User registerd sucessfully');
    } catch (error) {
      if (error.code === 11000) next(new Error('Email is already in use'));
      next(error);
    }
  }
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out a user and invalidate the refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 64aabc12345de67f89ab1234
 *     responses:
 *       200:
 *         description: Logged out successfully
 */

usersRouter.post('/logout', async (req, res) => {
  const { userId } = req.body;
  const user = await UserModel.findById(userId);
  if (user) {
    user.refreshToken = null;
    await user.save();
  }
  res.json({ message: 'Logged out successfully' });
});

module.exports = usersRouter;
