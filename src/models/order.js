const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const validator = require("validator");
const { sendEmail } = require("../emails/account");
const Customer = require("./customer");
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

orderSchema.pre("save", async function (next) {
  try {
    const order = this;
    // console.log("order", order.status, order.isModified("status"));
    if (order.isModified("status")) {
      if (order.status === "cancelled") {
        for (const [index, item] of order.items.entries()) {
          await order.populate({ path: `items.${index}.product` });
          item.product.quantity += item.quantity;
          item.product.save();
        }
      }
    }
    next();
  } catch (e) {
    console.log(e);
  }
  next();
}); //return quantity product when status === cancelled

orderSchema.pre("save", async function (next) {
  try {
    const order = this;
    console.log("---------");
    console.log(
      "order",
      order.isModified("status"),
      order.status,
      order.status !== "success",
      order["__v"]
    );
    if (order.isModified("status") && order.status !== "success") {
      await order.populate("owner");
      let owner = order.owner;
      if (!owner) {
        owner = {
          email: order.email,
          fullName: order.receiverName,
          gender: order.gender,
          phone: order.phone,
          address: order.address,
        };
      }
      const customer = await Customer.findOne({ email: owner.email });
      if (!customer) {
        const customer = new Customer({
          email: owner.email,
          fullName: owner.fullName,
          status: "contact",
          gender: owner.gender,
          phone: owner.phone,
          address: owner.address,
          updatedBy: "000000000000",
        });
        await customer.save({ validateModifiedOnly: true });
      } else {
        if (customer.status === "contact") {
          customer.status = "potential";
          customer.updatedBy = "000000000000";
          await customer.save({ validateModifiedOnly: true });
        }
      }
    }
    next();
  } catch (error) {
    console.log("rm: ", error);
  }
}); //when order.status !== success, create customer or customer.status === potential

orderSchema.pre("save", async function (next) {
  try {
    if (!this.saler) {
      const salerRole = await Role.findOne({ name: "saler" });

      const salers = await User.find({ role: salerRole._id });

      let min = 1000000;
      let minSaler = salers[0];
      for (const sale of salers) {
        const saler = await sale.populate({ path: "orders" });
        if (min > saler.orders.length) {
          min = saler.orders.length;
          minSaler = sale;
        }

        this.saler = minSaler;
        console.log(this.saler);
      }
    }
    next();
  } catch (error) {}
}); //auto asssign

orderSchema.pre("save", async function (next) {
  try {
    const order = this;
    // console.log("++++++");
    // console.log(
    //   "order",
    //   order.isModified("status"),
    //   order.status,
    //   order.status === "success"
    // );
    if (order.isModified("status") && order.status === "success") {
      await order.populate("owner");
      const owner = order.owner;
      const savedOrder = order;
      if (owner) {
        //Send email confirm
        const dataEmail = {
          from: "Excited User <me@samples.mailgun.org>",
          to: `${savedOrder.email}`,
          subject: `Fwd: Đơn hàng #${savedOrder?._id} giao hàng thành công`,
          html: `
          <div>
            <h2>
              Cảm ơn quý khách ${savedOrder?.receiverName} đã mua hàng tại KULI
              Shopping online
            </h2>
            <p>
              Kuli rất vui thông báo đơn hàng #${savedOrder?._id} của quý khách đã
              hoàn thành. Nếu quý khách có nhu cầu feedback về sản phẩm thì hãy ấn
              vào link bên dưới
            </p>
            <button>http://localhost:5000</button>
            <h3>THÔNG TIN ĐƠN HÀNG</h3><hr>
            <h4>Phương thức thanh toán: Thanh toán bằng tiền mặt khi nhận hàng</h4>
            <h4>Phí vận chuyển: 0đ</h4>
            <h4>Tổng giá trị đơn hàng: ${savedOrder.totalCost}đ</h4>
            <h4>Địa chỉ giao hàng:</h4>
            <p>${savedOrder?.receiverName}</p>
            <p>${savedOrder?.email}</p>
            <p>${savedOrder?.address}</p>
            <p>${savedOrder?.phone}</p>
            <h2>Trạng thái: ĐÃ HOÀN THÀNH</h2>
          </div>
      `,
        };
        sendEmail(dataEmail);

        //Customer
        const customer = await Customer.findOne({ email: owner.email });
        customer.status = "customer";
        await customer.save({ validateModifiedOnly: true });
      } else {
        //Send email confirm
        console.log("send email from guest");
        const dataEmail = {
          from: "Excited User <me@samples.mailgun.org>",
          to: `${savedOrder.email}`,
          subject: `Fwd: Đơn hàng #${savedOrder?._id} giao hàng thành công`,
          html: `
                    <div>
                      <h2>
                        Cảm ơn quý khách ${savedOrder?.receiverName} đã mua hàng tại KULI
                        Shopping online
                      </h2>
                      <p>
                        Kuli rất vui thông báo đơn hàng #${savedOrder?._id} của quý khách đã
                        hoàn thành. Nếu quý khách muốn mua sách lần nữa thì hãy đến cửa hàng
                        của chúng tôi liền nha <3
                      </p>
                      <h3>THÔNG TIN ĐƠN HÀNG</h3><hr>
                      <h4>Phương thức thanh toán: Thanh toán bằng tiền mặt khi nhận hàng</h4>
                      <h4>Phí vận chuyển: 0đ</h4>
                      <h4>Tổng giá trị đơn hàng: ${savedOrder.totalCost}đ</h4>
                      <h4>Địa chỉ giao hàng:</h4>
                      <p>${savedOrder?.receiverName}</p>
                      <p>${savedOrder?.email}</p>
                      <p>${savedOrder?.address}</p>
                      <p>${savedOrder?.phone}</p>
                      <h2>Trạng thái: ĐÃ HOÀN THÀNH</h2>
                    </div>
                  `,
        };
        sendEmail(dataEmail);

        //Guest
        console.log("here");
        const customer = await Customer.findOne({ email: order.email });
        console.log("check: ", customer);
        customer.status = "customer";
        await customer.save({ validateModifiedOnly: true });
      }
    }
    next();
  } catch (error) {
    console.log(error);
  }
});

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
