const { auth } = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const Product = require("../models/product");
const router = require("express").Router();
const { isValidUpdate, updatesFilter } = require("../utils/valid");

//POST /products
router.post("/", auth, authorize("marketing"), async (req, res) => {
  const product = new Product({ ...req.body });
  try {
    const productSaved = await product.save();
    res.status(201).send(productSaved);
  } catch (e) {
    res.status(400).send(e);
  }
});

//GET /products?featured=true
router.get("/", async (req, res) => {
  const { feartured, limit, page, sortBy, publicDate, status } = req.query;
  const match = {};
  const sort = { "briefInformation.publicDate": -1 };
  const options = {
    limit: 12,
    skip: 0,
    sort,
  };

  //Product fearture
  if (feartured) {
    match.feartured = feartured === "true";
  }
  //Product status
  if (feartured) {
    match.status = status === "true";
  }

  //Paging
  if (limit) options.limit = parseInt(limit);
  if (page) options.skip = parseInt(limit) * (parseInt(page) - 1);
  if (publicDate) {
    sort["briefInformation.publicDate"] = publicDate === "desc" ? -1 : 1;
  }

  try {
    console.log(match, options);
    const products = await Product.find(match, null, options);
    res.send(products);
  } catch (e) {
    res.status(500).send();
  }
});

//GET /products/category/
router.get("/category/:categoryId", async (req, res) => {
  const cateId = req.params.categoryId;
  const { limit, page, sortBy, publicDate } = req.query;
  const match = { category: cateId };
  const sort = { "briefInformation.publicDate": -1 };
  const options = {
    limit: 12,
    skip: 0,
    sort,
  };

  //Paging
  if (limit) options.limit = parseInt(limit);
  if (page) options.skip = parseInt(limit) * (parseInt(skip) - 1);
  if (publicDate) {
    sort["briefInformation.publicDate"] = publicDate === "desc" ? -1 : 1;
  }
  console.log(match);

  try {
    //Find and Check product exist:
    const product = await Product.find(match, null, options);
    res.send(product);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(500).send(e);
  }
});

//GET /products/:id
router.get("/:id", async (req, res) => {
  try {
    //Find and Check product exist:
    const product = await Product.findById(req.params.id);
    if (!product) return res.sendStatus(404);

    res.send(product);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(500).send(e);
  }
});

// //GET /products/category/:id
// router.get("/category/:id", async (req, res) => {
//   const cateId = req.body.categoryId;

//   try {
//     //Find and Check product exist:
//     const product = await Product.findOne({
//       _id: req.params.id,
//       category: cateId,
//     });
//     if (!product) return res.sendStatus(404);

//     res.send(product);
//   } catch (e) {
//     if (e.name === "CastError" && e.kind === "ObjectId")
//       return res.status(400).send({ error: "Invalid ID" });
//     res.status(500).send(e);
//   }
// });

//PATCH /categories/:id (ALL field)

router.patch("/:id", auth, authorize("marketing"), async (req, res) => {
  let updates = updatesFilter(req.body);
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
  ];
  if (!isValidUpdate(updates, allowUpdateds))
    return res.status(400).send({ error: "Invalid updates" });

  try {
    //Find and Check product exist:
    const product = await Product.findById(req.params.id);
    if (!product) return res.sendStatus(404);

    //Update product
    updates.forEach((update) => (product[update] = req.body[update]));

    //Update product brief inforamtion
    if (Object.keys(req.body).includes("briefInformation")) {
      const briefs = Object.keys(req.body["briefInformation"]);
      briefs.forEach(
        (brief) =>
          (product["briefInformation"][brief] =
            req.body["briefInformation"][brief])
      );
    }

    await product.save({ validateModifiedOnly: true });
    res.send(product);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(400).send(e);
  }
});

//PATCH  /products/deactive
//DELETE /products

module.exports = router;
