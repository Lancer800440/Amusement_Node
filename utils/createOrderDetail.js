import db from "./connect-mysql.js";

export default async function createOrderDetail(orderDetail) {
  const {
    order_detail_id,
    order_id,
    product_id,
    order_quantity,
    product_price,
  } = orderDetail;
  const sql =
    "INSERT INTO `order_detail_list`(`order_detail_id`, `order_id`, `product_id`, `order_quantity`, `product_price`) VALUES (?, ?, ?, ?, ?);";

  try {
    const result = await db.query(sql, [
      order_detail_id,
      order_id,
      product_id,
      order_quantity,
      product_price,
    ]);

    console.log('create detail query', result)

    return [result[0]];
  } catch (ex) {
    return [, ex];
  }
}
