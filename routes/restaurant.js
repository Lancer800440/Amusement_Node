import "dotenv/config";
import express from "express";
import db from "../utils/connect-mysql.js";
import upload from "./../utils/upload-imgs.js";
import dayjs from "dayjs";

const router = express.Router();

router.get("/", async (req, res) => {
  const sql = "SELECT * FROM shop ORDER BY shop_id";
  const [rows] = await db.query(sql);
  res.json(rows);
});

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

  const perPage = 20; // 每頁幾筆
  // 用戶決定要看第幾頁
  let page = +req.query.page || 1;
  // 關鍵字模糊搜尋(SQL語法%任意字元包變數)
  // let keyword = (req.query.keyword && typeof req.query.keyword ==='string' ) ? req.query.keyword.trim() : "";
  // let keyword_ = db.escape(`%${keyword}%`);
  
  let qs = {};  // 用來把 query string 的設定傳給 template

  // 設定綜合的where子句
  let where = `WHERE 1 `;
  let shop_type_id = req.query.shop_type_id? req.query.shop_type_id : '';

  if (shop_type_id !==0 && shop_type_id !== '') {
    qs.shop_type_id = shop_type_id;
    where += ` AND shop_with_shop_type.shop_type_id = '${shop_type_id}' `;
  }
  let totalRows = 0;
  let totalPages = 0;
  let rows = [];

  let output = {
    success: false,
    page,
    perPage,
    rows,
    totalRows,
    totalPages,
    qs,
    redirect: "",
    info: "",
  };
  const t_sql = `SELECT COUNT(1) totalRows FROM (shop JOIN shop_with_shop_type ON shop.shop_id = shop_with_shop_type.shop_id) JOIN shop_type ON shop_with_shop_type.shop_type_id=shop_type.shop_type_id ${where} ORDER BY shop.shop_id `;
  [[{ totalRows }]] = await db.query(t_sql);
  totalPages = Math.ceil(totalRows / perPage);
  if (totalRows > 0) {
    if (page > totalPages) {
      output.redirect = `?page=${totalPages}`;
      output.info = `頁碼值大於總頁數`;
      return {...output, totalRows, totalPages};
    }

    const sql = `SELECT * FROM shop JOIN shop_with_shop_type ON shop.shop_id = shop_with_shop_type.shop_id JOIN shop_type ON shop_with_shop_type.shop_type_id=shop_type.shop_type_id ${where} ORDER BY shop.shop_id LIMIT ${(page - 1) * perPage}, ${perPage}`;
    [rows] = await db.query(sql);
    output = { ...output, success: true, rows, totalRows, totalPages };
  }
  return output;
  }

  router.get("/", async (req, res) => {
    const output = await getListData(req);
    res.locals.pageName = "shop_list";
    res.locals.title = "列表|" + res.locals.title;
    // if(output.redirect){
    //   return res.redirect(output.redirect);
    // }
    // // 限制權限，如果沒登入無法使用編輯和刪除的功能(另外弄一個檔案拿掉)
    // if (!req.session.admin) {
    //   res.render("rides/no_login_ride_list", output);
    // } else {
    //   // res.render("rides/list", output);
    //   res.render('rides/ride_list', output);
    // }
    
  });

  router.get("/api", async (req, res) => {
    res.json( await getListData(req) );
  });

  // 取得單筆的資料
router.get("/api/details/:shop_id", async (req, res) => {
  const shop_id = +req.params.shop_id;


  const sql = `SELECT * FROM shop JOIN shop_with_shop_type ON shop.shop_id = shop_with_shop_type.shop_id JOIN shop_type ON shop_with_shop_type.shop_type_id=shop_type.shop_type_id WHERE shop.shop_id=?`;
  const [rows] = await db.query(sql, [shop_id]);
  if (!rows.length) {
    return res.json({success: false});
  }
  const row = rows[0];


  res.json({success: true, row});
});

const getTypeData = async(req)=>{
  const perPage = 10; // 每頁幾筆
  // 用戶決定要看第幾頁
  let page = +req.query.page || 1;
  let qs = {};  // 用來把 query string 的設定傳給 template
  let shop_id = req.query.shop_id? req.query.shop_id : '';
  let shop_type_id = req.query.shop_type_id? req.query.shop_type_id : '';
  // 設定綜合的where子句
  let where = `WHERE 1 `;

  // 關鍵字搜尋只有一欄的情況下要用符合任一的or
  if (shop_id !==0 && shop_id !=='') {
    qs.shop_id = shop_id;
    where += ` AND shop.shop_id != '${shop_id}' `;
  }
  if (shop_type_id !==0 && shop_type_id !=='') {
    qs.shop_type_id = shop_type_id;
    where += ` AND shop_type.shop_type_id = '${shop_type_id}' `;
  }

  let totalRows = 0;
  let totalPages = 0;
  let rows = [];

  let output = {
    success: false,
    page,
    perPage,
    rows,
    totalRows,
    totalPages,
    qs,
    redirect: "",
    info: "",
  };

  const t_sql = `SELECT COUNT(1) totalRows FROM (shop JOIN shop_with_shop_type ON shop.shop_id = shop_with_shop_type.shop_id) JOIN shop_type ON shop_with_shop_type.shop_type_id=shop_type.shop_type_id ${where} ORDER BY shop.shop_id `;
  [[{ totalRows }]] = await db.query(t_sql);
  totalPages = Math.ceil(totalRows / perPage);
  if (totalRows > 0) {
    if (page > totalPages) {
      output.redirect = `?page=${totalPages}`;
      output.info = `頁碼值大於總頁數`;
      return {...output, totalRows, totalPages};
    }
  }

  const sql = `SELECT * FROM shop JOIN shop_with_shop_type ON shop.shop_id = shop_with_shop_type.shop_id JOIN shop_type ON shop_with_shop_type.shop_type_id=shop_type.shop_type_id ${where} ORDER BY shop.shop_id` ;
  [rows] = await db.query(sql);
    if (!rows.length) {
      return res.json({success: false});
    }
    output = { ...output, success: true, rows, totalRows, totalPages };  
  return output;
}
router.get("/type/api", async (req, res) => {
res.json( await getTypeData(req) );
});
export default router;
