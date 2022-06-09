const router = require("express").Router()
const auth = require("../middlewares/auth")
const authorize = require("../middlewares/authorize")
const Cart = require("../models/cart")
const Product = require("../models/product")

const getCartorNewCart = async (owner) => {
  let cart = await Cart.findOne({ owner })
  if (!cart) {
    cart = new Cart({ owner })
    await cart.save()
  }
  return cart
}

//!!!!!!!!!!!
// CREATE CART: POST /cart, get /cart
// CHECK CART EMPTY: left
// POST /cart: check vụ database có enough không thì để frontend check
// Trong cart, mà item lỡ có sài update price hay title thì handle như thế nào.
// product muốn status true: thì phải set nó thành true
/*FLOW quantity:
- đối với cart thì check quantity
- đối với order thì cũng check lại lần nữa(vì trong quá trình ở cart 
có thể user khác đã cướp mất vc) VÀ trừ quantity nữa
FLOW totalAmount:
- post và patch thì sẽ tăng số lượng
- delete giảm số lượng
*/
//---------------

//POST /cart_bulk (Add items to cart)

//POST /cart (Add item to cart - not check cart item duplicated)
router.post("/", auth, authorize("guest", "customer"), async (req, res) => {
  try {
    //Find and Check cart exist, if not create new
    let cart = await getCartorNewCart(req.user._id)
    console.log(cart)

    //Check product exist and Check product available
    const product = await Product.findById(req.body.productId)
    if (!product)
      return res.status(404).send({
        error: `Product not found`,
      })
    if (!product.status || product.quantity === 0)
      return res.status(400).send({
        error: "Product is not available or quantity is only 0 ",
      })

    //Check enough quantity of product: (từ 1 trở lên)
    const quantity = req.body.quantity
    if (product.quantity < quantity)
      return res.status(400).send({
        error: `Quantity is not enough (only ${product.quantity} left)`,
      })

    //Sum total amount
    // const totalAmount2 = cart.items.reduce(
    //   (total, { quantity, amount }) => total + quantity * amount
    // )

    //Add cart item
    const totalAmount = cart.totalAmount + product.salePrice * quantity
    const cartItem = {
      title: product.title,
      quantity,
      amount: product.salePrice,
      productInfo: req.body.productId,
    }
    cart.totalAmount = totalAmount
    cart.items.push({ ...cartItem })

    //Saved cart
    const cartSaved = await cart.save()
    res.status(201).send(cartSaved)
  } catch (e) {
    if (e.name === "CastError" && e.kind === "ObjectId")
      return res.status(400).send({ error: "Invalid ID" })
    res.status(400).send(e.message)
  }
})

//PATCH /cart (Update cart quantity)
router.patch("/", auth, authorize("guest", "customer"), async (req, res) => {
  try {
    //Check cart exist
    let cart = Cart.findOne({ owner: req.user._id })
    if (!cart) return res.status(404).send({ error: "Cart is empty" })

    //Add item to cart (if item not exist)
    const product = await Product.findById(req.body.productId)
    const quantity = req.body.quantity
    const cartItem = {
      title: product.title,
      quantity,
      amount: product.salePrice,
      productInfo: req.body.productId,
    }
    cart.items.push({ ...cartItem })

    //Saved cart
    const cartSaved = await cart.save()
    res.status(201).send(cartSaved)
  } catch (e) {
    res.status(400).send(e)
  }
})

//GET /cart
router.get("/", auth, authorize("guest", "customer"), async (req, res) => {
  try {
    //Get cart or new cart and Check cart empty
    let cart = await getCartorNewCart(req.user._id)
    console.log(cart)
    if (cart.items.length === 0) throw new Error("Cart is empty")

    res.status(200).send(cart)
  } catch (e) {
    res.status(404).send({ error: e.message })
  }
})

//DELETE /cart/:key (Delete cart item)
router.delete("/", auth, authorize("guest", "customer"), async (req, res) => {
  try {
    //Find cart and check cart item empty
    let cart = await Cart.findOne({ owner: req.user._id })
    const lCartItems = cart.items.length
    if (lCartItems === 0)
      return res.status(404).send({ error: "Cart is empty" })

    //delete cart item
    cart.items.filter((i) => i !== i._id)
    if (lCartItems === cart.items.length)
      res.status(400).send({ error: "Cart item id not found" })

    //Saved cart
    await cart.save()
    res.status(200).send(cart)
  } catch (e) {
    res.status(500).send(e)
  }
})

//DELETE /cart/empty
router.delete(
  "/empty",
  auth,
  authorize("guest", "customer"),
  async (req, res) => {
    try {
      let cart = await getCartorNewCart(req.user._id)

      //Empty cart
      cart.items = []
      await cart.save()
      res.status(200).send(cart)
    } catch (e) {
      res.status(500).send(e)
    }
  }
)

module.exports = router
