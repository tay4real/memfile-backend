class APIError extends Error {
  constructor(message, statusCode = 500, operational = true) {
    super(message);
    this.httpStatusCode = statusCode;
    this.message = message;
    this.isOperational = operational;
  }
}
const accessTokenOptions = {
  httpOnly: true,
  path: "/",
  overwrite: true,
  sameSite: "None",
};

const refreshTokenOptions = {
  httpOnly: true,
  path: "/",
  overwrite: true,
  sameSite: "None",
};

const httpErrorHandler = (err, req, res, next) => {
  console.log(err);
  if (!res.headersSent) {
    res.status(err.httpStatusCode || 500).send({ message: err.message });
  }
};

module.exports = {
  APIError,
  accessTokenOptions,
  refreshTokenOptions,
  httpErrorHandler,
};
