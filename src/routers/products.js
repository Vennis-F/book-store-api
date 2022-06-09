const auth = require("../middlewares/auth")
const authorize = require("../middlewares/authorize")
const Product = require("../models/product")
const router = require("express").Router()
const { isValidUpdate, updatesFilter } = require("../utils/valid")

//POST /products
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
    res.send(products)
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

//PATCH /categories/:id (ALL field)
router.patch("/:id", auth, authorize("marketing"), async (req, res) => {
  let updates = updatesFilter(req.body)
  const allowUpdateds = [
    "title",
    "listPrice",
    "salePrice",
    "quantity",
    "description",
    "feature",
    "status",
    "author",
    "publisher",
    "publicDate",
    "language",
    "pages",
    "category",
  ]
  if (!isValidUpdate(updates, allowUpdateds))
    return res.status(400).send({ error: "Invalid updates" })

  try {
    //Find and Check product exist:
    const product = await Product.findById(req.params.id)
    if (!product) return res.sendStatus(404)

    //Update product
    updates.forEach((update) => (product[update] = req.body[update]))

    //Update product brief inforamtion
    if (Object.keys(req.body).includes("briefInformation")) {
      const briefs = Object.keys(req.body["briefInformation"])
      briefs.forEach(
        (brief) =>
          (product["briefInformation"][brief] =
            req.body["briefInformation"][brief])
      )
    }

    await product.save({ validateModifiedOnly: true })
    res.send(product)
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" })
    res.status(400).send(e)
  }
})

//PATCH  /products/deactive
//DELETE /products

module.exports = router
