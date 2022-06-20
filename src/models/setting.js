const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")

// Schema
const settingSchema = mongoose.Schema({
  //Require-normal
  type: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  value: {
    type: String,
    required: true,
    trim: true,
  },
  order: {
    type: Boolean,
    required: true,
    default: true,
  },
  status: {
    type: Boolean,
    required: true,
    default: true,
  },
})

settingSchema.plugin(uniqueValidator)

//Model
const Setting = mongoose.model("setting", settingSchema)
module.exports = Setting

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
