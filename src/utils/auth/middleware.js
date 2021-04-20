const UserModel = require("../../services/users/users.schema");
const { verifyJWT } = require("./tools");
const { APIError } = require("../errorHandler");

const authorize = async (req, res, next) => {
  if (req.headers.authorization) {
    const [method, jwt] = req.headers.authorization.split(" ");

    if (method === "Bearer" && jwt) {
      try {
        const { _id } = await verifyJWT(jwt);

        const user = await UserModel.findById(_id);
        console.log(user);
        if (user) {
          req.user = user;
          req.role = user.role;
          next();
        } else {
          res.status(401).send("You are not authorized to view this page");
        }
      } catch (error) {
        res.status(401).send("You are not authorized to view this page");
      }
    } else {
      res.status(401).send("You are not authorized to view this page");
    }
  } else {
    res.status(401).send("You are not authorized to view this page");
  }
};

const checkSuperUser = async (req, res, next) => {
  if (req.role && req.role === "SuperAdmin") next();
  else {
    next(res.status(403).send("Access denied. Only for Super Admins!"));
  }
};

const checkAdmin = async (req, res, next) => {
  if (req.role && req.role === "Admin") next();
  else {
    const err = new Error("Access denied. Only for Admins!");
    err.httpStatusCode = 403;
    next(err);
  }
};

const checkOfficer = async (req, res, next) => {
  if (req.role && req.role === "Officer") next();
  else {
    const err = new Error("Access denied. Only for Officers!");
    err.httpStatusCode = 403;
    next(err);
  }
};

const checkImplementationOfficer = async (req, res, next) => {
  if (req.role && req.role === "ImplementationOfficer") next();
  else {
    const err = new Error("Access denied. Only for Implementaion Officers!");
    err.httpStatusCode = 403;
    next(err);
  }
};

module.exports = {
  authorize,
  checkSuperUser,
  checkAdmin,
  checkOfficer,
  checkImplementationOfficer,
};
