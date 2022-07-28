const router = require("express").Router();
const { auth } = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const Category = require("../models/category");
const Order = require("../models/order");
const Post = require("../models/post");
const Feedback = require("../models/feedback")
const { isValidUpdate } = require("../utils/valid");
const Customer = require("../models/customer");
const User = require("../models/user");
const Product = require("../models/product");



//GET /dashboards/marketing?from=...&to=...
//startDate & endDate => from & to

//returns :
// Top 5 Post gan day : array[{}]
//Thong so cac san pham ban ra : array[{id, sold, quantity }]
//Thong so khach hang: array[{email, spend}]
//Top 5 feedback gan day: object
//Top 5 khach hang gan day : array[{}] //- Co the chinh thoi gian from, to
router.get("/marketing", auth, authorize('marketing'), async (req, res) => {
  try {
    const { from, to } = req.query
    const match = {}

    //Post gan day
    const latestPosts = await Post.find({}, null, { sort: { createdAt: -1 }, limit: 5 });
    for (const post of latestPosts) {
      const author = await User.findById(post.author);
      post.author = author.fullName;
    }
    //Thong So san pham ban ra (id, sold, quantity)
    const orders = await Order.find({ status: { $ne: 'cancelled' } })

    const products = []
    const checkProducts = []
    for (const order of orders) {
      for (const [j, item] of order.items.entries()) {
        await order.populate({ path: `items.${j}.product` })
        const id = item.product._id.toString()
        if (!checkProducts.includes(id)) {
          checkProducts.push(id)
          products.push({ id: item.product._id, sold: item.quantity, quantity: item.product.quantity, product: item.product })
        } else {
          let index = -1
          products.forEach((product, i) => {
            if (product.id.toString() === id) {
              index = i
              return
            }
          })
          products[index].sold += item.quantity
        }
      }

    }

    //Thong so khach hang
    const customers = []
    const checkCustomers = []
    const guest = { email: 'guest', spend: 0 }
    for (const order of orders) {
      await order.populate('owner')
      const id = order.owner?._id.toString()
      if (id) {
        if (!checkCustomers.includes(id)) {
          checkCustomers.push(id)
          customers.push({ email: order.owner.email, spend: order.totalCost })
        } else {
          let index = -1
          customers.forEach((customer, i) => {
            if (customer.email === order.owner.email) {
              index = i
              return
            }
          })
          customers[index].spend += order.totalCost
        }
      }
      else {
        guest.spend += order.totalCost
      }
    }
    customers.push(guest)

    //Feedback gan day
    const latestFeedbacks = await Feedback.find({}, null, { sort: { createdAt: -1 }, limit: 5 });
    for (const feedback of latestFeedbacks) {
      const product = await Product.findById(feedback.product);
      feedback.product = product;
    }
    //Customer gan day
    //Date Adjust
    if (from) {
      if (to) {
        match.createdAt = {
          $gte: Date.parse(from),
          $lt: Date.parse(to)
        }
      }
    }
    const latestCustomers = await Customer.find(match, null, { sort: { createdAt: -1 }, limit: 5 })

    res.send({ latestPosts, products, customers, latestFeedbacks, latestCustomers })
    // res.send({latestPosts, products, VipCustomers, latestFeedbacks, latestCustomers});
  } catch (e) {
    res.status(500).send(e.message);
  }
});

//GET /dashboards/saler?from=...&to=...&status=...
//startDate & endDate => from & to

//returns :
//Top 5 Success Order gan day : aray[{}]
//Top 5 Order gan day : array[{}]
//Thong so Doanh thu theo ngay trong 7 ngay  : array[{date, total}]
// -  Co the chinh ngay ?from=.&to=...
// -  Co the chinh status order ?status=...
router.get("/saler", auth, authorize("saleManager", "saler"), async (req, res) => {
  try {
    const { from, to, status } = req.query
    const dateAWeekAgo = new Date()
    dateAWeekAgo.setDate(dateAWeekAgo.getDate() - 7)
    const match = { createdAt: { $gte: dateAWeekAgo, $lt: new Date() } }

    let latestSuccessOrders
    let latestTotalOrders
    let orders

    //filter

    if (from) {
      if (to) {
        match.createdAt = {
          $gte: Date.parse(from),
          $lt: Date.parse(to)
        }
      }
    }

    //Success Order gan day
    //Total Order gan day
    if (req.role === "R04") {
      latestSuccessOrders = await Order.find({ status: 'success', saler: req.user._id }, null, { sort: { createdAt: -1 }, limit: 5 });
      latestTotalOrders = await Order.find({ saler: req.user._id }, null, { sort: { createdAt: -1 }, limit: 5 });
      match.status = { $ne: 'cancelled' }
      match.saler = req.user._id
    } else {
      latestSuccessOrders = await Order.find({ status: 'success' }, null, { sort: { createdAt: -1 }, limit: 5 });
      latestTotalOrders = await Order.find({}, null, { sort: { createdAt: -1 }, limit: 5 });
      match.status = { $ne: 'cancelled' }
    }

    //filter
    if (status) {
      let allowedStatus = ["success", "submitted"]
      const isValid = allowedStatus.includes(status)
      if (isValid) {
        match.status = status
      }
    }


    orders = await Order.find(match)
    const revenues = []
    const checkDates = []
    for (const order of orders) {
      await order.populate({ path: 'saler' })
      const date = order.updatedAt.toISOString().split('T')[0]
      if (!checkDates.includes(date)) {
        checkDates.push(date)
        revenues.push({ date: date, total: order.totalCost })
      } else {
        let index = -1
        revenues.forEach((revenue, i) => {
          if (revenue.date === date) {
            index = i
            return
          }
        })
        revenues[index].total += order.totalCost
      }
    }

    res.send({ latestSuccessOrders, latestTotalOrders, revenues })
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message);
  }
});

//GET /dashboards/admin?from=...&to=...

//returns :
//Thong so Status cua Order: array[{status, count}]
//Thong so Doanh thu theo the loai : array[{category, total}]
//Top 5 khach hang vua dang ky gan day: aray[{}]
//Top 5 khach hang vua mua gan day: array[{}]
//Thong so Feedback theo the loai san pham: array[{category, avgStar}]
//Thong so order status theo Ngay:  {{date: ngay ,success: so order success ,cancelled: so order...,submitted: ...}}

router.get("/admin", auth, authorize('admin'), async (req, res) => {
  try {
    const { from, to } = req.query
    const dateAWeekAgo = new Date()
    dateAWeekAgo.setDate(dateAWeekAgo.getDate() - 7)
    const match = { createdAt: { $gte: dateAWeekAgo, $lt: new Date() } }
    //Thong so status  cac order (theo status)
    const orders = await Order.find({})

    const productStatuses = []
    const checkStatuses = []
    for (const order of orders) {
      if (!checkStatuses.includes(order.status)) {
        checkStatuses.push(order.status)
        productStatuses.push({ status: order.status, count: 1 })
      } else {
        let index = -1
        productStatuses.forEach((value, i) => {
          if (value.status === order.status) {
            index = i
            return
          }
        })

        productStatuses[index].count++
      }
    }


    //Thong so Doanh thu theo The loai san pham {category, total}
    const ordersNotCancelled = await Order.find({ status: { $ne: 'cancelled' } })

    const categories = []
    const checkCategories = []
    for (const order of ordersNotCancelled) {
      for (const [j, item] of order.items.entries()) {
        await order.populate({ path: `items.${j}.product` })
        const product = await item.product.populate('category')
        const category = product.category.name
        if (!checkCategories.includes(category)) {
          checkCategories.push(category)
          categories.push({ category: category, total: item.totalAmount })
        } else {
          let index = -1
          categories.forEach((element, i) => {
            if (element.category === category) {
              index = i
              return
            }
          })
          categories[index].total += item.totalAmount
        }
      }
    }

    // Top Khach hang moi dang ky gan day
    const newlyRegisteredCustomer = await Customer.find({}, null, { sort: { createdAt: -1 }, limit: 5 });

    // Top khach hang vua mua hang gan day
    const newlyOrder = await Order.find({}, null, { sort: { createdAt: -1 } });
    const newlyBoughtCustomer = []
    const checkCustomers = []
    let count = 0
    const limit = 5
    for (const order of newlyOrder) {
      if (count >= limit) break;
      await order.populate({ path: 'owner' })
      if (order.owner) {
        const customerEmail = order.owner.email
        if (!checkCustomers.includes(customerEmail)) {
          checkCustomers.push(customerEmail)
          newlyBoughtCustomer.push(order.owner)
        }
        count++
      }
    }

    // Thong so Feedback theo the loai san pham (category, avgStar)
    const feedbacks = await Feedback.find({ status: true })

    const feedbackStatic = []
    checkCategories.length = 0      //clear array
    for (const feedback of feedbacks) {
      await feedback.populate('product')
      await feedback.product.populate('category')
      const category = feedback.product.category.name

      if (!checkCategories.includes(category)) {
        checkCategories.push(category)
        feedbackStatic.push({ category, sumStar: feedback.star, count: 1 })
      } else {
        let index = -1
        feedbackStatic.forEach((element, i) => {
          if (element.category === category) {
            index = i
            return
          }
        })
        feedbackStatic[index].sumStar += feedback.star
        feedbackStatic[index].count++
      }
    }

    feedbackStatic.forEach((feedback) => {
      feedback.avgStar = (feedback.sumStar / feedback.count).toFixed(2)
      delete feedback.sumStar
      delete feedback.count
    })

    //Thong so order status theo Ngay  (date: ngay ,success: so order success ,cancelled: so order...,submitted: ...)

    //filter

    if (from) {
      if (to) {
        match.createdAt = {
          $gte: Date.parse(from),
          $lt: Date.parse(to)
        }
      }
    }

    const ordersBydate = await Order.find(match, null, { sort: { createdAt: -1 } })
    const orderStatics = []
    const checkDates = []
    for (const order of ordersBydate) {
      const date = order.createdAt.toISOString().split('T')[0]
      if (!checkDates.includes(date)) {
        checkDates.push(date)
        orderStatics.push({ date, success: 0, cancelled: 0, submitted: 0 })
        orderStatics.slice(-1)[0][order.status]++
      } else {
        let index = -1
        orderStatics.forEach((value, i) => {
          if (value.date === order.createdAt.toISOString().split('T')[0]) {
            index = i
            return
          }
        })
        orderStatics[index][order.status]++
      }
    }


    res.send({ productStatuses, categories, newlyRegisteredCustomer, newlyBoughtCustomer, feedbackStatic, orderStatics })
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message);
  }
});

module.exports = router;
