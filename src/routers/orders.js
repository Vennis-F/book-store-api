const { auth } = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const User = require("../models/user");
const { isValidUpdate } = require("../utils/valid");
const Order = require("../models/order");
const Role = require("../models/role");
const {
  lstOrderPopulateOrderItem,
  orderPopulateOrderItem,
} = require("../utils/order");
const Product = require("../models/product");
const router = require("express").Router();

const getRoleCode = async (name) => {
  return (await Role.findOne({ name })).code;
};

//GET /orders/me (get all orders of user) - me
router.get("/me", auth, authorize("customer"), async (req, res) => {
  try {
    let orders = await Order.find({ owner: req.user._id });

    if (orders.length !== 0) orders = await lstOrderPopulateOrderItem(orders);
    console.log(orders);
    res.send(orders);
  } catch (e) {
    res.status(500).send(e);
  }
});

//GET /orders/me/:id (get order detail by order id) -me
router.get("/me/:id", auth, authorize("customer"), async (req, res) => {
  try {
    let order = await Order.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    //Check order exist
    if (!order) return res.sendStatus(404);

    order = await orderPopulateOrderItem(order);
    res.send(order);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(500).send(e);
  }
});

//PATCH /orders/me/:id
// router.patch("/");

//DELETE /orders/me/:id
//DELETE /cart/empty
router.delete("/order/:id", auth, authorize("customer"), async (req, res) => {
  try {
    let order = await Order.find({ owner: req.user._id });

    //Không tìm thấy order
    if (!order) return res.status(404).send({ error: "Order not found!" });

    //Check submitted order
    if (order.status !== "submitted")
      return res
        .status(400)
        .send({ error: "Không thể cancel vì order không ở status submitted" });

    //Trả lại quantity cho products
    orderPopulateOrderItem(order);
    for (let i = 0; i < order.items.length; i++) {
      const productId = order.items[i].product._id;
      const quantity = order.items[i].quantity;
      const productDBQuantity = order.items[i].product.quantity;

      //Update...
      await Product.findByIdAndUpdate(productId, {
        quantity: quantity + productDBQuantity,
      });
    }

    //Change status to cancel
    order.status = "cancelled";
    await order.save();
    res.status(200).send(order);
  } catch (error) {
    res.status(500).send({ error });
  }
});

// //GET /orders/:id (get all by user id - saler id) - saleManager
// router.get("/:id", auth, authorize("sale", "saleManager"), async (req, res) => {
//   try {
//     //Check idUser exist
//     const user = await User.findById(req.params.id);
//     if (!user) return res.status(404).send({ error: "Cannot find user" });

//     const roleCode = req.role;
//     let query = {};
//     if ((await getRoleCode("sale")) === roleCode) {
//       query = { saler: req.params.id };
//     } else if ((await getRoleCode("saleManager")) === roleCode) {
//       query = { owner: req.params.id };
//     }

//     const orders = await Order.find(query);
//     res.send(orders);
//   } catch (e) {
//     if (e.name === "CastError" && e.kind === "ObjectId")
//       return res.status(400).send({ error: "Invalid ID" });
//     res.status(500).send(e);
//   }
// });

// //GET /orders/orderdetail/:id (get order detail by order id) - saleManager
// router.get(
//   "/orderdetail/:id",
//   auth,
//   authorize("sale", "saleManager"),
//   async (req, res) => {
//     try {
//       const orders = await Order.findById(req.params.id);

//       //Check order exist
//       if (!orders) return res.sendStatus(404);

//       res.send(orders);
//     } catch (e) {
//       if (e.name === "CastError" && e.kind === "ObjectId")
//         return res.status(400).send({ error: "Invalid ID" });
//       res.status(500).send(e);
//     }
//   }
// );

//PATCH /orders/status/:id
//PATCH /orders/saler/:id

module.exports = router;
