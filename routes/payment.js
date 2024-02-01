import express from "express";
import createCheckMac from "../utils/checkmac.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// 存取`.env`設定檔案使用
import "dotenv/config.js"; 
import dayjs from "dayjs";
import createOrder from "../utils/createOrder.js";
import createOrderDetail from "../utils/createOrderDetail.js";

const ecpay_credit_api =
  "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5";

// 註: 本路由與資料庫無關，單純轉向使用

// POST
router.post("/payment", async function (req, res, next) {
  const orderId = `ORD${uuidv4().replace(/-/g, "").slice(15)}`;
  const orderDetailId = `ORDD${uuidv4().replace(/-/g, "").slice(15)}`;
  const {
    user_id,
    recipient_name,
    recipient_email,
    recipient_phone,
    recipient_tel,
    bill_id,
    userpay_id,
    odstatus_id,
    ibon_id,
    recipient_address_id,
    address_detail,
    totalAmount = 0,
    tradeDesc = "asdf",
    itemName = "",
    orderDetail,
  } = req.body;

  console.log("telephone", recipient_tel);

  const order = await createOrder({
    order_id: orderId,
    user_id,
    recipient_name,
    recipient_email,
    recipient_phone,
    recipient_tel,
    bill_id,
    userpay_id,
    odstatus_id,
    ibon_id,
    recipient_address_id,
    address_detail,
  });

  const newOrderDetail = await createOrderDetail({
    ...orderDetail,
    order_detail_id: orderDetailId,
    order_id: orderId,
  });

  console.log("created order: ", order);
  console.log("created order detail", newOrderDetail);

  const baseParam = {
    MerchantID: "3002607",
    MerchantTradeNo: orderId,
    MerchantTradeDate: dayjs().format("YYYY/MM/DD HH:MM:ss"),
    PaymentType: "aio",
    TotalAmount: totalAmount,
    TradeDesc: tradeDesc,
    ItemName: itemName,
    ReturnURL: "http://localhost:3002/payment/callback",
    ClientBackURL: "http://localhost:3000/user/userorder",
    ChoosePayment: "Credit",
    EncryptType: 1,
  };

  const html = `
  <form action=${ecpay_credit_api} method="POST" name="payment" style="display: none;">
    <input name="MerchantID" value="${baseParam.MerchantID}"/>
    <input name="MerchantTradeNo" value="${baseParam.MerchantTradeNo}" />
    <input name="MerchantTradeDate" value="${baseParam.MerchantTradeDate}" />
    <input name="PaymentType" value="${baseParam.PaymentType}" />
    <input name="TotalAmount" value="${baseParam.TotalAmount}" />
    <input name="TradeDesc" value="${baseParam.TradeDesc}" />
    <input name="ItemName" value="${baseParam.ItemName}" />
    <input name="ReturnURL" value="${baseParam.ReturnURL}" />
    <input name="ClientBackURL" value="${baseParam.ClientBackURL}" />
    <input name="ChoosePayment" value="${baseParam.ChoosePayment}" />
    <input name="EncryptType" value="${baseParam.EncryptType}" />
    <input name="CheckMacValue" value="${createCheckMac(baseParam)}" />
    <button type="submit">Submit</button>
  </form>
`;

  res.json({
    data: html,
  });
  // //console.log(req.body)
  // res.redirect(callback_url + '?' + new URLSearchParams(req.body).toString())
});

// 測試路由用
// router.get('/', function (req, res, next) {
//   res.render('index', { title: 'shipment route is OK' })
// })

export default router;
