const auth = require("../middlewares/auth")
const authorize = require("../middlewares/authorize")
const User = require("../models/user")
const bcrypt = require("bcryptjs")
const { resetPassword } = require("../emails/account")
const Role = require("../models/role")
const router = require("express").Router()

//POST /user/register
router.post("/register", async (req, res) => {
  const role = await Role.findOne({ name: "customer" })
  const user = new User({
    ...req.body,
    role: role._id,
  })

  try {
    const token = await user.generateAuthToken()
    res.status(201).send({ user, token })
  } catch (error) {
    res.status(400).send(error)
  }
})

//POST /user/login
router.post("/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password)
    const token = await user.generateAuthToken()

    res.send({ user, token })
  } catch (e) {
    res.status(400).send(e.message)
  }
})

//POST /user/logout
router.post("/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    )
    await req.user.save({ validateModifiedOnly: true })

    res.send()
  } catch (e) {
    console.log(e)
    res.status(500).send()
  }
})

//POST /logoutAll
router.post("/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = []
    await req.user.save({ validateModifiedOnly: true })

    res.send()
  } catch (e) {
    console.log(e)
    res.status(500).send()
  }
})

//GET /user/profile
router.get(
  "/profile",
  auth,
  authorize("customer", "marketing", "sale", "saleManager", "admin"),
  async (req, res) => {
    res.send({ user: req.user, role: req.role })
  }
)

//GET /user (get all users)
router.get("/", auth, async (req, res) => {
  try {
    const users = await User.find({})
    res.send(users)
  } catch (e) {
    res.status(500).send(e)
  }
})

//PATCH  /user/profile (only update "fullName", "gender", "phone", "address" !!!not have avatar)
router.patch("/profile", auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const allowUpdateds = ["fullName", "gender", "phone", "address"]

  //Check valid update
  const isValid = updates.every((update) => allowUpdateds.includes(update))
  if (!isValid) return res.status(400).send({ error: "Invalid updates" })

  try {
    //Update user
    updates.forEach((update) => (req.user[update] = req.body[update]))
    await req.user.save({ validateModifiedOnly: true })

    res.send(req.user)
  } catch (error) {
    res.status(400).send({ error: error.message })
  }
})

//PATCH  /user/password (check empty bằng frontend)
router.patch("/password", auth, async (req, res) => {
  try {
    const { confirm, currPassword, newPassword } = req.body

    //Check current password
    const checkPwd = await bcrypt.compare(currPassword, req.user.password)
    if (!checkPwd)
      return res.status(400).send({ error: "Password is incorrect" })

    //Check newPassword === confirm
    if (newPassword !== confirm)
      return res.status(400).send({ error: "New password not same as confirm" })

    //Compare password to old password
    const isMatch = await bcrypt.compare(newPassword, req.user.password)
    if (isMatch)
      return res
        .status(400)
        .send({ error: "New password is same old password" })

    //Change new password
    req.user.password = newPassword
    await req.user.save()
    res.send(req.user)
  } catch (e) {
    res.status(500).send()
  }
})

//POST / user / forgotten
router.post("/forgotten", auth, async (req, res) => {
  resetPassword(req.body.email)
  res.send()
})

//PATCH  /user/deactive
//DELETE /user

module.exports = router
