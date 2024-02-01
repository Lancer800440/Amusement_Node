import db from "./connect-mysql.js";

export default async function createOrder(order) {
  const {
    order_id,
    user_id,
    recipient_name,
    recipient_email,
    recipient_phone,
    recipient_tel,
    bill_id,
    userpay_id,
    ibon_id,
    recipient_address_id,
    address_detail,
  } = order;
  const sql =
    "INSERT INTO `order_list`(`order_id`, `user_id`, `recipient_name`, `recipient_email`, `recipient_phone`, `recipient_tel`, `bill_id`, `userpay_id`, `ibon_id`, `recipient_address_id`, `address_detail`, `order_date`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW() );";

  try {
    const result = await db.query(sql, [
      order_id,
      user_id,
      recipient_name,
      recipient_email,
      recipient_phone,
      recipient_tel,
      bill_id,
      userpay_id,
      ibon_id,
      recipient_address_id,
      address_detail,
    ]);

    return [result[0]];
  } catch (ex) {
    return [, ex];
  }
}
