const UserModel = require("../../services/users/users.schema");
const { verifyJWT } = require("../jwt");
const { APIError } = require("..");

const authorize = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    const decoded = await verifyJWT(token);
    console.log(decoded);
    const user = await UserModel.findById(decoded._id);

    if (!user) throw new Error();
    req.token = token;
    req.user = user;
    next();
  } catch (e) {
    next(new APIError("Please authenticate", 401));
  }
};

const checkSuperUser = async (req, res, next) => {
  if (req.role && req.role === "SuperAdmin") next();
  else {
    next(new APIError("Access denied. Only for Super Admin!", 403));
  }
};

const checkAdmin = async (req, res, next) => {
  if (req.role && req.role === "Admin") next();
  else {
    next(new APIError("Access denied. Only for Admin!", 403));
  }
};

const checkOfficer = async (req, res, next) => {
  if (req.role && req.role === "Officer") next();
  else {
    next(new APIError("Access denied. Only for Officer", 403));
  }
};

const checkImplementationOfficer = async (req, res, next) => {
  if (req.role && req.role === "ImplementationOfficer") next();
  else {
    next(new APIError("Access denied. Only for Implementation Officer!", 403));
  }
};

module.exports = {
  authorize,
  checkSuperUser,
  checkAdmin,
  checkOfficer,
  checkImplementationOfficer,
};
