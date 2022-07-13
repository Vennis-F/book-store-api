const router = require("express").Router();
const { auth } = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const Category = require("../models/category");
const Order = require("../models/order");
const Post = require("../models/post");
const Feedback= require("../models/feedback")
const { isValidUpdate } = require("../utils/valid");
const Customer = require("../models/customer");



//GET /dashboards/marketing?from=...&to=...
//startDate & endDate => from & to

//returns :
// Top 5 Post gan day : array[{}]
//Thong so cac san pham ban ra : array[{id, sold, quantity }]
//Top 5 khach hang Vip: aray[][]
//Top 5 feedback gan day: object
//Top 5 khach hang gan day : objec (co the dieu chinh thoi gian) 
router.get("/marketing", auth, authorize('marketing'), async (req, res) => {
  try {
    const {from, to} = req.query
    const match={}

    //Post gan day
    const latestPosts = await Post.find({}, null, {sort: {createdAt:-1}, limit:5});    

    //Thong So san pham ban ra (id, sold, quantity)
    const orders= await Order.find({status:{$ne: 'cancelled' }})
    
    const products=[]
    const checkProducts=[]
    for(const order of orders) {
      for (const [j,item] of order.items.entries()) {
        await order.populate({path:`items.${j}.product`})
        const id=item.product._id.toString()
        if(!checkProducts.includes(id)) {
          checkProducts.push(id)
          products.push({id:item.product._id ,sold: item.quantity, quantity: item.product.quantity})
        } else {
          let index =-1
          products.forEach((product, i) => {
            if (product.id.toString()===id) {
               index= i
               return
            }
          })
          products[index].sold+=item.quantity
        }
      }
      
    }
    
    //Thong so khach hang
    const customers=[]
    const checkCustomers=[]
    const guest={email:'guest',spend:0}
    for(const order of orders) {
      await order.populate('owner')
        const id=order.owner?._id.toString()
        if(id) {
          if(!checkCustomers.includes(id)) {
            checkCustomers.push(id)
            customers.push({email:order.owner.email ,spend: order.totalCost})
          } else {
            let index =-1
            customers.forEach((customer, i) => {
              if (customer.email===order.owner.email) {
                 index= i
                 return
              }
            })
            customers[index].spend+=order.totalCost
          }
        }
        else {
          guest.spend+=order.totalCost
        }
    } 
    customers.push(guest)  
    // const VipCustomers= Object.entries(customers).sort(([,a],[,b]) => b-a).slice(0,5)

    //Feedback gan day
    const latestFeedbacks = await Feedback.find({}, null, {sort: {createdAt:-1}, limit:5});

    //Customer gan day
    //Date Adjust
    if(from) {
      if(to){ 
        match.createdAt={$gte: Date.parse(from), 
          $lt: Date.parse(to)}
      }
    }
    const latestCustomers = await Customer.find(match,null,{sort: {createdAt:-1}, limit:5})

    res.send({latestPosts,products,customers, latestFeedbacks, latestCustomers})
    // res.send({latestPosts, products, VipCustomers, latestFeedbacks, latestCustomers});
  } catch (e) {
    res.status(500).send(e.message);
  }
});

//GET /dashboards/saler?from=...&to=...
//startDate & endDate => from & to

//returns :
//Top 5 Success Order gan day : aray[{}]
//Top 5 Order gan day : array[{}]
//Top Tong Tien thu duoc tron 7 ngay 
// -  Co the chinh ngay ?from=.&to=...
// -  Co the chinh status order ?status=...
router.get("/saler", auth, authorize("saleManager","saler"), async (req, res) => {
  try {
    const {from, to, status} = req.query
    const match={}

    //Success Order gan day
    let latestSuccessOrders
    let latestTotalOrders
    let orders

    //filter
    if(from) {
      if(to){ 
        match.createdAt={$gte: Date.parse(from), 
          $lt: Date.parse(to)}
      }
    }

    if(req.role==="R04") {
        latestSuccessOrders = await Order.find({status:'success', saler:req.user._id}, null, {sort: {createdAt:-1}, limit:5});   
        latestTotalOrders = await Order.find({saler:req.user._id}, null, {sort: {createdAt:-1}, limit:5});  
        match.status={$ne: 'cancelled' }
        match.saler=req.user._id
    } else {
        latestSuccessOrders = await Order.find({status:'success'}, null, {sort: {createdAt:-1}, limit:5});    
        latestTotalOrders = await Order.find({}, null, {sort: {createdAt:-1}, limit:5});  
        match.status={$ne: 'cancelled' }
    }
    
    //filter
    if (status) {
      let allowedStatus= ["success", "submitted"]
      const isValid = allowedStatus.includes(status)
      if(isValid) {
        match.status= status 
      }
    }


    orders= await Order.find(match)
    const revenues=[]
    const checkDates=[]
    for(const order of orders) {
      await order.populate({path:'saler'})
      const date=order.updatedAt.toISOString().split('T')[0]
      if(!checkDates.includes(date)) {
        checkDates.push(date)
        revenues.push({date: order.updatedAt ,total: order.totalCost})
      } else {
        let index =-1
        revenues.forEach((revenue, i) => {
          if (revenue.date.toISOString().split('T')[0]===date) {
            index= i
            return
          }
        })
        revenues[index].total+=order.totalCost
      }
    }
    
    res.send({latestSuccessOrders, latestTotalOrders, revenues})
  } catch (e) {
    console.log(e)
    res.status(500).send(e.message);
  }
});
module.exports = router;
