import "dotenv/config";
import express from "express";
import db from "../utils/connect-mysql.js";
import upload from "./../utils/upload-imgs.js";
import dayjs from "dayjs";

const router = express.Router();

router.get("/", async (req, res) => {
  const sql = "SELECT * FROM amusement_ride ORDER BY amusement_ride_id";
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
//     const sql = `SELECT * FROM amusement_ride ORDER BY amusement_ride_id DESC 
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
//   res.render('rides/ride_list', {

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
  const perPage = 30; // 每頁幾筆
  // 用戶決定要看第幾頁
  let page = +req.query.page || 1;
  // 關鍵字模糊搜尋(SQL語法%任意字元包變數)
  let keyword = (req.query.keyword && typeof req.query.keyword ==='string' ) ? req.query.keyword.trim() : "";
  let keyword_ = db.escape(`%${keyword}%`);
  
  let qs = {};  // 用來把 query string 的設定傳給 template
  let theme_id = req.query.theme_id? req.query.theme_id : '';
  let ride_category_id = req.query.ride_category_id? req.query.ride_category_id : '';
  let thriller_rating = req.query.thriller_rating? req.query.thriller_rating : '';
  let ride_support_id = req.query.ride_support_id? req.query.ride_support_id : '';
  // 設定綜合的where子句
  let where = `WHERE 1 `;
  // 關鍵字搜尋只有一欄的情況下要用符合任一的or
  if (keyword) {
    qs.keyword = keyword;
    where += ` AND (\`amusement_ride_name\` LIKE ${keyword_}) `;
  }
  if (theme_id !==0 && theme_id !=='') {
    qs.theme_id = theme_id;
    where += ` AND theme_id = '${theme_id}' `;
  }
  if (ride_category_id !==0 && ride_category_id !=='') {
    qs.ride_category_id = ride_category_id;
    where += ` AND ride_category_id = '${ride_category_id}' `;
  }
  if (thriller_rating !==0 && thriller_rating !=='') {
    qs.thriller_rating = thriller_rating;
    where += ` AND thriller_rating = '${thriller_rating}' `;
  }
  if (ride_support_id !==0 && ride_support_id !=='') {
    qs.ride_support_id = ride_support_id;
    where += ` AND ride_support_id = '${ride_support_id}' `;
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

  // if (page < 1) {
  //   // 如果頁數小於一，頁面轉向到第一頁
  //   output.redirect = `?page=1`;
  //   output.info = `頁碼值小於 1`;
  //   return output;
  // }
  const t_sql = `SELECT COUNT(1) totalRows FROM amusement_ride ${where}`;
  [[{ totalRows }]] = await db.query(t_sql);
  totalPages = Math.ceil(totalRows / perPage);
  if (totalRows > 0) {
    if (page > totalPages) {
      output.redirect = `?page=${totalPages}`;
      output.info = `頁碼值大於總頁數`;
      return { ...output, totalRows, totalPages };
    }

    const sql = `SELECT * FROM amusement_ride ${where} ORDER BY amusement_ride_id DESC 
    LIMIT ${(page - 1) * perPage}, ${perPage}`;
    [rows] = await db.query(sql);
    output = { ...output, success: true, rows, totalRows, totalPages };
  }

  return output;
};

router.get("/", async (req, res) => {
  const output = await getListData(req);
  res.locals.pageName = "ride_list";
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
router.get("/api/details/:amusement_ride_id", async (req, res) => {
  const amusement_ride_id = +req.params.amusement_ride_id;

  const sql = `SELECT amusement_ride_id, amusement_ride.amusement_ride_name, amusement_ride_img, amusement_ride.ride_category_id, ride_category_name, thriller_rating, height_requirement, ride_support_name, theme_name, amusement_ride_description FROM amusement_ride JOIN ride_category ON amusement_ride.ride_category_id=ride_category.ride_category_id JOIN ride_support ON amusement_ride.ride_support_id=ride_support.ride_support_id JOIN theme ON amusement_ride.theme_id=theme.theme_id JOIN maintenance ON amusement_ride.amusement_ride_name=maintenance.amusement_ride_name WHERE amusement_ride_id=?` ;
  const [rows] = await db.query(sql, [amusement_ride_id]);
  if (!rows.length) {
    return res.json({ success: false });
  }
  const row = rows[0];
  // row.birthday = dayjs(row.birthday).format("YYYY-MM-DD");
  res.json({success: true, row});
});
// 取得除了某個社使以外跟該設施相同類型的設施

// 取得某個類型的所有設施中的前三個設施並排除某一個設施
const getTypeData = async(req)=>{
  const perPage = 10; // 每頁幾筆
  // 用戶決定要看第幾頁
  let page = +req.query.page || 1;
  let qs = {};  // 用來把 query string 的設定傳給 template
  let amusement_ride_id = req.query.amusement_ride_id? req.query.amusement_ride_id : '';
  let ride_category_id = req.query.ride_category_id? req.query.ride_category_id : '';
  // 設定綜合的where子句
  let where = `WHERE 1 `;

  // 關鍵字搜尋只有一欄的情況下要用符合任一的or
  if (amusement_ride_id !==0 && amusement_ride_id !=='') {
    qs.amusement_ride_id = amusement_ride_id;
    where += ` AND amusement_ride_id != '${amusement_ride_id}' `;
  }
  if (ride_category_id !==0 && ride_category_id !=='') {
    qs.ride_category_id = ride_category_id;
    where += ` AND amusement_ride.ride_category_id = '${ride_category_id}' `;
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

  const t_sql = `SELECT COUNT(1) totalRows FROM amusement_ride JOIN ride_category ON amusement_ride.ride_category_id=ride_category.ride_category_id ${where} ORDER BY amusement_ride.amusement_ride_id`;
  [[{ totalRows }]] = await db.query(t_sql);
  totalPages = Math.ceil(totalRows / perPage);
  if (totalRows > 0) {
    if (page > totalPages) {
      output.redirect = `?page=${totalPages}`;
      output.info = `頁碼值大於總頁數`;
      return {...output, totalRows, totalPages};
    }
  }

  const sql = `SELECT amusement_ride_id, amusement_ride_name, ride_category.ride_category_id, amusement_ride_img, amusement_ride_description FROM amusement_ride JOIN ride_category ON amusement_ride.ride_category_id=ride_category.ride_category_id ${where} ORDER BY amusement_ride.amusement_ride_id LIMIT 3`;
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

const getMaintainTime = async(req)=>{
  const perPage = 10; // 每頁幾筆
  // 用戶決定要看第幾頁
  let page = +req.query.page || 1;
  let qs = {};  // 用來把 query string 的設定傳給 template
  let amusement_ride_name = req.query.amusement_ride_name? req.query.amusement_ride_name : '';
  // 設定綜合的where子句
  let where = `WHERE 1 `;

  // 關鍵字搜尋只有一欄的情況下要用符合任一的or
  if (amusement_ride_name !=='') {
    qs.amusement_ride_name = amusement_ride_name;
    where += ` AND amusement_ride.amusement_ride_name = '${amusement_ride_name}' `;
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

  const t_sql = `SELECT COUNT(1) totalRows FROM amusement_ride JOIN maintenance ON amusement_ride.amusement_ride_name=maintenance.amusement_ride_name ${where} AND unix_timestamp(maintenance_begin) >  unix_timestamp(Now()) ORDER BY maintenance_begin`;
  [[{ totalRows }]] = await db.query(t_sql);
  totalPages = Math.ceil(totalRows / perPage);
  if (totalRows > 0) {
    if (page > totalPages) {
      output.redirect = `?page=${totalPages}`;
      output.info = `頁碼值大於總頁數`;
      return {...output, totalRows, totalPages};
    }
  }

  const sql = `SELECT amusement_ride_id, amusement_ride.amusement_ride_name, maintenance_begin, maintenance_end FROM amusement_ride JOIN maintenance ON amusement_ride.amusement_ride_name = maintenance.amusement_ride_name ${where} AND unix_timestamp(maintenance_begin) >  unix_timestamp(Now()) ORDER BY amusement_ride.amusement_ride_id LIMIT 1`;
  [rows] = await db.query(sql);
    if (!rows.length) {
      return output;
    }

    rows.forEach((row) => {
      row.maintenance_begin = dayjs(row.maintenance_begin).format("YYYY/MM/DD HH:mm");
      row.maintenance_end = dayjs(row.maintenance_end).format("YYYY/MM/DD HH:mm");
  })

    output = { ...output, success: true, rows, totalRows, totalPages };  
  return output;
}
router.get("/time/api", async (req, res) => {
  res.json( await getMaintainTime(req) );
  });

export default router;
