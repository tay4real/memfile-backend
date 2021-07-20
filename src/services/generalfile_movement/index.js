const filemovementRouter = require("express").Router();
const mongoose = require("mongoose");

const UserModel = require("../users/users.schema");
const IncomingMailModel = require("../incoming-mails/mail.schema");
const OutgoingMailModel = require("../outgoing-mails/mail.schema");
const FileModel = require("../general-files/general-files.schema");
const { authorize } = require("../../utils/auth/middleware");

filemovementRouter.put(
  "/:user_id/requestfile/:file_id",
  authorize,

  async (req, res, next) => {
    try {
      let user_id = req.params.user_id;
      let file_id = req.params.file_id;
      // select the user requesting the file
      let user = await UserModel.findById(user_id);
      let file = await FileModel.findById(file_id);

      if (file && file.file_location === 0) {
        if (user) {
          // Move file to user
          user = await UserModel.findByIdAndUpdate(
            user_id,
            {
              $push: {
                generalfiles: {
                  _id: file_id,
                },
              },
            },
            {
              runValidators: true,
              new: true,
            }
          );

          // change file status to 1 - File Requested (in use)
          let file = await FileModel.findByIdAndUpdate(file_id, {
            $set: {
              file_location: 1,
            },
            $push: {
              fileRequest: {
                by: user_id,
                dateRequested: new Date(),
              },
            },
          });

          if (file) {
            console.log(new Date());
            res.send("File Request Granted");
          }
        } else {
          res.status(400).send("User does not exist");
        }
      } else {
        let totalFileRequests = file.fileRequest.length;
        let file_user_id = file.fileRequest[totalFileRequests - 1].by;
        let file_user = await UserModel.findById(file_user_id);
        res
          .status(400)
          .send(
            `File already in use by ${
              file_user.surname + " " + file_user.firstname
            }`
          );
      }
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
);

filemovementRouter.put(
  "/:user_id/moveFile/:file_id",
  authorize,

  async (req, res, next) => {
    const user_from_id = req.params.user_id;
    const user_to_id = req.body.user_to_id;

    const file_id = req.params.file_id;
    const doc_id = req.body.document_id;
    const comment = req.body.charge_comment;
    const docType = req.body.docType;
    const date = new Date();

    try {
      let file = await FileModel.findById(file_id);

      if (file && file.file_location === 1) {
        // select the user you are charging file to
        let user_sending = "";
        let user_from = await UserModel.findById(user_from_id);
        if (user_from) {
          user_sending =
            user_from.surname +
            " - " +
            user_from.post +
            ", " +
            user_from.department;
        }

        // select the user you are charging file to
        let user_to = await UserModel.findById(user_to_id);

        if (user_to) {
          const user_receiving =
            user_to.surname + " - " + user_to.post + ", " + user_to.department;
          let file_exist = false;
          user_to.generalfiles.map((file_no) => {
            if (
              mongoose.Types.ObjectId(file_no).toString() ===
              mongoose.Types.ObjectId(file_id).toString()
            ) {
              file_exist = true;
            }
          });

          if (file_exist) {
            res.send("File already charged to user");
          } else {
            // charge file to another user
            console.log(user_receiving);
            console.log(user_sending);
            file = await FileModel.findByIdAndUpdate(file_id, {
              $push: {
                chargeFile: {
                  from: user_sending,
                  to: user_receiving,
                  doc_id: doc_id,
                  dateCharged: date,
                },
              },
            });

            if (docType === "incomingmails") {
              console.log(docType);
              console.log(doc_id);
              const incomingmail = await IncomingMailModel.findByIdAndUpdate(
                doc_id,
                {
                  $push: {
                    charge_comment: {
                      from: user_sending,
                      to: user_receiving,
                      comment: comment,
                      dateCharged: date,
                    },
                  },
                }
              );
              console.log(incomingmail);
            }

            if (docType === "outgoingmails") {
              const incomingmail = await OutgoingMailModel.findByIdAndUpdate(
                doc_id,
                {
                  $push: {
                    charge_comment: {
                      from: user_sending,
                      to: user_receiving,
                      comment: comment,
                      dateCharged: date,
                    },
                  },
                }
              );
            }

            // Move file to the user
            user_to = await UserModel.findByIdAndUpdate(
              user_to_id,
              {
                $push: {
                  generalfiles: {
                    _id: file_id,
                  },
                },
              },
              {
                runValidators: true,
                new: true,
              }
            );

            // select the user charging the file
            let user_from = await UserModel.findById(user_from_id);

            // Remove the file from the user charging the file
            if (user_from) {
              user_from = await UserModel.findByIdAndUpdate(
                user_from_id,
                {
                  $pull: {
                    generalfiles: file_id,
                  },
                },
                { multi: true }
              );
            }

            res.send("File charging successful");
          }
        }
      } else {
        next();
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

filemovementRouter.put(
  "/:user_id/returnFile/:file_id",
  authorize,

  async (req, res, next) => {
    const user_id = req.params.user_id;
    const file_id = req.params.file_id;
    try {
      // select the user returning the file
      const user = await UserModel.findById(user_id);
      let file = await FileModel.findById(file_id);

      if (user && file) {
        let user_from = await UserModel.findByIdAndUpdate(
          user_id,
          {
            $pull: {
              generalfiles: file_id,
            },
          },
          { multi: true }
        );

        // change file status to 0 - File Returned to registry (available)
        file = await FileModel.findByIdAndUpdate(file_id, {
          $set: {
            file_location: 0,
          },
          $push: {
            fileReturn: {
              by: user_id,
              dateReturned: new Date(),
            },
          },
        });
        res.send("File returned successfully");
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

// CLEAR ALL REQUEST FILE LOG
filemovementRouter.delete(
  "/:file_id/requestfile/",
  authorize,

  async (req, res, next) => {
    try {
      let file_id = req.params.file_id;

      let file = await FileModel.findById(file_id);

      if (file) {
        let file = await FileModel.findByIdAndUpdate(file_id, {
          $pull: { fileRequest: { $exists: true } },
        });

        res.send("Requested Files Log cleared");
      }
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
);

// CLEAR ALL RETURN FILE LOG
filemovementRouter.delete(
  "/:file_id/returnfile/",
  authorize,

  async (req, res, next) => {
    try {
      let file_id = req.params.file_id;

      let file = await FileModel.findById(file_id);

      if (file) {
        let file = await FileModel.findByIdAndUpdate(file_id, {
          $pull: { fileReturn: { $exists: true } },
        });

        res.send("Returned Files Log cleared");
      }
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
);

// CLEAR Charge File LOG
filemovementRouter.delete(
  "/:file_id/chargefile/",
  authorize,

  async (req, res, next) => {
    try {
      let file_id = req.params.file_id;

      let file = await FileModel.findById(file_id);

      if (file) {
        let file = await FileModel.findByIdAndUpdate(file_id, {
          $pull: { chargeFile: { $exists: true } },
        });

        res.send("Charge Files Log cleared");
      }
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
);

module.exports = filemovementRouter;
