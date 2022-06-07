const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")
const validator = require("validator")

//Schema
const orderSchema = mongoose.Schema(
  {
    //Ref
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    }, // => userId
    saler: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    }, // => salerId

    //Normal
    receiverName: { type: String, required: true, trim: true },
    address: {
      type: String,
      required: true,
      trim: true,
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
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ["success", "cancelled", "submitted"],
      default: "submitted",
      trim: true,
      lowercase: true,
    },
    items: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
          min: 1,

          validate: {
            validator: Number.isInteger,
            message: "{VALUE} is not an integer value",
          },
        },
        amount: {
          type: Number,
          required: true,
          default: 0,
          min: 0,
        },

        //Ref
        productInfo: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Product",
        }, // => productId
      },
    ], // => OrderItems
  },
  { timestamps: true }
)
orderSchema.plugin(uniqueValidator)

//Model
const Order = mongoose.model("Order", orderSchema)

//Test
const order = new Order({
  owner: "123456789012345678901234",
  saler: "123456789012345678901234",
  receiverName: "Anh",
  address: "Can Tho",
  phone: "0387897777878",
  //   totalAmount: 0,
  //   status: "success",
  items: [
    {
      title: " jgj ",
      quantity: 1,
      amount: 1.2,
      productInfo: "123456789012345678901234",
    },
    {
      title: "cookie",
      productInfo: "123456789012345678901234",
    },
  ],
})

console.log(order)

order.validate((err) => {
  if (err) return console.log(err.message)
  console.log("GOOD")
})

module.exports = Order
