const { Mongoose, default: mongoose } = require("mongoose");
const { auth } = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const Feedback = require("../models/feedback");
const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");
const router = require("express").Router();
const { isValidUpdate, updatesFilter } = require("../utils/valid");

//////Common

//POST /feedbacks/product/:productID
router.post("/product/:productID", async (req, res) => {
  const feedback = new Feedback({ ...req.body });

  try {
    const product = await Product.findById(req.params.productID);
    if (!product) return res.status(404).send();

    feedback.product = product._id;
    const userInfo = await User.findOne({ email: feedback.user.email });
    if (userInfo) {
      feedback.user.userAccount = userInfo._id;
    }

    await feedback.save();
    res.status(201).send(feedback);
  } catch (e) {
    res.status(400).send(e);
    console.log(e);
  }
});

//GET /feedbacks/product/:productID
router.get("/product/:productID", async (req, res) => {
  try {
    const feedbacks = await Feedback.find({
      product: req.params.productID,
      status: true,
    });
    res.send(feedbacks);
  } catch (e) {
    res.status(500).send();
  }
});

////////////////////Login/////////////
//POST /feedbacks/order/:orderID?productID=...
router.post(
  "/order/:orderID",
  auth,
  authorize("customer"),
  async (req, res) => {
    const { productID } = req.query;
    const feedback = new Feedback({ ...req.body });

    try {
      if (!productID) return res.status(400).send({ e: "Product id missing" });

      const order = await Order.findById(req.params.orderID);
      if (!order) return res.status(404).send({ e: "Order not found" });

      const orderProduct = order.items.filter((value) => {
        const IdProduct = new mongoose.Types.ObjectId(productID);
        if (value.product.equals(IdProduct)) return IdProduct;
      });
      if (orderProduct.length === 0)
        return res.status(404).send({ e: "Product not found in The Order" });

      const owner = await User.findById(order.owner);
      if (!owner || owner.email !== req.user.email)
        return res.status(400).send({ e: "Unauthorized" });

      feedback.order = order._id;
      feedback.product = productID;

      await feedback.save();
      res.status(201).send(feedback);
    } catch (e) {
      res.status(500).send(e);
      console.log(e);
    }
  }
);

//GET /feedbacks/order/:orderID

router.get("/order/:orderID", auth, authorize("customer"), async (req, res) => {
  try {
    const feedbacks = await Feedback.find({
      order: req.params.orderID,
      "user.userAccount": req.user._id,
    });
    res.send(feedbacks);
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

//PATCh /feedbacks/:feedbackID
router.patch("/:feedbackId", auth, authorize("customer"), async (req, res) => {
  const updates = Object.keys(req.body);
  const allowUpdateds = ["content", "star", "images"];

  if (!isValidUpdate(updates, allowUpdateds))
    return res.status(400).send({ error: "Invalid updates" });

  try {
    const feedback = await Feedback.findById(req.params.feedbackId);

    if (!feedback) return res.sendStatus(404);

    if (feedback.user.email !== req.user.email) {
      return res.sendStatus(401);
    }

    updates.forEach((update) => {
      feedback[update] = req.body[update];
    });
    await feedback.save();

    res.send(feedback);
  } catch (e) {
    res.status(400).send(e);
    console.log(e);
  }
});

//////////////////Marketing/////////////
//GET /feedbacks/marketing
//Feedback lists

//filter : star, product, status
//?star=...&product=...&status=...
//sortable: fullName, productName, star, status
//?sortedBy=fullName_desc //sortedBy=status_asc
router.get("/marketing", auth, authorize("marketing"), async (req, res) => {
  try {
    const { star, product, status, sortedBy, limit, page } = req.query;
    const fbMatch = {};
    const match = {};
    const sort = {};
    const options = { sort };

    //filter

    if (status) {
      match.status = status === "true";
    }

    if (star) {
      match.star = parseInt(star);
    }

    //sort
    if (sortedBy) {
      const parts = sortedBy.split("_"); // param: sortedBy=auhor_desc
      if (parts[0] === "fullName") {
        sort["user.name"] = parts[1] === "desc" ? -1 : 1;
      } else {
        sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
      }

      options.sort = sort;
    }

    //Paging
    if (limit) options.limit = parseInt(limit);
    if (page) options.skip = parseInt(limit) * (parseInt(page) - 1);

    const feedbacks = await Feedback.find(match, null, options).populate({
      path: "product",
      select: "title",
    });

    function compareAsc(a, b) {
      if (a.product.title < b.product.title) {
        return -1;
      }
      if (a.product.title > b.product.title) {
        return 1;
      }
      return 0;
    }

    function compareDesc(a, b) {
      if (a.product.title < b.product.title) {
        return 1;
      }
      if (a.product.title > b.product.title) {
        return -1;
      }
      return 0;
    }

    //sort product
    if (sort.productName) {
      if (sort.productName === 1) feedbacks.sort(compareAsc);
      else feedbacks.sort(compareDesc);
    }

    //product filter
    if (product) {
      const sendFeedbacks = feedbacks.filter((feedback) => {
        if (feedback.product.title.match(new RegExp(product))) return feedback;
      });
      return res.send({
        feedbacks: sendFeedbacks,
        count: sendFeedbacks.length,
      });
    }

    const count = await Feedback.countDocuments();

    res.send({ feedbacks, count });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

//GET /feedbacks/marketing/search?search=...
//search by fullName, content
//pagination          ?limit=...&page=...
router.post(
  "/marketing/search",
  auth,
  authorize("marketing"),
  async (req, res) => {
    try {
      let { limit, page, search } = req.body;
      const options = {};

      //Paging
      if (limit) options.limit = parseInt(limit);
      else {
        limit = 5;
      }
      if (page) options.skip = parseInt(limit) * (parseInt(page) - 1);
      else {
        page = 1;
        options.skip = parseInt(limit) * (parseInt(page) - 1);
      }

      const searchResult = [];
      const checkById = [];

      //search
      const name = new RegExp(search, "gi");
      const feedbacks = await Feedback.find(
        { "user.name": name },
        null,
        options
      ).populate({ path: "product" });
      for (const feedback of feedbacks) {
        if (checkById.length >= limit) break;
        if (!checkById.includes(feedback._id.toString())) {
          checkById.push(feedback._id.toString());
          searchResult.push(feedback);
        }
      }
      if (checkById.length < limit - 1) {
        const feedbacks = await Feedback.find(
          { content: new RegExp(search, "gi") },
          null,
          options
        );
        for (const feedback of feedbacks) {
          if (checkById.length >= limit) break;
          if (!checkById.includes(feedback._id.toString())) {
            checkById.push(feedback._id.toString());
            searchResult.push(feedback);
          }
        }
      }
      res.send(searchResult);
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  }
);

//GET /feedbacks/marketing/:id
router.get("/marketing/:id", auth, authorize("marketing"), async (req, res) => {
  try {
    //Find and Check post exist:

    const feeback = await Feedback.findById(req.params.id).populate({
      path: "product",
      select: "title",
    });

    if (!feeback) return res.sendStatus(404);

    res.send(feeback);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(500).send(e);
  }
});

//PATCH /feedbacks/marketing/:id
router.patch("/marketing/:id", async (req, res) => {
  const updates = Object.keys(req.body);

  const allowUpdateds = ["status"];

  if (!isValidUpdate(updates, allowUpdateds))
    return res.status(400).send({ error: "Invalid updates" });

  try {
    const feeback = await Feedback.findByIdAndUpdate(req.params.id, req.body);

    if (!feeback) return res.sendStatus(404);

    res.send(feeback);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(400).send(e.message);
  }
});

//DELETE /feedbacks/marketing/:id
router.delete(
  "/marketing/:id",
  auth,
  authorize("marketing"),
  async (req, res) => {
    try {
      const feeback = await Feedback.findByIdAndDelete(req.params.id);
      if (!feeback) return res.status(404).send();

      res.send(feeback);
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

module.exports = router;
