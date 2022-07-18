const router = require("express").Router();
const { auth } = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const Customer = require("../models/customer");
const Role = require("../models/role");
const User = require("../models/user");
const { isValidUpdate } = require("../utils/valid");

//POST /customers
router.post("/", auth, authorize("marketing"), async (req, res) => {
  const customer = new Customer(req.body);
  customer.updatedBy = req.user._id;
  try {
    await customer.save();
    res.status(201).send(customer);
  } catch (error) {
    console.log(error.message);
    res.status(400).send({ error: error.message });
  }
});

//GET /customers
//Customer lists
//filter : status
//status=...
//sortable: fullName, email, phone, status
//sortedBy=fullName_desc //sortedBy=status_asc
router.get("/", auth, authorize("marketing"), async (req, res) => {
  try {
    const { fullName, email, phone, status, sortedBy, limit, page } = req.query;
    const match = {};
    const sort = { createdAt: -1 };
    const options = { sort };

    //filter
    if (status) {
      let allowedStatus = ["contact", "potential", "customer"];
      const isValid = allowedStatus.includes(status);
      if (isValid) {
        match.status = status;
      }
    }

    //sort
    if (sortedBy) {
      const parts = sortedBy.split("_"); // param: sortedBy=phone_desc
      sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
      options.sort = sort;
    }

    //Paging
    if (limit) options.limit = parseInt(limit);
    if (page) options.skip = parseInt(limit) * (parseInt(page) - 1);

    const customers = await Customer.find(match, null, options);
    const count = await Customer.count(match);

    for (const customer of customers) {
      customer.history = undefined;
    }

    res.send({ customers, count });
  } catch (e) {
    res.status(500).send(e);
  }
});

//GET /customers/search/?search=...
//search by fullName
//search by email
//search by phone
//Pagination:            ?limit=...&page=...

router.post("/search", auth, authorize("marketing"), async (req, res) => {
  let { search, limit, page } = req.body;
  const options = {};

  try {
    //Paging
    if (limit) options.limit = parseInt(limit);
    else {
      limit = 5;
    }
    if (page) options.skip = parseInt(limit) * (parseInt(page) - 1);
    else {
      page = 1;
      options.skip = parseInt(limit) * (parseInt(page) - 1);
    }

    const searchResult = [];
    const checkByEmail = [];

    let fullName = new RegExp(search, "gi");
    const customers = await Customer.find({ fullName }, null, options);
    for (const customer of customers) {
      customer.history = undefined;
      if (checkByEmail.length >= parseInt.limit) break;
      if (!checkByEmail.includes(customer.email)) {
        checkByEmail.push(customer.email);
        searchResult.push(customer);
      }
    }

    if (checkByEmail.length < limit - 1) {
      let email = new RegExp(search, "gi");
      const customers = await Customer.find({ email }, null, options);
      for (const customer of customers) {
        customer.history = undefined;
        if (checkByEmail.length >= parseInt.limit) break;
        if (!checkByEmail.includes(customer.email)) {
          checkByEmail.push(customer.email);
          searchResult.push(customer);
        }
      }
    }

    if (checkByEmail.length < limit - 1) {
      let phone = new RegExp(search, "gi");
      const customers = await Customer.find({ phone }, null, options);
      for (const customer of customers) {
        customer.history = undefined;
        if (checkByEmail.length >= parseInt.limit) break;
        if (!checkByEmail.includes(customer.email)) {
          checkByEmail.push(customer.email);
          searchResult.push(customer);
        }
      }
    }

    res.send(searchResult);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//GET /customers/:id
router.get("/:id", auth, authorize("marketing"), async (req, res) => {
  try {
    let customer = await Customer.findById(req.params.id);
    if (!customer) return res.sendStatus(404);

    console.log(customer);
    res.send(customer);
  } catch (e) {
    console.log(e);
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(500).send(e);
  }
});

//PATCH /customers/:id
router.patch("/:id", auth, authorize("marketing"), async (req, res) => {
  const updates = Object.keys(req.body);
  const allowUpdateds = ["email", "fullName", "gender", "phone", "address"]; //auto update updateBy

  if (!isValidUpdate(updates, allowUpdateds))
    return res.status(400).send({ error: "Invalid updates" });

  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.sendStatus(404);

    updates.forEach((update) => {
      customer[update] = req.body[update];
    });
    customer.updatedBy = req.user._id;

    console.log(customer);

    await customer.save();

    res.send(customer);
  } catch (e) {
    console.log(e);
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(400).send({ error: e.message });
  }
});

//DELETE /customers/:id
router.delete("/:id", auth, authorize("marketing"), async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).send();

    res.send(customer);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
