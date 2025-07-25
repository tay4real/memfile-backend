/**
 * @swagger
 * tags:
 *   name: Personal File Movement
 *   description: APIs to request, charge, and return personal files between users.
 */
const filemovementRouter = require('express').Router();

const UserModel = require('../users/users.schema');
const FileModel = require('../personal-files/personal-files.schema');
const {
  authorize,
  isRegistryOfficer,
  isPermanentSecretary,
  isAdmin,
} = require('../../utils/auth/middleware');

/**
 * @swagger
 * /personal-filemovement/{user_id}/requestfile/{file_id}:
 *   put:
 *     summary: Request a personal file for a user
 *     description: Allows authorized users to request a file by moving it to a specific user's possession and updating its status.
 *     tags:
 *       - Personal File Movement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: user_id
 *         in: path
 *         required: true
 *         description: ID of the user requesting the file
 *         schema:
 *           type: string
 *       - name: file_id
 *         in: path
 *         required: true
 *         description: ID of the file being requested
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File request granted
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

filemovementRouter.put(
  '/:user_id/requestfile/:file_id',
  authorize,
  isAdmin || isPermanentSecretary || isRegistryOfficer,
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

        res.send('File request granted');
      } else {
        next();
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

/**
 * @swagger
 * /personal-filemovement/{user_id}/moveFile/{file_id}:
 *   put:
 *     summary: Move personal file to another user
 *     description: Charges a personal file from one user to another, recording the movement history.
 *     tags:
 *       - Personal File Movement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: user_id
 *         in: path
 *         required: true
 *         description: ID of the user currently holding the file
 *         schema:
 *           type: string
 *       - name: file_id
 *         in: path
 *         required: true
 *         description: ID of the file to be moved
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Destination user and remarks
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_to_id:
 *                 type: string
 *               pgIndex:
 *                 type: string
 *               pgRemark:
 *                 type: string
 *     responses:
 *       200:
 *         description: File charging successful
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

filemovementRouter.put(
  '/:user_id/moveFile/:file_id',
  authorize,
  isAdmin || isPermanentSecretary || isRegistryOfficer,
  async (req, res, next) => {
    const user_from_id = req.params.user_id;
    const user_to_id = req.body.user_to_id;
    const file_id = req.params.file_id;
    const pgIndex = req.body.pgIndex;
    const pgRemark = req.body.pgRemark;
  
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

        res.send('File charging successful');
      } else {
        next();
      }
    } catch (error) {
      next(new Error(error.message));
    }
  }
);

/**
 * @swagger
 * /personal-filemovement/{user_id}/returnFile/{file_id}:
 *   put:
 *     summary: Return a personal file to registry
 *     description: Returns a file back to the registry, updates user record and sets file location as available.
 *     tags:
 *       - Personal File Movement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: user_id
 *         in: path
 *         required: true
 *         description: ID of the user returning the file
 *         schema:
 *           type: string
 *       - name: file_id
 *         in: path
 *         required: true
 *         description: ID of the file to be returned
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File returned successfully
 *       404:
 *         description: User or file not found
 *       500:
 *         description: Server error
 */

filemovementRouter.put(
  '/:userid/returnFile/:file_id',
  authorize,
  isAdmin || isPermanentSecretary || isRegistryOfficer,
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
      next(new Error(error.message));
    }
  }
);

module.exports = filemovementRouter;
