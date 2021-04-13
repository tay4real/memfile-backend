const filemovementRouter = require("express").Router();

const UserModel = require("../users/users.schema");
const FileModel = require("../files/files.schema");
const {
  authorize,
  checkRefreshToken,
  checkImplementationOfficer,
  checkAdmin,
  checkSuperUser,
} = require("../../utils/middlewares");
const { APIError } = require("../../utils");

filemovementRouter.put(
  "/:user_id/requestfile/:file_id",
  authorize,
  checkSuperUser || checkAdmin || checkImplementationOfficer,
  async (req, res, next) => {
    try {
      const user_id = req.params.userid;
      const file_id = req.params.fileid;
      // select the user requesting the file
      const user = await UserModel.findById(user_id);

      if (user) {
        // Move file to user
        user = await UserModel.findByIdAndUpdate(
          user_id,
          {
            $push: {
              files: {
                _id: mongoose.Types.ObjectId(file_id),
              },
            },
          },
          {
            runValidators: true,
            new: true,
          }
        );

        // change file status to 1 - File Requested (in use)
        const file = await FileModel.findByIdAndUpdate(id, {
          $set: {
            file_location: 1,
          },
          $push: {
            fileRequest: {
              $set: {
                by: mongoose.Types.ObjectId(user_id),
                dateRequested: new Date(),
              },
            },
          },
        });

        res.send("File request granted");
      } else {
        next();
      }
    } catch (error) {
      next(new APIError(error.message, 404));
    }
  }
);

filemovementRouter.put(
  "/:user_id/moveFile/:file_id",
  authorize,
  checkSuperUser || checkAdmin || checkImplementationOfficer,
  async (req, res, next) => {
    const user_from_id = req.params.user_id;
    const user_to_id = req.body.user_to_id;
    const file_id = req.params.file_id;
    const pgIndex = req.body.pgIndex;
    const pgRemark = req.body.pgRemark;
    const date = new Date();
    try {
      // charge file to another user
      const file = await FileModel.findByIdAndUpdate(id, {
        $push: {
          chargeFile: {
            $set: {
              from: user_from_id,
              to: user_to_id,
              pageIndex: pgIndex,
              rematk: pgRemark,
              dateCharged: new Date(),
            },
          },
        },
      });

      // select the user you are charging file to
      const user_to = await UserModel.findById(user_to_id);

      if (user_to) {
        // Move file to user
        user_to = await UserModel.findByIdAndUpdate(
          user_to_id,
          {
            $push: {
              files: {
                _id: mongoose.Types.ObjectId(file_id),
              },
            },
          },
          {
            runValidators: true,
            new: true,
          }
        );

        // select the user charging the file
        const user_from = await UserModel.findById(from);

        if (user_from) {
          user_from = await UserModel.findByIdAndUpdate(
            user_from_id,
            {
              $pull: {
                files: {
                  _id: mongoose.Types.ObjectId(file_id),
                },
              },
            },
            {
              runValidators: true,
              new: true,
            }
          );
        }

        res.send("File charging successful");
      } else {
        next();
      }
    } catch (error) {
      next(new APIError(error.message, 404));
    }
  }
);

filemovementRouter.put(
  "/:userid/returnFile/:file_id",
  authorize,
  checkSuperUser || checkAdmin || checkImplementationOfficer,
  async (req, res, next) => {
    const user_id = req.params.user_id;
    const file_id = req.params.file_id;
    try {
      // select the user returning the file
      const user = await UserModel.findById(user_id);

      if (user) {
        user_from = await UserModel.findByIdAndUpdate(
          user_id,
          {
            $pull: {
              files: {
                _id: mongoose.Types.ObjectId(file_id),
              },
            },
          },
          {
            runValidators: true,
            new: true,
          }
        );
      }

      // change file status to 0 - File Returned to registry (available)
      const file = await FileModel.findByIdAndUpdate(id, {
        $set: {
          file_location: 0,
        },
        $push: {
          fileReturn: {
            $set: {
              by: mongoose.Types.ObjectId(user_id),
              dateReturned: new Date(),
            },
          },
        },
      });
    } catch (error) {
      next(new APIError(error.message, 404));
    }
  }
);

module.exports = filemovementRouter;
