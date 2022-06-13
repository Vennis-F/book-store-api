const auth = require("../middlewares/auth")
const authorize = require("../middlewares/authorize")
const User = require("../models/user")
const Role = require("../models/role")
const { isValidUpdate } = require("../utils/valid")
const Cart = require("../models/cart")
const router = require("express").Router()

//POST /checkout (not check exist cart or cart empty)
router.post("/", auth, authorize("guest", "customer"), async (req, res) => {
  try {
    //Check all cart item is valid
    //Check lại vì trong lúc mình đặt hàng có thể đã hết hàng
    const cart = await Cart.findOne({ owner: req.user._id })

    const isValidCartItem = cart.items.every((item) => {
      item.populate("productInfo")
      console.log(item.quantity, item.productInfo.quantity)
      return item.quantity >= item.productInfo.quantity
    })

    console.log(isValidCartItem)
    //Create order
  } catch (error) {}
})
