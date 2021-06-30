const router = require("express").Router();

const usersRouter = require("../services/users");
const personnelsRouter = require("../services/personnels");
const authRouter = require("../services/auth");
const mdaRouter = require("../services/mdas");
const deptRouter = require("../services/departments");
const generalfileRouter = require("../services/general-files");
const personalfileRouter = require("../services/personal-files");
const generalfileMovementRouter = require("../services/generalfile_movement");
const personalfileMovementRouter = require("../services/personalfile_movement");
const incomingMailRouter = require("../services/incoming-mails");
const outgoingMailRouter = require("../services/outgoing-mails");

router.use("/auth", authRouter);
router.use("/mdas", mdaRouter);
router.use("/depts", deptRouter);
router.use("/users", usersRouter);
router.use("/personnels", personnelsRouter);
router.use("/general-files", generalfileRouter);
router.use("/personal-files", personalfileRouter);
router.use("/general-filemovement", generalfileMovementRouter);
router.use("/personal-filemovement", personalfileMovementRouter);
router.use("/incoming-mails", incomingMailRouter);
router.use("/outgoing-mails", outgoingMailRouter);

module.exports = router;
