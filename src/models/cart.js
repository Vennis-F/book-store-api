const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")
const validator = require("validator")

//Schema
const cartSchema = mongoose.Schema(
  {
    //Ref
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    }, // => userId

    //Normal
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
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
cartSchema.plugin(uniqueValidator)

//Model
const Cart = mongoose.model("Cart", cartSchema)

//Test
const cart = new Cart({
  owner: "123456789012345678901234",
  //   totalAmount: 0,
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

console.log(cart)

cart.validate((err) => {
  if (err) return console.log(err.message)
  console.log("GOOD")
})

module.exports = Cart
