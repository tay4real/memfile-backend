const express = require("express");
const multer = require("multer");
const { writeFile } = require("fs-extra");

const { join } = require("path");

const router = express.Router();

const upload = multer({});

const studentsFolderPath = join(__dirname, "../../../public/img/students");

router.post("/upload", upload.single("avatar"), async (req, res, next) => {
  try {
    const pixURL = join(studentsFolderPath, req.file.originalname);
    await writeFile(
      join(studentsFolderPath, req.file.originalname),
      req.file.buffer
    );
    console.log(pixURL);
    res.send("ok");
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post(
  "/uploadMultiple",
  upload.array("multipleAvatar", 6),
  async (req, res, next) => {
    try {
      let arr = [];

      const arrayOfPromises = req.files.map((file) => {
        writeFile(join(studentsFolderPath, file.originalname), file.buffer);
        arr.push(join(studentsFolderPath, file.originalname));
      });
      console.log(arr);
      await Promise.all(arrayOfPromises);
      res.send("ok");
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

module.exports = router;
