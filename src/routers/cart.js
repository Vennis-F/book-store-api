const router = require("express").Router();
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const { findOneAndUpdate } = require("../models/cart");
const Cart = require("../models/cart");
const Product = require("../models/product");
const {
  getCartorNewCart,
  cEnoughQuantity,
  uCartItem,
  addCartItem,
  calcTotalAmount,
  getProductId,
} = require("../utils/cart");

//!!!!!!!!!!!
// CREATE CART: POST /cart, get /cart
// CHECK CART EMPTY: left
// POST /cart: check vụ database có enough không thì để frontend check, không check quantityNeed = 0
// Trong cart, mà item lỡ có sài update price hay title thì handle như thế nào.
// product muốn status true: thì phải set nó thành true
/*FLOW quantity:
- đối với cart thì check quantity
- đối với order thì cũng check lại lần nữa(vì trong quá trình ở cart 
có thể user khác đã cướp mất vc) VÀ trừ quantity nữa
FLOW totalAmount:
- post và patch thì sẽ tăng số lượng
- delete giảm số lượng


    // //Sum total amount
    // // const totalAmount2 = cart.items.reduce(
    // //   (total, { quantity, amount }) => total + quantity * amount
    // // )
*/
//---------------

//POST /cart_bulk (Add items to cart)

//POST /cart (Add item to cart - not check cart item duplicated)
router.post("/", auth, authorize("guest", "customer"), async (req, res) => {
  try {
    //Find and Check cart exist, if not create new
    let cart = await getCartorNewCart(req.user._id);
    console.log(cart);

    //Check product exist and Check product available
    const product = await Product.findById(req.body.productId);
    if (!product)
      return res.status(404).send({
        error: `Product not found`,
      });
    if (!product.status || product.quantity === 0)
      throw new Error("Product is not available or quantity is only 0 ");

    //Check enough quantity of product: (từ 1 trở lên)
    const qNeed = cEnoughQuantity(product.quantity, req.body.quantity);

    //Check cart duplicated
    const cartItemDuplicated = await Cart.findOne({
      _id: cart._id,
      "items.productInfo": req.body.productId,
    });
    console.log(cartItemDuplicated);

    if (cartItemDuplicated) {
      console.log(345);
      //Case: cart item is duplicated
      uCartItem(cart, req.body.productId, product.quantity, qNeed);
    } else {
      //Case: Cart item is not exist
      console.log(123);
      addCartItem(cart, product, qNeed);
    }

    //Saved cart
    const cartSaved = await cart.save();
    res.status(201).send(cartSaved);
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(400).send({ error: e.message });
  }
});

//PATCH /cart (Update cart quantity - không check case chưa có cartitem exist)
router.patch("/", auth, authorize("guest", "customer"), async (req, res) => {
  try {
    //Check cart exist
    let cart = await getCartorNewCart(req.user._id);
    if (cart.items.length === 0)
      return res.status(404).send({ error: "Cart is empty" });

    //Update cart item
    const product = await Product.findById(getProductId(cart, req.body.key));
    cart.items.forEach((item) => {
      if (item._id.toString() === req.body.key) {
        item.quantity = cEnoughQuantity(product.quantity, req.body.quantity);
        cart.totalAmount = calcTotalAmount(cart);
      }
    });

    //Saved cart
    await cart.save();
    res.status(200).send(cart);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
});

//GET /cart
router.get("/", auth, authorize("guest", "customer"), async (req, res) => {
  try {
    //Get cart or new cart and Check cart empty
    let cart = await getCartorNewCart(req.user._id);
    // if (cart.items.length === 0) throw new Error("Cart is empty")
    res.status(200).send(cart);
  } catch (e) {
    res.status(404).send({ error: e.message });
  }
});

//DELETE /cart/empty
router.delete(
  "/empty",
  auth,
  authorize("guest", "customer"),
  async (req, res) => {
    try {
      let cart = await getCartorNewCart(req.user._id);

      //Empty cart
      cart.totalAmount = 0;
      cart.items = [];
      await cart.save();
      res.status(200).send(cart);
    } catch (e) {
      res.status(500).send(e);
    }
  }
);

//DELETE /cart/:key (Delete cart item)
router.delete(
  "/:key",
  auth,
  authorize("guest", "customer"),
  async (req, res) => {
    try {
      //Find cart and check cart item empty
      let cart = await getCartorNewCart(req.user._id);
      const lCartItems = cart.items.length;
      if (lCartItems === 0)
        return res.status(404).send({ error: "Cart is empty" });

      //delete cart item and update totalAmount
      cart.items = cart.items.filter((item) => {
        const isMatch = item._id.toString() === req.params.key;
        if (isMatch) {
          cart.totalAmount -= item.quantity * item.amount;
          return false;
        }
        return true;
      });

      //Check id cart item not found
      if (lCartItems === cart.items.length)
        return res.status(400).send({ error: "Cart item id not found" });

      //Saved cart
      // await cart.save()
      res.status(200).send(cart);
    } catch (e) {
      res.status(500).send(e.message);
    }
  }
);

module.exports = router;
