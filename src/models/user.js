const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")
const validator = require("validator")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const Role = require("../models/role")
require("../models/role")

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
      if (!validator.isEmail(email)) throw new Error("Email is invalid")
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
        throw new Error('Password cannot contain word "password"')
    },
  },
  status: {
    type: Boolean,
    required: true,
    default: true,
  },

  //normal
  gender: {
    type: String,
    trim: true,
    enum: ["M", "F", "D"],
  },
  phone: {
    type: String,
    trim: true,

    validate(phone) {
      if (!validator.isMobilePhone(phone)) {
        throw new Error("This is not a phone number")
      }
    },
  },
  address: {
    type: String,
    trim: true,
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],

  //Ref (default ????)
  role: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Role",
  }, // => roleID
})
userSchema.plugin(uniqueValidator)

//method model and method Instance
// userSchema.methods.toJSON = function () {
//   const user = this
//   const userObject = user.toObject()

//   delete userObject.password
//   delete userObject.tokens
//   delete userObject.role

//   return userObject
// }
userSchema.methods.generateAuthToken = async function () {
  const user = this
  const token = await jwt.sign(
    { _id: user._id, role: (await Role.findById(user.role)).code },
    "SEC_JWT"
  )

  //Save token to user.tokens
  user.tokens.push({ token })
  await user.save()

  return token
}
userSchema.statics.findByCredentials = async (email, password) => {
  //Check email
  const user = await User.findOne({ email })
  if (!user) throw new Error("Unable to login")

  //Check password
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) throw new Error("Unable to login")
  return user
}

//Middleware instance
userSchema.pre("save", async function (next) {
  const user = this
  //isModified
  //true: create new, có field password trong update
  //false: field không có trong create và update
  //!!! không compare pwd mà mình update với passHash trong db
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8)
  }

  next()
})

//Model
const User = mongoose.model("User", userSchema)
module.exports = User

//Test
// const user = new User({
//   fullName: "Anh",
//   email: "hoanganh@gmail.com",
//   password: "123456",
//   gender: "F",
//   phone: "0387897777878",
//   address: "sfd",
//   role: "123456789012345678901234",
// })
// console.log(user)
// user.validate((err) => {
//   if (err) return console.log(err.message)
//   console.log("GOOD")
// })
