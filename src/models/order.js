const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const validator = require("validator");
const Role = require("./role");
const User = require("./user");

//SubSchema
const orderItemSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    // unique: true, //Không nên dùng vì nó so document với nhau chứ ko phải trong 1 document
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
    ref: "product",
  }, // => productId
});

//Schema
const orderSchema = mongoose.Schema(
  {
    //Normal
    receiverName: {
      type: String,
      required: true,
      trim: true,
    },
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
          throw new Error("This is not a phone number");
        }
      },
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,

      validate(email) {
        if (!validator.isEmail(email)) throw new Error("Email is invalid");
      },
    },
    gender: {
      type: String,
      trim: true,
      enum: ["M", "F", "D"],
      required: true,
    },

    totalCost: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["success", "cancelled", "submitted"],
      default: "submitted",
      required: true,
      trim: true,
      lowercase: true,
    },
    items: [orderItemSchema], // => OrderItems
    note: {
      type: String,
      trim: true,
    },

    //Ref
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    }, // => userId

    saler: {
      type: mongoose.Schema.Types.ObjectId,
      // required: true,
      ref: "User",
    }, // => salerId
  },
  {
    timestamps: true,
  }
);

orderSchema.plugin(uniqueValidator);

//middleware
orderSchema.pre("save", function (next) {
  try {
    const order = this;
    order.totalCost = 0;
    order.items.forEach((item) => {
      item.totalAmount = item.amount * item.quantity;
      order.totalCost += item.totalAmount;
    });
  } catch (e) {
    console.log(e);
  }
  next();
});

orderSchema.pre('save', async function(next) {
  try {
    if(!this.saler) {
      const salerRole = await Role.findOne({name:'saler'})

      const salers= await User.find({role: salerRole._id})

      let min=1000000
      let minSaler= salers[0]
      for (const sale of salers) {
        const saler= await sale.populate({path: 'orders'})
        if(min>saler.orders.length) {
            min=saler.orders.length
            minSaler=sale
        }
      
      this.saler=minSaler
      console.log(this.saler)  
      }
    }
    next()
  } catch (error) {
    
  }
})

//Model
const Order = mongoose.model("Order", orderSchema);
module.exports = Order;

// //Test
// const order = new Order({
//   owner: "123456789012345678901234",
//   saler: "123456789012345678901234",
//   receiverName: "Anh",
//   gender:"M",
//   address: "Can Tho",
//   email: "Testing@gmail.com",
//   phone: "0387897777878",
//   items: [{
//       title: " jgj ",
//       quantity: 5,
//       amount: 22.4,
//       product: "123456789012345678901234",
//     },
//     {
//       title: "cookie",
//       quantity: 10,
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
//   await order.save()
// }

// test()
