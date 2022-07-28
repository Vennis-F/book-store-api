const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const validator = require("validator");
const User = require("./user");
const Customer = require("./customer");

//SubSchema
const imageSchema = mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  imageAltDoc: {
    type: String,
    trim: true,
  },
});

const userInfoSchema = mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  gender: {
    type: String,
    trim: true,
    enum: ["M", "F", "D"],
    required: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,

    validate(email) {
      if (!validator.isEmail(email)) throw new Error("Email is invalid");
    },
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
  //Ref to user account if they have
  userAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }, // => User id
});

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
        throw new Error(`${star} is not an integer value`);
      if (star <= 0 || star >= 11) throw new Error("Star must between 1 to 10");
    },
  },

  //Ref
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true, 
    ref: "product",
  }, // => productID
  user: {
    type: userInfoSchema,
    required: true,
  }, // => userID
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",

  } // => orderID
})
feedbackSchema.plugin(uniqueValidator)

feedbackSchema.pre('save', async function (next) {
  const feedback = this
  const accountUser = await User.findOne({ email: feedback.user.email })
  const customer = await Customer.findOne({ email: feedback.user.email })

  if (accountUser) {
    feedback.user.userAccount = accountUser._id
  }

  if (!accountUser && !customer) {
    feedback.status = false

  }

  next();
});

//Model
const Feedback = mongoose.model("Feedback", feedbackSchema);
module.exports = Feedback;

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
