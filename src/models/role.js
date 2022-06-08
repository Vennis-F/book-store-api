const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")
const validator = require("validator")

//Schema
const roleSchema = mongoose.Schema({
  // Unique
  name: { type: String, required: true, unique: true, trim: true },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minLength: 3,
    maxLength: 3,

    validate(code) {
      let isValid = true
      if (!(code[0] === "R") || !validator.isNumeric(code.slice(1, 3)))
        isValid = false

      if (!isValid)
        throw new Error("Code must be form 'Rxx' (With x is number)")
    },
  }, //form Rxx (x is number)
})
roleSchema.plugin(uniqueValidator)

//Model
const Role = mongoose.model("Role", roleSchema)
module.exports = Role

//Test
let roles = [
  {
    name: "guest",
    code: "R01",
  },
  {
    name: "customer",
    code: "R02",
  },
  {
    name: "marketing",
    code: "R03",
  },
  {
    name: "sale",
    code: "R04",
  },
  {
    name: "saleManager",
    code: "R05",
  },
  {
    name: "admin",
    code: "R06",
  },
]
roles = roles.map((role) => new Role(role))
// roles.forEach((role) => role.save())
