const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")
const validator = require("validator")

//SubSchema
const imageSchema = mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  imageAltDoc: {
    type: String,
    trim: true
  }
})

const userInfoSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    trim: true,
    enum: ["M", "F", "D"],
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,

    validate(email) {
      if (!validator.isEmail(email)) throw new Error("Email is invalid")
    },
  },
  phone: {
    type: String,
    required: true,
    trim: true,

    validate(phone) {
      if (!validator.isMobilePhone(phone)) {
        throw new Error("This is not a phone number")
      }
    },
  },
  //Ref to user account if they have
  userAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }, // => User id
})

//////////////////////////////////////////////////////////////////////////
//Schema
const feedbackSchema = mongoose.Schema({
  //Normal
  content: {
    type: String,
    required: true,
    trim: true,
  },
  images: [imageSchema],
  status: {
    type: Boolean,
    default: true,
    required: true,
  },
  star: {
    type: Number,
    required: true,
    min: 0,
    max: 10,

    validate(star) {
      if (!validator.isInt(String(star)))
        throw new Error(`${star} is not an integer value`)
      if (star <= 0 || star >= 11) throw new Error("Star must between 1 to 10")
    },
  },

  //Ref
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Product",
  }, // => productID
  user: {
    type: userInfoSchema,
    required: true
  }, // => userID
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  } // => orderID
})
feedbackSchema.plugin(uniqueValidator)

//middleware
feedbackSchema.pre('save', function (next) {
  try {
    const feedbackUser = this.user
    if (!feedbackUser.userAccount && !feedbackUser.userInfo)
      throw new Error("Feedback's user information required")
  } catch (error) {
    console.log(error)
  }

  next()
})

//Model
const Feedback = mongoose.model("Feedback", feedbackSchema)
module.exports = Feedback

//Test
// const feedback = new Feedback({
//   user: {
//     userInfo: {
//       name: "Tho",
//       email: "tho@gami.com",
//       gender: "M",
//       phone: "0907873122"
//     }
//   },
//   product: "123456789012345678901234",
//   content: "Some feedback about product",
//   star: 4,
// })

// mongoose
//   .connect("mongodb://127.0.0.1:27017/book-store", {
//     autoIndex: false,
//   })
//   .then(() => console.log("DB mongodb connection is ON"))
//   .catch(() => console.log("DB mongodb connection FAIL"))

// const test = async () => {
//   await feedback.save()
// }

// test()