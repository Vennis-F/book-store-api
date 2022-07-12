const router = require("express").Router();
const { auth } = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const Category = require("../models/category");
const { isValidUpdate } = require("../utils/valid");

//POST /categories
router.post("/", auth, authorize("admin"), async (req, res) => {
  const cate = new Category(req.body);
  try {
    await cate.save();
    res.sendStatus(201);
  } catch (e) {
    res.status(400).send(e);
  }
});

//GET /categories
router.get("/", async (req, res) => {
  try {
    const cates = await Category.find({});
    res.send(cates);
  } catch (e) {
    res.status(500).send();
  }
});

//GET /categories/:id
router.get("/:id", async (req, res) => {
  try {
    //Find and Check cate exist:
    const cate = await Category.findById(req.params.id);
    if (!cate) return res.sendStatus(404);

    res.send(cate);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(500).send(e);
  }
});

//PATCH /categories/:id
router.patch("/:id", auth, authorize("admin"), async (req, res) => {
  const updates = Object.keys(req.body);
  const allowUpdateds = ["name"];
  if (!isValidUpdate(updates, allowUpdateds))
    return res.status(400).send({ error: "Invalid updates" });

  try {
    //Find and Update cate
    const cate = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
      },
      { runValidators: true, new: true }
    );

    //Find and Check cate exist:
    if (!cate) return res.sendStatus(404);

    res.send(cate);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(400).send(e.message);
  }
});

//PATCH  /categories/deactive
//DELETE /categories

module.exports = router;
