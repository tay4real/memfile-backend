const usersRouter = require('express').Router();
const UserModel = require('../users/users.schema');

const {
  authenticate,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../../utils/auth/tools');

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
