const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")
const validator = require("validator")

//Schema
const feedbackSchema = mongoose.Schema({
  //Normal
  content: {
    type: String,
    required: true,
    trim: true,
  },
  images: [
    {
      image: {
        type: Buffer,
        required: true,
      },
      imageAltDoc: String,
    },
  ],
  status: {
    type: Boolean,
    required: true,
    default: true,
  },
  star: {
    type: Number,
    required: true,

    validate(star) {
      if (!validator.isInt(String(star)))
        throw new Error(`${star} is not an integer value`)
      if (star <= 0 || star >= 6) throw new Error("Star must between 1 to 5")
    },
  },

  //Ref
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Product",
  }, // => productID
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  }, // => userID
})
feedbackSchema.plugin(uniqueValidator)

//Model
const Feedback = mongoose.model("Feedback", feedbackSchema)

//Test
const feedback = new Feedback({
  user: "123456789012345678901234",
  product: "123456789012345678901234",
  content: "Some feedback about product",
  star: 4,
})
console.log(feedback)

feedback.validate((err) => {
  if (err) return console.log(err.message)
  console.log("GOOD")
})
// feedback.save((err) => {
//   console.log(err)
// })

// Feedback.findByIdAndUpdate(
//   "629eaaf5f0f2ebdcd8e3937f",
//   {
//     status: true,
//     content: "",
//   },
//   { runValidators: true }
// )
//   .then((data) => console.log(data))
//   .catch((err) => console.log(err))

module.exports = Feedback
