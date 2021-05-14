const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "memfile/avatars",
  },
  limits: { fileSize: 200000 },
});

const incomingMailStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "memfile/incoming-mails",
  },
  limits: { fileSize: 5000000 },
});

const outgoingMailStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "memfile/outgoing-mails",
  },
  limits: { fileSize: 5000000 },
});

const leaveStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "memfile/leaves",
  },
  limits: { fileSize: 5000000 },
});

const qualificationsStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "memfile/qualifications",
  },
  limits: { fileSize: 5000000 },
});

const staffQueryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "memfile/staffqueries",
  },
  limits: { fileSize: 5000000 },
});

const promotionStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "memfile/staffpromotions",
  },
  limits: { fileSize: 5000000 },
});

const cloudinaryAvatar = multer({ storage: avatarStorage });
const cloudinaryIncomingMail = multer({ storage: incomingMailStorage });
const cloudinaryOutgoingMail = multer({ storage: outgoingMailStorage });
const cloudinaryLeaves = multer({ storage: leaveStorage });
const cloudinaryQualifications = multer({ storage: qualificationsStorage });
const cloudinaryQueries = multer({ storage: staffQueryStorage });
const cloudinaryPromotions = multer({ storage: promotionStorage });

const cloudinaryDestroy = async (data) => {
  console.log("old pic", data);
  const { dir, name } = data;
  const public_id = `${dir.substr(62, dir.length)}/${name}`;
  await cloudinary.uploader.destroy(public_id, (err, res) => {
    console.log(err, res);
    if (err) return new Error(err);
    else return res;
  });
};

module.exports = {
  cloudinaryAvatar,
  cloudinaryIncomingMail,
  cloudinaryOutgoingMail,
  cloudinaryLeaves,
  cloudinaryPromotions,
  cloudinaryQualifications,
  cloudinaryQueries,
  cloudinaryDestroy,
};
