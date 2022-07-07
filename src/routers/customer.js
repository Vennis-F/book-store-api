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
    res.sendStatus(201);
  } catch (e) {
    res.status(400).send(e);
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
    const {fullName, email, phone, status, sortedBy, limit, page} = req.query
    const match= {}
    const sort= {createdAt:-1}
    const options= {sort}
    
    //filter
    if(fullName) {
      match.fullName= new RegExp(fullName.trim(),'gi')
    }

    if(email) {
      match.email= new RegExp(email.trim(),'gi')
    }

    if(phone) {
      match.phone= new RegExp(phone.trim(),'gi')
    }

    if(status) {
      let allowedStatus= ["contact", "potential", "customer"]
      if(isValidUpdate(status,allowedStatus)) 
        match.status= status 
    }

    //sort
    if(sortedBy) {
      const parts = sortedBy.split('_')       // param: sortedBy=phone_desc 
      sort[parts[0]] = (parts[1] === 'desc' ? -1 : 1)
      options.sort=sort
    }

    //Paging
    if(limit) options.limit = parseInt(limit)
    if(page) options.skip= parseInt(limit) * (parseInt(page) - 1);

    const customers = await Customer.find(match,null,options).populate('updatedBy');
    res.send(customers);
    
  } catch (e) {
    res.status(500).send(e);
  }
});

//Post /customers/search/
//search by fullName     ?fullname=...
//search by email        ?email=...
//search by phone        ?phone=...
router.post('/search', auth, authorize('marketing'), async (req,res) => {
  const {fullName, email, phone} = req.query
  try {
    if(fullName) {
      let fullName= new RegExp(fullName,'gi')
      const customers = await Customer.find({fullName})
      return res.send(customers)
    }

    if(email) {
      let email= new RegExp(email,'gi')
      const customers = await Customer.find({email})
      return res.send(customers)
    }

    if(phone) {
      let phone= new RegExp(phone,'gi')
      const customers = await Customer.find({phone})
      return res.send(customers)
    }
    
  } catch (error) {
    res.status(500).send(error)
  }
})

//GET /customers/:id
router.get("/:id", auth, authorize("marketing"), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.sendStatus(404);

    res.send(customer);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(500).send(e);
  }
});

//PATCH /customers/:id
router.patch("/:id", auth, authorize("marketing"), async (req, res) => {
  const updates = Object.keys(req.body);
  const allowUpdateds = [
    "email",
    "fullName",
    "status",
    "gender",
    "phone",
    "address"
  ];    //auto update updateBy
    

  if (!isValidUpdate(updates, allowUpdateds))
    return res.status(400).send({ error: "Invalid updates" });

  try {
    const customer = await Customer.findById(req.params.id)
    
    if (!customer) 
      return res.sendStatus(404);

    updates.forEach((update) => {
        customer[update] = req.body[update]
    })
    customer.updatedBy = req.user._id
    await customer.save()

    res.send(customer);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(400).send(e.message);
  }
});

//DELETE /customers/:id
router.delete('/:id',auth, authorize('marketing'), async (req,res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id)
    if(!customer) 
      return res.status(404).send()
    
    res.send(customer)
  } catch (error) {
      res.status(500).send(error)  
  }
})


module.exports = router;
