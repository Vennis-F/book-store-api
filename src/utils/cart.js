const Cart = require("../models/cart");

//Get exist cart or get new cart
const getCartorNewCart = async (user) => {
  let cart = await Cart.findOne({ user });
  if (!cart) {
    cart = new Cart({ user });
    await cart.save();
  }
  return cart;
};

//Check enough quantity of product: return quantity need
const cEnoughQuantity = (qProduct, qNeed) => {
  if (qProduct < qNeed)
    throw new Error(
      `Số lượng sản phẩm không đủ (chỉ còn ${qProduct} sản phẩm)`
    );
  return qNeed;
};

//Increase cart item quantity
const uCartItem = (cart, productId, qProduct, qNeed) => {
  cart.items.forEach((item) => {
    if (item.product.toString() === productId) {
      //Update cart item quantity
      item.quantity = cEnoughQuantity(qProduct, qNeed + item.quantity);
    }
  });
};

const calcTotalAmount = (cart) =>
  cart.items.reduce(
    (total, { quantity, amount }) => total + quantity * amount,
    0
  );

//Add new cart item
const addCartItem = (cart, product, qNeed) => {
  //Case: Cart item is not exist, Add new cart item
  const cartItem = {
    title: product.title,
    quantity: qNeed,
    amount: product.salePrice,
    totalAmount: 0,
    product: product._id,
  };

  cart.items.push({ ...cartItem });
};

//
const getProductId = (cart, idCartItem) => {
  let productId = "";
  cart.items.forEach((item) => {
    console.log(item._id.toString(), idCartItem);
    if (item._id.toString() === idCartItem) return (productId = item.product);
  });
  if (productId) return productId;
  throw new Error("Invalid key");
};

//Check enough cart item quantity: return [] nếu đủ, [...] nếu có lỗi
const isValidCartItem = async (cart) => {
  let msgNotEQuantity = [];

  for (let i = 0; i < cart.items.length; i++) {
    await cart.populate({ path: `items.${i}.product`, model: "product" });
    const product = cart.items[i].product;
    const qProduct = product.quantity;
    const qNeed = cart.items[i].quantity;
    if (qProduct < qNeed) {
      msgNotEQuantity.push(
        `Sách ${product.title} chỉ còn (${qProduct} sản phẩm)`
      );
    }
  }

  return msgNotEQuantity;
};

module.exports = {
  isValidCartItem,
  getCartorNewCart,
  cEnoughQuantity,
  uCartItem,
  addCartItem,
  calcTotalAmount,
  getProductId,
};
