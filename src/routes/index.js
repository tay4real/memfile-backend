const router = require("express").Router();

const superUserRouter = require("../services/superuser");
const usersRouter = require("../services/users");
const authRouter = require("../services/auth");
const deptRouter = require("../services/departments");
const fileRouter = require("../services/files");
const fileMovementRouter = require("../services/file_movement");
const mailRouter = require("../services/mails");

router.use("/admin", superUserRouter);
router.use("/users", usersRouter);
router.use("/auth", authRouter);
router.use("/depts", deptRouter);
router.use("/files", fileRouter);
router.use("/filemovement", fileMovementRouter);
router.use("/mails", mailRouter);

module.exports = router;
