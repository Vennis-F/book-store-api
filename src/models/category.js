const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")
const validator = require("validator")

//Schema
const categorySchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
})

categorySchema.plugin(uniqueValidator)

//Model
const Category = mongoose.model("Category", categorySchema)

module.exports = Category
