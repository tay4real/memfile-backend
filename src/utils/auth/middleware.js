const UserModel = require('../../services/users/users.schema');
const { verifyJWT } = require('./tools');

// === 🔁 Reusable Helper ===
const unauthorized = (res, message = 'Unauthorized access') =>
  res.status(401).json({ message });

// === ✅ JWT Authentication Middleware ===
const authorize = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'Authorization header missing or malformed');
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = await verifyJWT(token);
    if (!payload || !payload._id) return unauthorized(res);

    const user = await UserModel.findById(payload._id);
    if (!user) return unauthorized(res);

    req.user = user;
    req.role = user.role;
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return unauthorized(res);
  }
};

// === 🔐 General Role Checker Factory ===
const hasRole = (roleName) => (req, res, next) => {
  if (req.role === roleName) return next();
  return res
    .status(403)
    .json({ message: 'Forbidden: Insufficient privileges' });
};

// === 🚦 Specific Role Middlewares ===
const isAdmin = hasRole('Admin');
const isChairman = hasRole('Chairman');
const isPermanentSecretary = hasRole('Permanent Secretary');
const isDirector = hasRole('Director');
const isRegistryOfficer = hasRole('Registry Officer');

module.exports = {
  authorize,
  isAdmin,
  isChairman,
  isPermanentSecretary,
  isDirector,
  isRegistryOfficer,
};
