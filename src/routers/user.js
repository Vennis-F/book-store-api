const { auth } = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { resetPassword } = require("../emails/account");
const Role = require("../models/role");
const { isValidUpdate } = require("../utils/valid");
const router = require("express").Router();
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

//GUEST
//POST /user/guest
router.post("/guest", async (req, res) => {
  const role = await Role.findOne({ name: "guest" });
  const userId = new ObjectId();
  req.session.guest = { _id: userId, role };
  req.session.cartGuest = {
    _id: new ObjectId(),
    totalCost: 0,
    items: [],
    user: userId,
  };

  try {
    res
      .status(201)
      .send({ guest: req.session.guest, cartGuest: req.session.cartGuest });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error.message });
  }
});

//POST /user/register
router.post("/register", async (req, res) => {
  const role = await Role.findOne({ name: "customer" });
  const user = new User({
    ...req.body,
    role: role._id,
  });

  try {
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error.message });
  }
});

//POST /user/login
router.post("/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();

    res.send({ user, token });
  } catch (error) {
    // console.log(error);
    console.log(error.message);
    res.status(400).send({ error: error.message });
  }
});

//POST /user/logout
router.post("/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    await req.user.save({ validateModifiedOnly: true });

    res.send();
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

//POST /logoutAll
router.post("/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save({ validateModifiedOnly: true });

    res.send();
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

//GET /user/profile
//"customer", "marketing", "sale", "saleManager", "admin"
router.get("/profile", auth, authorize("customer"), async (req, res) => {
  res.send({ user: req.user, role: req.role });
});

//GET /user (get all users)
router.get("/", auth, async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (e) {
    res.status(500).send(e);
  }
});

//PATCH  /user/profile (only update "fullName", "gender", "phone", "address" !!!not have avatar)
router.patch("/profile", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowUpdateds = ["fullName", "gender", "phone", "address"];

  //Check valid update
  const isValid = updates.every((update) => allowUpdateds.includes(update));
  if (!isValid) return res.status(400).send({ error: "Invalid updates" });

  try {
    //Update user
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save({ validateModifiedOnly: true });

    console.log(req.user);
    res.send(req.user);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error.message });
  }
});

//PATCH  /user/password (check empty bằng frontend)
router.patch("/new-password", auth, async (req, res) => {
  try {
    const { currPassword, newPassword, confirm } = req.body;

    //Check current password
    const checkPwd = await bcrypt.compare(currPassword, req.user.password);
    if (!checkPwd)
      return res.status(400).send({ error: "Mật khẩu cũ không đúng" });

    //Check newPassword === confirm
    if (newPassword !== confirm)
      return res
        .status(400)
        .send({ error: "Mật khẩu mới không giống mật khẩu cũ" });

    //Compare password to old password
    const isMatch = await bcrypt.compare(newPassword, req.user.password);
    if (isMatch)
      return res
        .status(400)
        .send({ error: "Mật khẩu mới giống với mật khẩu cũ" });

    //Change new password
    req.user.password = newPassword;
    await req.user.save();
    res.send(req.user);
  } catch (error) {
    console.log(error);
    return res.status(400).send({ error: error.message });
    res.status(500).send({ error });
  }
});

//PATCH /user/role/:id (userId)
router.patch("/role/:id", auth, authorize("admin"), async (req, res) => {
  const updates = Object.keys(req.body);
  const allowUpdateds = ["role"];
  if (!isValidUpdate(updates, allowUpdateds))
    return res.status(400).send({ error: "Invalid updates" });

  try {
    //Check idUser exist
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send({ error: "Cannot find user" });

    //Check idRole exist
    if (!(await Role.findById(req.body.role)))
      return res.status(404).send({ error: "Cannot find roleId" });

    //Find and Update role
    user.role = req.body.role;

    await user.save();
    res.send(user);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(400).send(e.message);
  }
});

//PATCH /user/user/:id (userId)
router.patch("/status/:id", auth, authorize("customer"), async (req, res) => {
  const updates = Object.keys(req.body);
  const allowUpdateds = ["status"];
  if (!isValidUpdate(updates, allowUpdateds))
    return res.status(400).send({ error: "Invalid updates" });

  try {
    //Find and Update user status
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
      },
      { runValidators: true, new: true }
    );

    //Find and Check cate exist:
    if (!user) return res.sendStatus(404);
    res.send(user);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(400).send(e.message);
  }
});

//POST / user / forgotten
router.post("/forgotten", auth, async (req, res) => {
  resetPassword(req.body.email);
  res.send();
});

//PATCH  /user/deactive
//DELETE /user

module.exports = router;
