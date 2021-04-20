const httpErrorHandler = (err, req, res, next) => {
  console.log(err);
  if (!res.headersSent) {
    res.status(err.httpStatusCode || 500).send({ message: err.message });
  }
};

module.exports = {
  httpErrorHandler,
};
