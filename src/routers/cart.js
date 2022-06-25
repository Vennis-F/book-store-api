const router = require("express").Router();
const { auth } = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const { findOneAndUpdate } = require("../models/cart");
const Cart = require("../models/cart");
const Product = require("../models/product");
const User = require("../models/user");
const {
  getCartorNewCart,
  cEnoughQuantity,
  uCartItem,
  addCartItem,
  calcTotalAmount,
  getProductId,
  completeCart,
  uCartItemGuest,
  addCartItemGuest,
  updateNewProductCartItem,
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

//Khi status === false thì ko cho đặt nữa (không thông báo)
//Không đủ số lượng: cũng không cho đặt (không thông báo)
//Nếu product nào đã deactive thì không thể thêm lại được
//POST /cart/rebuy (Add items from order to cart)

router.post("/rebuy", auth, authorize("customer"), async (req, res) => {
  const jsonData = [
    {
      id: "abc",
      quantity: 1,
    },
    {
      id: "cde",
      quantity: 1,
    },
  ];
  const { lstProductOrder } = req.body;

  try {
    //Find and Check cart exist, if not create new
    let cart = await getCartorNewCart(req.user._id);

    //Check product exist and Check product available
    let lstProduct = lstProductOrder.map((product) => {
      return Product.findById(product.id);
    });
    lstProduct = await Promise.all(lstProduct);

    for (let i = 0; i < lstProduct.length; i++) {
      addCartItem(cart, product, qNeed);
      const element = array[i];
    }
    lstProduct.forEach((product) => {
      addCartItem(cart, product, qNeed);
    });

    //Check status === false
    lstProduct.if(!product.status || product.quantity === 0);
    throw new Error("Product is not available or quantity is only 0 ");

    //Check enough quantity of product: (từ 1 trở lên)
    const qNeed = cEnoughQuantity(product.quantity, req.body.quantity);

    //Check cart duplicated
    const cartItemDuplicated = await Cart.findOne({
      _id: cart._id,
      "items.product": req.body.productId,
    });
    console.log(cartItemDuplicated);

    if (cartItemDuplicated) {
      //Case: cart item is duplicated
      uCartItem(cart, req.body.productId, product.quantity, qNeed);
    } else {
      //Case: Cart item is not exist
      addCartItem(cart, product, qNeed);
    }

    //Saved cart
    const cartSaved = await cart.save({ validateModifiedOnly: true });
    res.status(201).send(cartSaved);
  } catch (e) {
    console.log(e);
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(400).send({ error: e.message });
  }
});

//POST /cart (Add item to cart - not check cart item duplicated)
router.post("/", auth, authorize("customer"), async (req, res) => {
  try {
    //Find and Check cart exist, if not create new
    let cart = await getCartorNewCart(req.user._id);

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
      "items.product": req.body.productId,
    });

    if (cartItemDuplicated) {
      //Case: cart item is duplicated
      uCartItem(cart, req.body.productId, product.quantity, qNeed);
    } else {
      //Case: Cart item is not exist
      addCartItem(cart, product, qNeed);
    }

    //Saved cart
    const cartSaved = await cart.save({ validateModifiedOnly: true });
    res.status(201).send(cartSaved);
  } catch (e) {
    console.log(e);
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(400).send({ error: e.message });
  }
});

//POST /cart (Add item to cart - not check cart item duplicated)
router.post("/guest", async (req, res) => {
  let cart = req.session.cartGuest;

  // console.log(cart);
  try {
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
    let notCartItemDuplicated = true;
    if (cart.items.length === 0) notCartItemDuplicated = true;
    else {
      notCartItemDuplicated = cart.items.every((item) => {
        console.log(item.product._id, req.body.productId);
        return item.product._id !== req.body.productId;
      });
    }

    console.log(notCartItemDuplicated);
    if (notCartItemDuplicated === false) {
      //Case: cart item is duplicated
      console.log(123);
      uCartItemGuest(cart, req.body.productId, product.quantity, qNeed);
    } else {
      //Case: Cart item is not exist
      console.log(456);
      addCartItemGuest(cart, product, qNeed);
    }

    //Fetch product information to product and id:
    completeCart(cart);
    await updateNewProductCartItem(cart);

    //Saved cart
    req.session.cartGuest = cart;
    await req.session.save();
    console.log(req.session.cartGuest);
    res.status(201).send(req.session.cartGuest);
  } catch (error) {
    console.log(error.message);
    if (error.name === "CastError" && error.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" });
    res.status(400).send({ error: error.message });
  }
});

//PATCH /cart (Update cart quantity - không check case chưa có cartitem exist)
router.patch("/", auth, authorize("customer"), async (req, res) => {
  //Body: {cartItemId, quantity}
  const { cartItemId, quantity: quantityNeed } = req.body;

  try {
    //Check cart exist
    let cart = await getCartorNewCart(req.user._id);
    if (cart.items.length === 0)
      return res.status(404).send({ error: "Cart is empty" });

    //Update cart item quantity
    const product = await Product.findById(getProductId(cart, cartItemId));
    cart.items.forEach((item) => {
      if (item._id.toString() === cartItemId) {
        item.quantity = cEnoughQuantity(product.quantity, quantityNeed);
      }
    });

    //Saved cart
    const cartSaved = await cart.save();
    res.status(200).send(cartSaved);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
});

//PATCH /cart (Update cart quantity - không check case chưa có cartitem exist)
router.patch("/guest", async (req, res) => {
  //Body: {cartItemId, quantity}
  const { cartItemId, quantity: quantityNeed } = req.body;

  try {
    //Check cart exist
    let cart = req.session.cartGuest;
    if (cart.items.length === 0)
      return res.status(404).send({ error: "Cart is empty" });

    //Update cart item quantity
    const product = await Product.findById(getProductId(cart, cartItemId));
    cart.items.forEach((item) => {
      if (item._id === cartItemId) {
        item.quantity = cEnoughQuantity(product.quantity, quantityNeed);
      }
    });

    //Saved cart
    completeCart(cart);
    req.session.cartGuest = cart;
    await req.session.save();
    console.log(req.session.cartGuest);
    res.status(200).send(req.session.cartGuest);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
});

//GET /cart
router.get("/", auth, authorize("customer"), async (req, res) => {
  try {
    //Get cart or new cart and Check cart empty
    let cart = await getCartorNewCart(req.user._id);

    //Populate product
    if (cart) {
      for (let i = 0; i < cart.items.length; i++) {
        await cart.populate({ path: `items.${i}.product`, model: "product" });
      }
    }

    // if (cart.items.length === 0) throw new Error("Cart is empty")
    res.status(200).send(cart);
  } catch (e) {
    console.log(e.message);
    res.status(404).send({ error: e.message });
  }
});

//GET /cart/guest
router.get("/guest", async (req, res) => {
  try {
    //Mỗi lần guest thì nên update lại product nhé để có số lượng quantity mới nhất
    let cart = req.session.cartGuest;
    await updateNewProductCartItem(cart);
    console.log(cart);
    req.session.cartGuest = cart;
    req.session.save();
    res.status(200).send(req.session.cartGuest);
  } catch (e) {
    console.log(e.message);
    res.status(404).send({ error: e.message });
  }
});

//DELETE /cart/empty
router.delete("/empty", auth, authorize("customer"), async (req, res) => {
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
});

//DELETE /cart/:key (Delete cart item)
router.delete("/:key", auth, authorize("customer"), async (req, res) => {
  try {
    //Find cart and check cart item empty
    let cart = await getCartorNewCart(req.user._id);
    const lCartItems = cart.items.length;
    if (lCartItems === 0)
      return res.status(404).send({ error: "Cart is empty" });

    //delete cart item and update totalAmount
    cart.items = cart.items.filter((item) => {
      return item._id.toString() !== req.params.key;
    });

    //Check id cart item not found
    if (lCartItems === cart.items.length)
      return res.status(400).send({ error: "Cart item id not found" });

    //Saved cart
    const cartSaved = await cart.save({ validateModifiedOnly: true });
    console.log(cartSaved);
    res.status(200).send(cartSaved);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

//DELETE /cart/:key (Delete cart item)
router.delete("/guest/:key", async (req, res) => {
  try {
    //Find cart and check cart item empty
    let cart = req.session.cartGuest;

    const lCartItems = cart.items.length;
    if (lCartItems === 0)
      return res.status(404).send({ error: "Cart is empty" });

    //delete cart item and update totalAmount
    cart.items = cart.items.filter((item) => {
      console.log(item._id, req.params.key, item._id !== req.params.key);
      return item._id !== req.params.key;
    });
    // console.log(cart.items);

    //Check id cart item not found
    if (lCartItems === cart.items.length)
      return res.status(400).send({ error: "Cart item id not found" });

    //Saved cart
    req.session.cartGuest = cart;
    await req.session.save();
    res.status(200).send(req.session.cartGuest);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
