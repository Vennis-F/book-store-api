const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const Cart = require("../models/cart");
const router = require("express").Router();
const validator = require("validator");
const Order = require("../models/order");

//POST /checkout (not check exist cart or cart empty)
router.post("/", auth, authorize("guest", "customer"), async (req, res) => {
  try {
    //Check all cart item is valid
    //Check lại vì trong lúc mình đặt hàng có thể đã hết hàng
    const cart = await Cart.findOne({ owner: req.user._id });
    let isValidCartItem = true;
    let msgNotEQuantity = [];

    for (let i = 0; i < cart.items.length; i++) {
      await cart.populate({ path: `items.${i}.product`, model: "product" });
      const product = cart.items[i].product;
      const qProduct = product.quantity;
      const qNeed = cart.items[i].quantity;
      if (qProduct < qNeed) {
        isValidCartItem = false;
        msgNotEQuantity.push(
          `Sách ${product.title} chỉ còn (${qProduct} sản phẩm)`
        );
      }
    }

    //If not response 400
    if (!isValidCartItem)
      return res.status(400).send({ error: msgNotEQuantity });

    //Send status 200
    res.send();
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
});

/*FLOW PROGRAM
  CHƯA TỪNG CÓ ORDER
  - Case 1: không có order và session:
  + get: trả về 404 và undefined
  + post: tạo data, nếu sai thì bắt tạo lại, nếu đúng return data và SET SESSION
  - Case 2: Có session: (giống như là quay lại cart hay gì đó)
  + get: nhận data từ session
  + post: NO
  CÓ ORDER:
  - Case 1: có order và không có session:
  + get: lấy DATA từ order và SET SESSION
  + post: NO
  - Case 2: Có session: (giống như là quay lại cart hay gì đó)
  + get: nhận data từ session
  + post: NO
*/

//GET /checkout/receive-information
router.get(
  "/receive-information",
  auth,
  authorize("guest", "customer"),
  async (req, res) => {
    try {
      //Nếu có session
      if (req.session.receiverInfo) return res.send(req.session.receiverInfo);

      //Nếu là user, nhưng không có session: return data and setSession cho nó
      const { fullName, email, gender, phone, address } = req.user;
      const receiverInfo = { fullName, email, gender, phone, address };
      req.session.receiverInfo = receiverInfo;

      res.send(receiverInfo);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  }
);

//LƯU ĐỊA CHỈ: invalid return 400 or 500, valid return info và lưu vào session
//POST /checkout/receive-information (case all field are full)
router.post(
  "/receive-inforamation",
  auth,
  authorize("guest", "customer"),
  async (req, res) => {
    const { fullName, email, gender, phone, address, notes } = req.body;

    try {
      //Check exist
      if (!address || !phone || !fullName || !gender || !email)
        return res.sendStatus(400);

      //Check empty string
      if (
        !address.trim() ||
        !phone.trim() ||
        !fullName.trim() ||
        !phone.trim() ||
        !email.trim()
      )
        return res.sendStatus(400);

      //Check valid phoneNumber:
      if (!validator.isMobilePhone(phone.trim()))
        return res.status(400).send({ error: "Not valid phone number" });

      //Set receive information to session
      const receiverInfo = {
        address: address.trim(),
        phone,
        receiverName: receiverName.trim(),
      };
      req.session.receiverInfo = receiverInfo;

      res.send(receiverInfo);
    } catch (error) {
      res.statu(500).send({ error });
    }
  }
);

//BUTTON XÁC NHẬN THANH TOÁN, nhận DATA từ session
//POST /checkout/confirm (not check cart or session)
router.post(
  "/confirm",
  auth,
  authorize("guest", "customer"),
  async (req, res) => {
    try {
      //Check receiverInfor data exist
      if (!req.session.receiverInfo)
        return res
          .status(400)
          .send({ error: "Session receiverInfor data not exist" });

      //Check cart exist and cart.items length !== 0
      const cart = await Cart.findOne({ owner: req.user._id });
      if (!cart || cart.items.length === 0)
        return res
          .status(400)
          .send({ error: "Cart is not exist or Cart items length 0" });

      //Create overiew order
      const { address, receiverName, phone } = req.session.receiverInfo;
      const order = new Order({
        owner: req.user._id,
        address,
        receiverName,
        phone,
        totalAmount: cart.totalAmount,
        items: cart.items,
      });
      const savedOrder = await order.save();
      res.status(201).send(savedOrder);
    } catch (error) {
      res.status(400).send({ error });
    }
  }
);

//POST /checkout/confirm (not check cart or session)
router.patch(
  "/confirm",
  auth,
  authorize("guest", "customer"),
  async (req, res) => {
    try {
      //Empty cart
      await Cart.findOneAndUpdate(
        { owner: req.user._id },
        { items: [], totalAmount: 0 }
      );

      //Empty receiverInfor data
      req.session.receiverInfo = "";

      res.send();
    } catch (error) {
      res.status(400).send({ error });
    }
  }
);

module.exports = router;
