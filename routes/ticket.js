import "dotenv/config";
import express from "express";
import db from "../utils/connect-mysql.js";
import dayjs from "dayjs";

const router = express.Router();

router.get("/", async (req, res) => {
  const sql =
    "SELECT * FROM (ticket_list JOIN ticketcategory1 ON ticket_list.tc1_id = ticketcategory1.tc1_id) JOIN ticketcategory2 ON ticket_list.tc2_id = ticketcategory2.tc2_id ORDER BY sid";
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

  let qs = {}; // 用來把 query string 的設定傳給 template

  // 設定綜合的where子句
  let where = `WHERE 1 `;
  // 關鍵字搜尋只有一欄的情況下要用符合任一的or
  // if(keyword){
  //   qs.keyword = keyword;
  //   where += ` AND (\`show_name\` LIKE ${keyword_}) `;
  // }

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
  const t_sql = `SELECT COUNT(1) totalRows FROM ticket_list ${where}`;
  [[{ totalRows }]] = await db.query(t_sql);
  totalPages = Math.ceil(totalRows / perPage);
  if (totalRows > 0) {
    if (page > totalPages) {
      output.redirect = `?page=${totalPages}`;
      output.info = `頁碼值大於總頁數`;
      return { ...output, totalRows, totalPages };
    }

    const sql = `SELECT * FROM (ticket_list JOIN ticketcategory1 ON ticket_list.tc1_id = ticketcategory1.tc1_id) JOIN ticketcategory2 ON ticket_list.tc2_id = ticketcategory2.tc2_id ${where} ORDER BY sid LIMIT ${
      (page - 1) * perPage
    }, ${perPage}`;
    [rows] = await db.query(sql);
    output = { ...output, success: true, rows, totalRows, totalPages };
  }
  return output;
};

router.get("/", async (req, res) => {
  const output = await getListData(req);
  res.locals.pageName = "ticket_list";
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
  res.json(await getListData(req));
});

// 取得單筆的資料
// router.get("/api/details/:sid", async (req, res) => {
//   const sid = +req.params.sid;

//   const sql = `SELECT * FROM (ticket_list JOIN ticketcategory1 ON ticket_list.tc1_id = ticketcategory1.tc1_id) JOIN ticketcategory2 ON ticket_list.tc2_id = ticketcategory2.tc2_id`;
//   const [rows] = await db.query(sql, [sid]);
//   if (!rows.length) {
//     return res.json({ success: false });
//   }
//   const row = rows[0];
//   row.beginTime = dayjs(row.beginTime).format("YYYY/MM/DD");
//   row.endTime = dayjs(row.endTime).format("YYYY/MM/DD");

//   res.json({ success: true, row });
// });

router.get("/api/details/:sid", async (req, res) => {
  const sid = +req.params.sid;

  const sql = `SELECT * FROM (ticket_list JOIN ticketcategory1 ON ticket_list.tc1_id = ticketcategory1.tc1_id) JOIN ticketcategory2 ON ticket_list.tc2_id = ticketcategory2.tc2_id WHERE sid=?`;
  const [rows] = await db.query(sql, [sid]);
  if (!rows.length) {
    return res.json({ success: false });
  }
  const row = rows[0];
  row.beginTime = dayjs(row.beginTime).format("YYYY/MM/DD");
  row.endTime = dayjs(row.endTime).format("YYYY/MM/DD");

  res.json({ success: true, row });
});
export default router;
