const router = require("express").Router();

const usersRouter = require("../services/users");
const personnelsRouter = require("../services/personnels");
const authRouter = require("../services/auth");
const mdaRouter = require("../services/mdas");
const deptRouter = require("../services/departments");
const fileRouter = require("../services/files");
const fileMovementRouter = require("../services/file_movement");
const incomingMailRouter = require("../services/incoming-mails");
const outgoingMailRouter = require("../services/outgoing-mails");

router.use("/auth", authRouter);
router.use("/mdas", mdaRouter);
router.use("/depts", deptRouter);
router.use("/users", usersRouter);
router.use("/personnels", personnelsRouter);
router.use("/files", fileRouter);
router.use("/filemovement", fileMovementRouter);
router.use("/incoming-mails", incomingMailRouter);
router.use("/outgoing-mails", outgoingMailRouter);

module.exports = router;
