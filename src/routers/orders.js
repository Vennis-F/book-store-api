const auth = require("../middlewares/auth")
const authorize = require("../middlewares/authorize")
const User = require("../models/user")
const { isValidUpdate } = require("../utils/valid")
const Order = require("../models/order")
const Role = require("../models/role")
const router = require("express").Router()

const getRoleCode = async (name) => {
  return (await Role.findOne({ name })).code
}

//GET /orders/me (get all orders of user) - me
router.get("/me", auth, authorize("customer"), async (req, res) => {
  try {
    const orders = await Order.find({ owner: req.user._id })
    res.send(orders)
  } catch (e) {
    res.status(500).send(e)
  }
})

//GET /orders/:id (get all by user id - saler id) - saleManager
router.get("/:id", auth, authorize("sale", "saleManager"), async (req, res) => {
  try {
    //Check idUser exist
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).send({ error: "Cannot find user" })

    const roleCode = req.role
    let query = {}
    if ((await getRoleCode("sale")) === roleCode) {
      query = { saler: req.params.id }
    } else if ((await getRoleCode("saleManager")) === roleCode) {
      query = { owner: req.params.id }
    }

    const orders = await Order.find(query)
    res.send(orders)
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" })
    res.status(500).send(e)
  }
})

//GET /orders/orderdetail/me/:id (get order detail by order id) -me
router.get(
  "/orderdetail/me/:id",
  auth,
  authorize("customer"),
  async (req, res) => {
    try {
      const orders = await Order.findOne({
        _id: req.params.id,
        owner: req.user._id,
      })

      //Check order exist
      if (!orders) return res.sendStatus(404)

      res.send(orders)
    } catch (e) {
      if (e.name === "CastError" && e.kind === "ObjectId")
        return res.status(400).send({ error: "Invalid ID" })
      res.status(500).send(e)
    }
  }
)

//GET /orders/orderdetail/:id (get order detail by order id) - saleManager
router.get(
  "/orderdetail/:id",
  auth,
  authorize("sale", "saleManager"),
  async (req, res) => {
    try {
      const orders = await Order.findById(req.params.id)

      //Check order exist
      if (!orders) return res.sendStatus(404)

      res.send(orders)
    } catch (e) {
      if (e.name === "CastError" && e.kind === "ObjectId")
        return res.status(400).send({ error: "Invalid ID" })
      res.status(500).send(e)
    }
  }
)

//PATCH /orders/status/:id
//PATCH /orders/saler/:id

module.exports = router
