const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ademuyiwaolutayo@gmail.com",
    pass: "0lumay0wa",
  },
});

module.exports = transporter;
