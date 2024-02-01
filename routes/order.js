import "dotenv/config";
import express from "express";
import db from "../utils/connect-mysql.js";
import upload from "./../utils/upload-imgs.js";
import dayjs from "dayjs";
import createOrder from "../utils/createOrder.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const sql = "SELECT * FROM order_list ORDER BY order_id";
  const [rows] = await db.query(sql);
  res.json(rows);
});

// router.get("/", async (req, res) => {
//   const perPage = 20; // 每頁固定20筆資料
//   // +轉換成數字，若無法轉換變成NAN則設定為1(使用者意外使用了不存在的頁數直接跳轉到第一頁)
//   let page = +req.query.page || 1;;
//   let totalRows;
//   let totalPages;
//   let rows = [];

//   // 如果頁數小於一(不存在)，用重新導向方法redirect()頁面跳轉回第一頁
//   // 放在上面先判斷頁數本身有沒有可能存在，有存在才進行下一步
//   // 不存在直接return即結束不執行下面的程式

//   const total_sql = "SELECT COUNT(1) totalRows FROM amusement_ride";
//   // 用括號們將totalRows解構得到純數字
//   [[{ totalRows }]] = await db.query(total_sql);
//   // 將資料總筆數除以一頁的資料筆數後以Math.ceil()小數直接進位成整數
//   totalPages = Math.ceil(totalRows / perPage);
//   // 如果資料總筆數大於零(可能存在)
//   if(totalRows > 0){
//     // 如果頁數大於總頁數直接重新導向到上次的最後一頁
//     if (page > totalPages) {
//       return res.redirect(`?page=${totalPages}`);
//     }
//     const sql = `SELECT * FROM amusement_ride ORDER BY product_id DESC
//     LIMIT ${(page - 1) * perPage}, ${perPage}`;
//     // 這裡的rows是上面的全域變數
//     [rows] = await db.query(sql);
//   }
//     return {
//     page,
//     totalRows,
//     totalPages,
//     rows,
//     };
//   });
//   res.render('rides/order', {

//   });

// 設定要在近其他頁面前要先登入，沒登入會跳轉到登入頁面
router.use((req, res, next) => {
  const u = req.url.split("?")[0]; // 用split擷取路徑
  console.log({ u });
  if (req.method === "GET" && u === "/") {
    return next();
  }
  //   // 如果session裡沒有登入的資訊
  //   if (!req.session.admin) {
  //     // 跳轉到登入頁面
  //     return res.redirect("/login");
  //   }
  next();
});

const getListData = async (req) => {
  // 取得會員ID
  const user_id = +req.body.user_id;
  console.log("query user:", user_id);

  const perPage = 20; // 每頁幾筆
  // 用戶決定要看第幾頁
  let page = +req.query.page || 1;
  // 關鍵字模糊搜尋(SQL語法%任意字元包變數)
  let keyword =
    req.query.keyword && typeof req.query.keyword === "string"
      ? req.query.keyword.trim()
      : "";
  let keyword_ = db.escape(`%${keyword}%`);

  let qs = {}; // 用來把 query string 的設定傳給 template
  let pdcate_id = req.query.pdcate_id ? req.query.pdcate_id : "";
  let pdstyle_id = req.query.pdstyle_id ? req.query.pdstyle_id : "";
  let pdsize_id = req.query.pdsize_id ? req.query.pdsize_id : "";
  let pdcolor_id = req.query.pdcolor_id ? req.query.pdcolor_id : "";
  // 設定綜合的where子句
  let where = `WHERE 1 `;
  // 關鍵字搜尋只有一欄的情況下要用符合任一的or
  if (keyword) {
    qs.keyword = keyword;
    where += ` AND (\`product_name\` LIKE ${keyword_}) `;
  }
  if (pdcate_id !== 0 && pdcate_id !== "") {
    qs.pdcate_id = pdcate_id;
    where += ` AND pdcate_id = '${pdcate_id}' `;
  }
  if (pdstyle_id !== 0 && pdstyle_id !== "") {
    qs.pdstyle_id = pdstyle_id;
    where += ` AND pdstyle_id = '${pdstyle_id}' `;
  }
  if (pdsize_id !== 0 && pdsize_id !== "") {
    qs.pdsize_id = pdsize_id;
    where += ` AND pdsize_id = '${pdsize_id}' `;
  }
  if (pdcolor_id !== 0 && pdcolor_id !== "") {
    qs.pdcolor_id = pdcolor_id;
    where += ` AND pdcolor_id = '${pdcolor_id}' `;
  }

  let totalRows = 0;
  let totalPages = 0;
  let orders = [];
  let order_details = [];

  let output = {
    success: false,
    page,
    perPage,
    orders,
    order_details,
    totalRows,
    totalPages,
    qs,
    redirect: "",
    info: "",
  };

  // if (page < 1) {
  //   // 如果頁數小於一，頁面轉向到第一頁
  //   output.redirect = `?page=1`;
  //   output.info = `頁碼值小於 1`;
  //   return output;
  // }
  // const t_sql = `SELECT COUNT(1) totalRows FROM ((((((order_list JOIN order_status ON order_list.odstatus_id = order_status.odstatus_id) JOIN recipient_address_list ON order_list.recipient_address_id=recipient_address_list.recipient_address_id)  JOIN user ON order_list.user_id = user.user_id) JOIN bill_list ON order_list.bill_id = bill_list.bill_id) JOIN userpay_list ON order_list.userpay_id = userpay_list.userpay_id) JOIN order_detail_list ON order_list.order_id = order_detail_list.order_id) JOIN product_list ON order_detail_list.product_id = product_list.product_id `;
  // [[{ totalRows }]] = await db.query(t_sql);
  // totalPages = Math.ceil(totalRows / perPage);
  // if (totalRows > 0) {
  //   if (page > totalPages) {
  //     output.redirect = `?page=${totalPages}`;
  //     output.info = `頁碼值大於總頁數`;
  //     return { ...output, totalRows, totalPages };
  //   }
  //   // const sql = `SELECT * FROM (((((((order_list JOIN order_status ON order_list.odstatus_id = order_status.odstatus_id) JOIN ibon_list ON order_list.ibon_id = ibon_list.ibon_id) JOIN recipient_address_list ON order_list.recipient_address_id=recipient_address_list.recipient_address_id)  JOIN user ON order_list.user_id = user.user_id) JOIN bill_list ON order_list.bill_id = bill_list.bill_id) JOIN userpay_list ON order_list.userpay_id = userpay_list.userpay_id) JOIN order_detail_list ON order_list.order_id = order_detail_list.order_id) JOIN product_list ON order_detail_list.product_id = product_list.product_id ${where} ORDER BY order_list.order_id
  // LIMIT ${(page - 1) * perPage}, ${perPage}`;

  // 訂單總表
  const sql = `SELECT * FROM order_list JOIN order_status ON order_list.odstatus_id = order_status.odstatus_id JOIN order_detail_list ON order_list.order_id = order_detail_list.order_id WHERE order_list.user_id=? ORDER BY order_list.order_date DESC`;
  [orders] = await db.query(sql, [user_id]);

  console.log("queried orders: ", orders.length);

  output = { ...output, success: true, orders, totalRows, totalPages };
  // }

  return output;
};

const getDetailData = async (req) => {
  // 取得會員ID
  const order_id = req.body.order_id;
  let order_details = [];

  let output = {
    success: false,
    order_details: [],
  };
console.log(order_id)
  // 訂單細節頁
  const sql = `SELECT * FROM order_detail_list JOIN product_list ON order_detail_list.product_id = product_list.product_id WHERE order_detail_list.order_id =? ORDER BY order_detail_list.order_id`;
  // const sql = `SELECT * FROM order_detail_list
  // JOIN order_list
  // ON order_detail_list.order_id = order_list.order_id
  // JOIN product_list
  // ON order_detail_list.product_id = product_list.product_id
  // JOIN userpay_list
  // ON order_list.userpay_id = userpay_list.userpay_id
  // JOIN bill_list
  // ON order_list.bill_id = bill_list.bill_id
  // JOIN recipient_address_list
  // ON order_list.recipient_address_id = recipient_address_list.recipient_address_id
  // JOIN order_status
  // ON order_list.odstatus_id = order_status.odstatus_id
  // WHERE order_detail_list.order_detail_id
  // ORDER BY order_list.order_id`;

  [order_details] = await db.query(sql, [order_id]);

  output = { ...output, success: true, order_details };

  return output;
};

const getDetail2Data = async (req) => {
  // 取得會員ID
  const order_id = req.body.order_id;
  let order_details2 = [];

  let output = {
    success: false,
    order_details2: [],
  };

  // 訂單細節頁2
  const sql = `SELECT * FROM order_list JOIN bill_list ON order_list.bill_id = bill_list.bill_id JOIN userpay_list ON order_list.userpay_id= userpay_list.userpay_id JOIN recipient_address_list ON order_list.recipient_address_id = recipient_address_list.recipient_address_id JOIN order_status ON order_list.odstatus_id = order_status.odstatus_id WHERE order_list.order_id =? ORDER BY order_list.order_id`;

  [order_details2] = await db.query(sql, [order_id]);

  output = { ...output, success: true, order_details2 };

  return output;
};

router.get("/", async (req, res) => {
  const output = await getListData(req);
  res.locals.pageName = "order_list";
  res.locals.title = "列表|" + res.locals.title;
  // if(output.redirect){
  //   return res.redirect(output.redirect);
  // }
  // // 限制權限，如果沒登入無法使用編輯和刪除的功能(另外弄一個檔案拿掉)
  // if (!req.session.admin) {
  //   res.render("rides/no_login_order", output);
  // } else {
  //   // res.render("rides/list", output);
  //   res.render('rides/order', output);
  // }
});

router.post("/api", async (req, res) => {
  res.json(await getListData(req));
});

router.post("/details", async (req, res) => {
  res.json(await getDetailData(req));
});

router.post("/details2", async (req, res) => {
  res.json(await getDetail2Data(req));
});

// 取得單筆的資料
router.get("/api/:order_id", async (req, res) => {
  const order_id = +req.params.order_id;

  const sql = `SELECT * FROM (((((((order_list JOIN order_status ON order_list.odstatus_id = order_status.odstatus_id) JOIN ibon_list ON order_list.ibon_id = ibon_list.ibon_id) JOIN recipient_address_list ON order_list.recipient_address_id=recipient_address_list.recipient_address_id)  JOIN user ON order_list.user_id = user.user_id) JOIN bill_list ON order_list.bill_id = bill_list.bill_id) JOIN userpay_list ON order_list.userpay_id = userpay_list.userpay_id) JOIN order_detail_list ON order_list.order_id = order_detail_list.order_id) JOIN product_list ON order_detail_list.product_id = product_list.product_id WHERE order_list.order_id`;
  const [rows] = await db.query(sql, [order_id]);
  if (!rows.length) {
    return res.json({ success: false });
  }
  const row = rows[0];
  console.log(row);
  row.order_date = dayjs(row.order_date).format("YYYY-MM-DD");

  res.json({ success: true, row });
});

//新增訂單
// router.get("/add", async (req, res) => {
//   res.render("/add");
// });
router.post("/add", upload.none(), async (req, res) => {
  const output = {
    success: false,
    postData: req.body, // 除錯用
  };

  const [result, ex] = await createOrder(req.body);

  if (result) {
    output.result = result;
    output.success = !!result.affectedRows;
    console.log(result);
  } else {
    console.log(ex);
    output.exception = ex;
  }
  // const { user_id, recipient_name, recipient_email, recipient_phone, recipient_tel, bill_id, userpay_id, odstatus_id, ibon_id, recipient_address_id, address_detail, bill_detail } = req.body;
  // const sql =
  //   "INSERT INTO `order_list`(`user_id`, `recipient_name`, `recipient_email`, `recipient_phone`, `recipient_tel`, `bill_id`, `userpay_id`, `odstatus_id`, `ibon_id`, `recipient_address_id`, `address_detail`, `bill_detail`, `order_date`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW() )";

  // try {
  //   const [result] = await db.query(sql, [
  //     user_id,
  //     recipient_name,
  //     recipient_email,
  //     recipient_phone,
  //     recipient_tel,
  //     bill_id,
  //     userpay_id,
  //     odstatus_id,
  //     ibon_id,
  //     recipient_address_id,
  //     address_detail,
  //     bill_detail,
  //   ]);
  //   output.result = result;
  //   output.success = !!result.affectedRows;
  // } catch (ex) {
  //   output.exception = ex;
  // }

  res.json(output);
});

export default router;
