const Cart = require("../models/cart")

//Get exist cart or get new cart
const getCartorNewCart = async (owner) => {
  let cart = await Cart.findOne({ owner })
  if (!cart) {
    cart = new Cart({ owner })
    await cart.save()
  }
  return cart
}

//Check enough quantity of product: return quantity need
const cEnoughQuantity = (qProduct, qNeed) => {
  if (qProduct < qNeed)
    throw new Error(`Quantity is not enough (only ${qProduct} left)`)
  return qNeed
}

//Increase cart item quantity
const uCartItem = (cart, productId, qProduct, qNeed) => {
  cart.items.forEach((item) => {
    if (item.productInfo.toString() === productId) {
      cart.totalAmount -= item.quantity * item.amount
      item.quantity = cEnoughQuantity(qProduct, item.quantity + qNeed)
      cart.totalAmount += item.quantity * item.amount
    }
  })
}

const calcTotalAmount = (cart) =>
  cart.items.reduce(
    (total, { quantity, amount }) => total + quantity * amount,
    0
  )

//Add new cart item
const addCartItem = (cart, product, qNeed) => {
  //Case: Cart item is not exist, Add new cart item
  const totalAmount = cart.totalAmount + product.salePrice * qNeed
  const cartItem = {
    title: product.title,
    quantity: qNeed,
    amount: product.salePrice,
    productInfo: product._id,
  }
  cart.totalAmount = totalAmount
  cart.items.push({ ...cartItem })
}

//
const getProductId = (cart, idCartItem) => {
  let productId = ""
  cart.items.forEach((item) => {
    if (item._id.toString() === idCartItem)
      return (productId = item.productInfo)
  })
  if (productId) return productId
  throw new Error("Invalid key")
}

module.exports = {
  getCartorNewCart,
  cEnoughQuantity,
  uCartItem,
  addCartItem,
  calcTotalAmount,
  getProductId,
}
