const { auth } = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const User = require("../models/user");
const Role = require("../models/role");
const router = require("express").Router();
const { isValidUpdate } = require("../utils/valid");

//POST /roles
router.post("/", auth, authorize("admin"), async (req, res) => {
  const role = new Role({ ...req.body });
  try {
    const roleSaved = await role.save();
    res.status(201).send(roleSaved);
  } catch (error) {
    res.status(400).send({ error });
  }
});

//POST /roles/authorize
router.post("/authorize", async (req, res) => {
  const { allowed, role } = req.body;
  try {
    const allowedPopulate = await Promise.all(
      allowed.map((roleName) => Role.findOne({ name: roleName }))
    );

    console.log(allowedPopulate);
    const isAllowed = allowedPopulate.some((item) => item.code === role);
    console.log(isAllowed);
    res.status(200).send({ isAllowed });
  } catch (error) {
    res.status(400).send({ error });
  }
});

//GET /roles
router.get("/", auth, authorize("admin"), async (req, res) => {
  try {
    const roles = await Role.find({});
    res.send(roles);
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

//PATCH /roles/:id
router.patch("/:id", auth, authorize("admin"), async (req, res) => {
  const updates = Object.keys(req.body);
  const allowUpdateds = ["code"];
  if (!isValidUpdate(updates, allowUpdateds))
    return res.status(400).send({ error: "Invalid updates" });

  try {
    //Find and Update role
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      {
        code: req.body.code,
      },
      { runValidators: true, new: true }
    );

    //Find and Check cate exist:
    if (!role) return res.sendStatus(404);

    res.send(role);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(400).send(e.message);
  }
});

module.exports = router;
