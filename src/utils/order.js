const Order = require("../models/order");

const orderPopulateOrderItem = async (order) => {
  for (let i = 0; i < order.items.length; i++) {
    await order.populate({ path: `items.${i}.product`, model: "product" });
  }
  return order;
};

const lstOrderPopulateOrderItem = async (orders) => {
  for (let i = 0; i < orders.length; i++) {
    await orderPopulateOrderItem(orders[i]);
  }
  return orders;
};
module.exports = { orderPopulateOrderItem, lstOrderPopulateOrderItem };
