const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const validator = require("validator");
const User = require("./user");

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
        if (!validator.isEmail(email)) throw new Error("Email is invalid");
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
          throw new Error("This is not a phone number");
        }
      },
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },

    //Ref
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    }, // => userID

    //History
    history: {
      type: [Object],
    },
  },
  {
    timestamps: true,
  }
);
customerSchema.plugin(uniqueValidator);

customerSchema.pre("save", async function (next) {
  const customer = this;
  if (
    customer?.updatedBy?.toString().length === 12 ||
    customer?.updatedBy?.toString().length === 24
  )
    await customer.populate({ path: "updatedBy" });

  let updater;
  if (customer?.updatedBy) updater = customer.updatedBy.fullName;
  else updater = "Auto";

  const history = {
    email: customer.email,
    fullName: customer.fullName,
    status: customer.status,
    gender: customer.gender,
    phone: customer.phone,
    address: customer.address,
    updatedBy: updater,
    updatedAt: customer.updatedAt,
  };
  customer.history.push(history);

  next();
});

//Model
const Customer = mongoose.model("Customer", customerSchema);
module.exports = Customer;
