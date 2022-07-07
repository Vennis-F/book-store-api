const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")
const validator = require("validator")

/////////////////////////////////////////////
//Schema
const customerSchema = mongoose.Schema(
  {
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
    status: {
      type: String,
      required: true,
      trim: true,
      enum: ["contact", "potential", "customer"],
      default: "contact",
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
          throw new Error("This is not a phone number")
        }
      },
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },

    //Ref
    updateBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    }, // => userID
  },
  {
    timestamps: true,
  }
)
customerSchema.plugin(uniqueValidator)

//Model
const Customer = mongoose.model("Customer", customerSchema)
module.exports = Customer