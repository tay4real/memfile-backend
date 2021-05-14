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

const isAdmin = async (req, res, next) => {
  if (req.role && req.role === "Admin") next();
  else {
    next(res.status(403).send("Unauthorized access"));
  }
};
const isChairman = async (req, res, next) => {
  if (req.role && req.role === "Chairman") next();
  else {
    next(res.status(403).send("Unauthorized access"));
  }
};

const isPermanentSecretary = async (req, res, next) => {
  if (req.role && req.role === "Permanent Secretary") next();
  else {
    next(res.status(403).send("Unauthorized access"));
  }
};

const isDirector = async (req, res, next) => {
  if (req.role && req.role === "Director") next();
  else {
    next(res.status(403).send("Unauthorized access"));
  }
};

const isRegistryOfficer = async (req, res, next) => {
  if (req.role && req.role === "Registry Officer") next();
  else {
    next(res.status(403).send("Unauthorized access"));
  }
};

module.exports = {
  authorize,
  isAdmin,
  isChairman,
  isPermanentSecretary,
  isDirector,
  isRegistryOfficer,
};
