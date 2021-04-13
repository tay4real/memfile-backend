const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");
const { defaultAvatar } = require("../../utils/users");

const UserSchema = new Schema(
  {
    firstname: { type: String, required: [true, "First name is required"] },
    surname: { type: String, required: [true, "Surname is required"] },
    username: String,
    password: { type: String, required: [true, "Password is required"] },
    email: {
      type: String,
      unique: true,
      required: [true, "Email address is required"],
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
      validate: {
        validator: async function (email) {
          const user = await this.constructor.findOne({ email });
          if (user && user.email === this.email) return true;
          return !user ? true : false;
        },
        message: "email is taken",
      },
    },
    avatar: String,
    role: {
      type: String,
      enum: ["SuperAdmin", "Admin", "Officer", "ImplementationOfficer"],
      default: "ImplementationOfficer",
    },
    departments: { type: Schema.Types.ObjectId, ref: "departments" },
    files: [
      {
        file_code: String,
        file_no: String,
        file_title: String,
        file_type: String,
        file_content: [],
        date: Date,
      },
    ],
    status: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
    refreshTokens: [
      {
        token: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true, virtuals: true }
);

UserSchema.virtual("fullname").get(() => {
  return `${this.firstname} ${this.surname}`;
});

UserSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.__v;
  delete userObject.refreshTokens;

  return userObject;
};

UserSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) return user;
    else return null;
  } else {
    return null;
  }
};

UserSchema.static("trashUser", async function (id) {
  const user = await UserModel.findByIdAndUpdate(id, {
    $set: {
      status: 1,
    },
  });
  if (user) {
    return "User account deactivated";
  }
});

UserSchema.static("restoreUser", async function (id) {
  const user = await UserModel.findByIdAndUpdate(id, {
    $set: {
      status: 0,
    },
  });
  if (user) {
    return "User account reactivated";
  }
});

UserSchema.static("deleteUser", async function (id) {
  const user = await UserModel.findByIdAndDelete(req.params.id);
  return "User Deleted";
});

UserSchema.pre("save", async function (next) {
  const user = this;

  if (user.avatar === undefined) {
    user.avatar = defaultAvatar(user.firstname, user.surname);
  }
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  next();
});

const UserModel = model("users", UserSchema);
module.exports = UserModel;
