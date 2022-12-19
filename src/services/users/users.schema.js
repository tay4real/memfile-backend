const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");
const { defaultAvatar } = require("../../utils/defaultAvatar");

const UserSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      required: [true, "Email address is required"],
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: { type: String, required: [true, "Password is required"] },
    surname: { type: String, required: [true, "Surname is required"] },
    firstname: { type: String, required: [true, "First name is required"] },
    post: String,
    avatar: String,
    role: {
      type: String,
      enum: [
        "Admin",
        "Registry Officer",
        "User"
      ],
      default: "User",
    },
    mda: String,
    department: String,
    generalfiles: [{ type: Schema.Types.ObjectId, ref: "generalfiles" }],
    status: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
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

UserSchema.static("deactivate", async function (id) {
  const user = await UserModel.findByIdAndUpdate(id, {
    $set: {
      status: 1,
    },
  });
  if (user) {
    return "User account deactivated";
  }
});

UserSchema.static("activate", async function (id) {
  const user = await UserModel.findByIdAndUpdate(id, {
    $set: {
      status: 0,
    },
  });
  if (user) {
    return "User account reactivated";
  }
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
