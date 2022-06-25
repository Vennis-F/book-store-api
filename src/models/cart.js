const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const validator = require("validator");
require("./product");

//SubSchema
const cartItemSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    // unique: true,
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
  totalAmount: {
    type: Number,
    default: 0,
    required: true,
    min: 0,
  },

  //Ref
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Product",
  }, // => productId
});

//Schema
const cartSchema = mongoose.Schema(
  {
    //Normal
    totalCost: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    items: [cartItemSchema], // => CartItems

    //Ref
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    }, // => userId
  },
  {
    timestamps: true,
  }
);

cartSchema.plugin(uniqueValidator);

//middleware
cartSchema.pre("save", function (next) {
  try {
    const cart = this;

    //Reset cart.totalCost to 0
    cart.totalCost = 0;

    cart.items.forEach((item) => {
      item.totalAmount = item.amount * item.quantity;
      cart.totalCost += item.totalAmount;
    });
  } catch (e) {
    console.log(e);
  }
  next();
});

//Model
const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;

// //Test
// const cart = new Cart({
//   user: "123456789012345678901234",
//   //   totalAmount: 0,
//   items: [{
//       title: " jgj ",
//       quantity: 10,
//       amount: 50,
//       product: "123456789012345678901234",
//     },
//     {
//       title: "cookie",
//       amount: 100,
//       product: "123456789012345678901234",
//     },
//   ],
// })

// mongoose
//     .connect("mongodb://127.0.0.1:27017/book-store", {
//       autoIndex: false,
//     })
//     .then(() => console.log("DB mongodb connection is ON"))
//     .catch(() => console.log("DB mongodb connection FAIL"))

// const test = async () => {
//   await cart.save()
//   // console.log(Cart.find({}))
// }

// test()
