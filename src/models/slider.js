const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

// SubSchema
const imageSchema = mongoose.Schema({
  img: {
    type: String,
    required: true,
  },
  altImg: {
    type: String,
  },
});

// Schema
const sliderSchema = mongoose.Schema({
  //Unique
  title: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  //Require-normal
  backlink: {
    type: String,
    required: true,
    trim: true,
  },
  notes: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: Boolean,
    required: true,
    default: true,
  },

  //normal
  image: imageSchema,
});

sliderSchema.plugin(uniqueValidator);

//Model
const Slider = mongoose.model("slider", sliderSchema);
module.exports = Slider;

//Test
// const slider = new Slider({
//   notes: "Review có tâm nhất quả đất",
//   description: "Éo biết",
//   backlink: "hihi",
//   title: "hihiihih",
//   images: [{ img: "link1" }, { img: "link2" }],
// })

// console.log(slider)
// slider.validate((err, data) => {
//   if (err) return console.log(err)
//   console.log("good")
// })
