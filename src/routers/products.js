const auth = require("../middlewares/auth")
const authorize = require("../middlewares/authorize")
const Product = require("../models/product")

const router = require("express").Router()

router.post("/", auth, authorize("marketing"), async (req, res) => {
  const product = new Product({ ...req.body })
  try {
    const productSaved = await product.save()
    res.status(201).send(productSaved)
  } catch (e) {
    res.status(400).send(e)
  }
})

//GET /products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({})
    res.send(cates)
  } catch (e) {
    res.statu(500).send()
  }
})

//GET /products/:id
router.get("/:id", async (req, res) => {
  try {
    //Find and Check product exist:
    const product = await Product.findById(req.params.id)
    if (!product) return res.sendStatus(404)

    res.send(product)
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" })
    res.status(500).send(e)
  }
})

//GET /products/category/:id
router.get("/category/:id", async (req, res) => {
  const cateId = req.body.categoryId

  try {
    //Find and Check product exist:
    const product = await Product.findOne({
      _id: req.params.id,
      category: cateId,
    })
    if (!product) return res.sendStatus(404)

    res.send(product)
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" })
    res.status(500).send(e)
  }
})

//PATCH /categories/:id
router.patch("/:id", auth, authorize("admin"), async (req, res) => {
  const updates = Object.keys(req.body)
  const allowUpdateds = [
    "title",
    "listPrice",
    "salePrice",
    "quantity",
    "description",
    "features",
    "status",
  ]
  if (!isValidUpdate(updates, allowUpdateds))
    return res.status(400).send({ error: "Invalid updates" })

  try {
    //Find and Check cate exist:
    const cate = await Category.findById(req.params.id)
    if (!cate) return res.sendStatus(404)

    //Update category
    updates.forEach((update) => (cate[update] = req.body[update]))
    await cate.save({ validateModifiedOnly: true })

    res.send(cate)
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" })
    res.status(500).send(e.message)
  }
})

//PATCH  /products/deactive
//DELETE /products

module.exports = router
