import express from "express";
import db from "./../utils/connect-mysql.js";
import upload from "./../utils/upload-imgs.js";
import dayjs from "dayjs";
import bcrypt from "bcryptjs";
import { error } from "console";




const router = express.Router();

router.use((req, res, next) => {
  const u = req.url.split("?")[0]; // 只要路徑
  console.log({ u });
  if (req.method === "GET" && u === "/") {
    return next();
  }
/*
  if (!req.session.admin) {
    return res.redirect("/login");
  } */
  next();
});

const getListData = async (req) => {
  const perPage = 20; // 每頁幾筆
  let page = +req.query.page || 1; // 用戶決定要看第幾頁

  let qs = {};  // 用來把 query string 的設定傳給 template

  // 設定綜合的where子句
  let where = `WHERE 1 `;
  let user_email = req.query.user_email? req.query.user_email : '';
  let user_password = req.query.user_password? req.query.user_word : '';
  const emailRule = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/;
  if(user_email!=="" && user_email.search(emailRule)!==-1){
    qs.user_email = user_email;
    where += ` AND user_email = '${user_email}' `;
  }
  if(user_password!=="" && user_email.search(emailRule)!==-1){
    // await bcrypt.compare("123zzzZZZ","$2a$08$MafiDLdOaJS65JblXkpvueEgik/QA3VzJLO.5jO6Izk92VXerLm4S");
    // await bcrypt.compare(user_password,hash);
    qs.user_password = user_password
    // const hash = await bcrypt.hash(user_password, 8)
    let hash = ''
    const passIsCorrect =await bcrypt.compare(user_password, hash);
    if (passIsCorrect){
      where += ` AND user_password = '${hash}' `;
    }
    console.log(hash)
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

  if (page < 1) {
    output.redirect = `?page=1`;
    output.info = `頁碼值小於 1`;
    return output;
  }

  const t_sql = `SELECT COUNT(1) totalRows FROM user ${where} ORDER BY user_id`;
  [[{ totalRows }]] = await db.query(t_sql);
  totalPages = Math.ceil(totalRows / perPage);
  if (totalRows > 0) {
    if (page > totalPages) {
      output.redirect = `?page=${totalPages}`;
      output.info = `頁碼值大於總頁數`;
      return { ...output, totalRows, totalPages };
    }

    const sql = `SELECT * FROM user ${where} ORDER BY user_id  
    LIMIT ${(page - 1) * perPage}, ${perPage}`;
    [rows] = await db.query(sql);
    output = { ...output, success: true, rows, totalRows, totalPages };
  }

  return output;
};
  // console.log(await bcrypt.compare("123zzzZZZ","$2a$08$MafiDLdOaJS65JblXkpvueEgik/QA3VzJLO.5jO6Izk92VXerLm4S"));
router.get("/", async (req, res) => {
  res.locals.pageName = "user-list";
  res.locals.title = "列表 | " + res.locals.title;
  const output = await getListData(req);

  if (output.redirect) {
    return res.redirect(output.redirect);
  }
});

router.get("/api", async (req, res) => {
  res.json(await getListData(req));
  /*
  if(res.locals.jwt?.id){
    return res.json(await getListData(req));
  } else {
    return res.json({success: false, error: "沒有授權, 不能取得資料"});
  }
  */
});

router.get("/add", async (req, res) => {
  res.render("user/add");
});

// router.post('/add', check('email').isEmail(), authController)
router.post("/add", upload.none(), async (req, res) => {
  const output = {
    success: false,
    error:'',
    postData: req.body, // 除錯用
  };
  let { user_name, user_email, user_password, avatar, birthday, phone,  address, user_nickname, rePassword } = req.body;
  const hash = await bcrypt.hash(user_password, 8);
  
  if(user_name===""||user_name.trim().length == 0){
    output.error='姓名為必填'
  }
  const emailRule = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/;
  if(user_email===""||user_email.search(emailRule)===-1){
    output.error='email須符合格式'
  }
  
  if(user_nickname===""){
    user_nickname=user_name
  }
  if(!avatar){
    avatar="/images/user/profile.png";
  }
  if(address===""){
    address=" ";
  }
  if(birthday===""){
    birthday=null;
  }

  const phoneRule = /^09\d{8}$/;
    if(phone!==""&& phone.search(phoneRule)===-1){
      output.error='手機號碼須符合格式'
    }
    
  const passwordRule = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,30}$/;
    if(user_password===""){
      output.error='密碼為必填'
    }
    if(user_password!==""&& user_password.search(passwordRule)===-1){
      output.error='密碼須符合格式'

    }
    if(rePassword!==user_password){
      output.error='兩次輸入的密碼不同'
    }
    // if(!output.success){
    //   return
    // }
  const sql =
    "INSERT INTO `user`(`user_name`, `user_email`, `user_password`, `avatar`, `birthday`, `phone`, `address`, `user_nickname` ) VALUES (?, ?, ?, ?, ?, ?, ?, ? )";

  try {
    const [result] = await db.query(sql, [
      user_name,
      user_email,
      hash,
      avatar,
      birthday,
      phone,
      address,
      user_nickname,
    ]);
    output.result = result;
    output.success = !!result.affectedRows;
  } catch (ex) {
    output.exception = ex;
  }

  /*
  const sql = "INSERT INTO `user` SET ?";
  // INSERT INTO `user` SET `name`='abc',
  req.body.created_at = new Date();
  const [result] = await db.query(sql, [req.body]);
  */

  // {
  //   "fieldCount": 0,
  //   "affectedRows": 1,  # 影響的列數
  //   "insertId": 1021,   # 取得的 PK
  //   "info": "",
  //   "serverStatus": 2,
  //   "warningStatus": 0,
  //   "changedRows": 0    # 修改時真正有變動的資料筆數
  // }

  res.json(output);
});

router.get("/edit/:user_id", async (req, res) => {
  const user_id = +req.params.user_id;
  res.locals.title = "編輯 | " + res.locals.title;

  const sql = `SELECT * FROM user WHERE user_id=?`;
  const [rows] = await db.query(sql, [user_id]);
  if (!rows.length) {
    return res.redirect(req.baseUrl);
  }
  const row = rows[0];
  if(row.birthday){
    row.birthday = dayjs(row.birthday).format("YYYY-MM-DD");
  }else{
    row.birthday = '';
  }
  

  res.render("user/edit", row);
});

// 取得單筆的資料
router.get("/api/edit/:user_id", async (req, res) => {
  const user_id = +req.params.user_id;


  const sql = `SELECT * FROM user WHERE user_id=?`;
  const [rows] = await db.query(sql, [user_id]);
  if (!rows.length) {
    return res.json({success: false});
  }
  const row = rows[0];
  if(row.birthday){
    row.birthday = dayjs(row.birthday).format("YYYY-MM-DD");
  }else{
    row.birthday = '';
  }

  res.json({success: true, row});
});

router.post("/edit/:user_id", async (req, res) => {
  const user_id = +req.params.user_id;
  const sql = `SELECT * FROM user WHERE user_id=?`;
  const [rows] = await db.query(sql, [user_id]);
  if (!rows.length) {
    return res.json({success: false});
  }
  const row = rows[0];
  if(row.birthday){
    row.birthday = dayjs(row.birthday).format("YYYY-MM-DD");
  }else{
    row.birthday = '';
  }

  const output = {
    success: false,
    postData: req.body,
    result: null,
    error:''
  };
  // TODO: 表單資料檢查

  let { user_name, birthday, phone, address, user_nickname} = req.body;
  if(req.body.user_name===row.user_name &&
    req.body.birthday===row.birthday &&
    req.body.phone===row.phone &&
    req.body.address===row.address &&
    req.body.user_nickname===row.user_nickname
    ){
      output.result='資料沒有修改'
      output.error='輸入的資料與之前相同'
      return res.json(output);
    }
  if(user_name===""||user_name.trim().length == 0){
    output.result='資料修改失敗'
    output.error='姓名為必填'
    return res.json(output);
  }
  
  if(user_nickname===""){
    user_nickname=user_name
  }
  if(address===""){
    address=" ";
  }
  if(birthday===""){
    birthday=null;
  }
  const phoneRule = /^09\d{8}$/;
    if(phone!==""&& phone.search(phoneRule)===-1){
      output.result='資料修改失敗'
      output.error='手機號碼須符合格式'
    }
  req.body.address = req.body.address.trim(); // 去除頭尾空白
  const sql2 = `UPDATE user SET ? WHERE user_id=?`;
  const [result] = await db.query(sql2, [req.body, req.body.user_id]);
  output.result = result;
  output.success = !!result.changedRows;
  res.json(output);
});
export default router;
