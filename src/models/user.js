const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Role = require("../models/role");
const Post = require("../models/post");
const Customer = require("./customer");

require("../models/role");

//SubSchema
const imageSchema = mongoose.Schema({
  img: {
    type: String,
    required: true,
  },
  altImg: {
    type: String,
  },
});

/////////////////////////////////////////////
//Schema
const userSchema = mongoose.Schema({
  //Unique
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,

    validate(email) {
      if (!validator.isEmail(email)) throw new Error("Email is invalid");
    },
  },

  //Require-normal:
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
    trim: true,

    validate(pwd) {
      if (pwd.toLowerCase().includes("password"))
        throw new Error('Password cannot contain word "password"');
    },
  },
  status: {
    type: Boolean,
    required: true,
    default: true,
  },
  gender: {
    type: String,
    required: true,
    trim: true,
    enum: ["M", "F", "D"],
  },
  phone: {
    type: String,
    required: true,
    trim: true,

    validate(phone) {
      if (!validator.isMobilePhone(phone)) {
        throw new Error("This is not a phone number");
      }
    },
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },

  //normal
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
  avatar: imageSchema,

  //Ref (default ????)
  role: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Role",
  }, // => roleID
});

userSchema.virtual("posts", {
  ref: "Post",
  localField: "_id",
  foreignField: "author",
});

userSchema.virtual("orders", {
  ref: "Order",
  localField: "_id",
  foreignField: "saler",
});

userSchema.plugin(uniqueValidator);

//method model and method Instance
// userSchema.methods.toJSON = function () {
//   const user = this
//   const userObject = user.toObject()

//   delete userObject.password
//   delete userObject.tokens
//   delete userObject.role

//   return userObject
// }

userSchema.methods.toJSON = function () {
  const user = this;
  const userProfile = user.toObject();

  delete userProfile.password;
  delete userProfile.tokens;
  // delete userProfile.avatar;

  return userProfile;
};

userSchema.methods.generateCustomer = async function () {
  try {
    const user = this;
    await user.populate("role");
    if (user.role.name === "customer") {
      const customerCheck = await Customer.findOne({ email: user.email });

      //Check customer already exist
      if (customerCheck) return null;

      //Create customer
      const customer = new Customer({
        email: user.email,
        fullName: user.fullName,
        status: "contact",
        gender: user.gender,
        phone: user.phone,
        address: user.address,
        updatedBy: "000000000000",
      });
      await customer.save();
      return customer;
    }
    return null;
  } catch (e) {
    console.log(e);
  }
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign(
    { _id: user._id, role: (await Role.findById(user.role)).code },
    "SEC_JWT"
  );

  //Save token to user.tokens
  user.tokens.push({ token });
  await user.save();

  return token;
};

userSchema.methods.generateToken = async function () {
  const user = this;
  //60 giây * 60phút = 3600
  const token = jwt.sign(
    { _id: user._id, role: (await Role.findById(user.role)).code },
    "SEC_JWT",
    { expiresIn: 60 * 5 }
  );

  //Save token to user.tokens
  user.tokens.push({ token });
  await user.save();
  // console.log(user);
  // console.log(await User.findById(user._id));
  return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
  //Check email
  const user = await User.findOne({ email });
  if (!user) throw new Error("Unable to login");

  //Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Unable to login");
  return user;
};

//Middleware instance
userSchema.pre("save", async function (next) {
  const user = this;
  //isModified
  //true: create new, có field password trong update
  //false: field không có trong create và update
  //!!! không compare pwd mà mình update với passHash trong db

  //Clear all token expire
  console.log(user.isModified("tokens"));
  if (user.isModified("tokens")) {
    console.log(">>>>>>>>>>>>>>>");
    for (let i = 0; i < user.tokens.length; i++) {
      console.log("index: ", i);
      try {
        jwt.verify(user.tokens[i].token, "SEC_JWT");
        console.log("pass");
      } catch (error) {
        console.log(error.message);
        user.tokens.splice(i, 1);
        i--;
      }
    }
  }

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

//Model
const User = mongoose.model("User", userSchema);
module.exports = User;

// //Test
// const user = new User({
//   fullName: "Anh",
//   email: "marketing@gmail.com",
//   password: "12345678",
//   gender: "F",
//   phone: "0387897777878",
//   address: "sfd",
//   avatar: { img: "link img" },
//   role: "62ba81409b95ac64d5dfe805",
// });
// console.log(user);
// user.save((err) => {
//   if (err) return console.log(err.message);
//   console.log("GOOD");
// });
