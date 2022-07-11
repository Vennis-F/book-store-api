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

//GET /orders/me/:id (get order detail by order id) -me
router.get("/guest/:id", async (req, res) => {
  try {
    let order = await Order.findOne({
      _id: req.params.id,
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
router.delete("/me/:id", auth, authorize("customer"), async (req, res) => {
  try {
    let order = await Order.findOne({
      owner: req.user._id,
      _id: req.params.id,
    });

    //Không tìm thấy order
    if (!order) return res.status(404).send({ error: "Order not found!" });

    //Check submitted order
    if (order.status !== "submitted")
      return res
        .status(400)
        .send({ error: "Không thể cancel vì order không ở status submitted" });

    //Trả lại quantity cho products
    await orderPopulateOrderItem(order);
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
    console.log(error);
    res.status(500).send({ error });
  }
});


      //////////////Sale Manager

//GET /orders/saleManager
// Full Order list 
// Pagination: limit, page
// sort: sortedBy = orderDate_desc, customerName_asc, totalCost, status...
// filter: from=...&to=...., saleName, status 
router.get("/saleManager", auth, authorize("saleManager"), async (req, res) => {
  try {
    const { from, to, status,saleName, sortedBy, limit, page } = req.query
    const match={}
    const sort = {}
    const options = { sort }

    //filter
    if (status) {
      let allowedStatus= ["success", "cancelled", "submitted"]
      const isValid = allowedStatus.includes(status)
      if(isValid) {
        match.status= status 
      }
    }

    if(from)
      if(to) {
        match.from= Date.parse(from)
        match.to= Date.parse(to)
      }


    //sort
    if (sortedBy) {
      sort[parts[0]]=(parts[1] === 'desc' ? -1 : 1) 
      options.sort = sort
    }

    //Paging
    if (limit) options.limit = parseInt(limit)
    if (page) options.skip = parseInt(limit) * (parseInt(page) - 1);

    const orders = await Order.find(match,null,options).populate({ path: 'saler'});

    // function compareAsc( a, b ) {
    //   if ( a.product.title < b.product.title ){
    //     return -1;
    //   }
    //   if ( a.product.title > b.product.title ){
    //     return 1;
    //   }
    //   return 0;
    // }

    // function compareDesc( a, b ) {
    //   if ( a.product.title < b.product.title ){
    //     return 1;
    //   }
    //   if ( a.product.title > b.product.title ){
    //     return -1;
    //   }
    //   return 0;
    // }

    // //sort product
    // if(sort.productName) {
    //   if(sort.productName===1)
    //     feedbacks.sort(compareAsc)
    //   else feedbacks.sort(compareDesc)
    // }

    // //product filter
    // if(product) {
    //   const sendFeedbacks=feedbacks.filter((feedback) => {
    //     if(feedback.product.title.match(new RegExp(product))) 
    //       return feedback
    //   })
    //   return res.send({ feedbacks:sendFeedbacks, count: sendFeedbacks.length });
    // }

    const count = await Order.countDocuments();
    
    res.send({ orders, count });
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(500).send(e);
  }
});

//GET /orders/orderdetail/:id (get order detail by order id) - saleManager
router.get(
  "/orderdetail/:id",
  auth,
  authorize("sale", "saleManager"),
  async (req, res) => {
    try {
      const orders = await Order.findById(req.params.id);

      //Check order exist
      if (!orders) return res.sendStatus(404);

      res.send(orders);
    } catch (e) {
      if (e.name === "CastError" && e.kind === "ObjectId")
        return res.status(400).send({ error: "Invalid ID" });
      res.status(500).send(e);
    }
  }
);

//PATCH /orders/status/:id
//PATCH /orders/saler/:id

module.exports = router;
