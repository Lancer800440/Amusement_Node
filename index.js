import "dotenv/config";
import express from "express";
import session from "express-session";
import dayjs from "dayjs";
import moment from "moment-timezone";
import cors from "cors";
import mysql_session from "express-mysql-session";
import bcrypt from "bcryptjs";

import  jwt  from "jsonwebtoken";
import fileUpload from "express-fileupload";
import morgan from "morgan";
import lodash from "lodash";
import bodyParser from "body-parser";
import rideRouter from "./routes/ride.js";
import showRouter from "./routes/show.js"
import shopRouter from "./routes/restaurant.js"
import db from "./utils/connect-mysql.js";
import upload from "./utils/upload-imgs.js";
import sales from "./data/sales.json" assert { type: "json" };
import admin2Router from "./routes/admin2.js";
import productListRouter from "./routes/product.js";
import cartRouter from "./routes/cart.js";
import ticketRouter from "./routes/ticket.js";

// import multer from "multer";
// const upload = multer({ dest: "tmp_uploads/" });
import orderRouter from './routes/order.js'
import userpayRouter from './routes/userpay.js'
import shipmentRouter from './routes/shipment.js'
import paymentRouter from './routes/payment.js'
import maintainRouter from './routes/maintain.js'
import registerRouter from './routes/register.js'
import reservationRouter from './routes/reservation.js'


// import multer from "multer";
// const upload = multer({ dest: "tmp_uploads/" });

// const bodyParser = require('body-parser');
// const _ = require('lodash');

const app = express();

app.set("view engine", "ejs");

// top-level middlewares
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// app.use(fileUpload({
//   createParentPath: true
// }));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended: true}));
// app.use(morgan('dev'));

//讓uploads目錄公開
// https://expressjs.com/zh-tw/starter/static-files.html
//app.use(express.static('uploads'));
// 如果想要改網址路徑用下面的
// 您可以透過 /static 路徑字首，來載入 uploads 目錄中的檔案。
// app.use('/uploads', express.static('uploads'));

const MysqlStore = mysql_session(session);
const sessionStore = new MysqlStore({}, db);
app.use(
  session({
    saveUninitialized: false,
    resave: false,
    store: sessionStore,
    secret: "kdgdf9485498KIUGLKIU45490",
  })
);

// 自訂頂層 middleware
app.use((req, res, next) => {
  res.locals.title = "小景頁的網站";
  res.locals.pageName = "";

  res.locals.toDateString = (d) => dayjs(d).format("YYYY-MM-DD");
  res.locals.toDateTimeString = (d) => dayjs(d).format("YYYY-MM-DD HH:mm:ss");

  res.locals.session = req.session;  // 讓 templates 可以取用 session
  const park_auth = req.get("Authorization");
  // 處理token，將Authorization的值去掉Bearer 只取單純的token值
  if(park_auth && park_auth.indexOf("Bearer ")===0){
    const token = park_auth.slice(7);
    // 避免因為token錯誤報錯，用try catch包起來但不對錯誤的token做任何處理
    try{
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      // console.log({payload});

      // 將token的登入狀態傳遞下去供其他需要驗證登入的網頁使用
      res.locals.jwt = payload;
    } catch (ex) {}
  }
  // 測試用
  // res.locals.jwt = { id: 1, email: "DrinkAllDay@iSpan.com" };
  next();
});
// 定義路由
// 首頁在最上面
app.get("/", (req, res) => {
  res.locals.title = "首頁 | " + res.locals.title;

  res.render("home", { name: process.env.DB_NAME });
});
app.get("/json-sales", (req, res) => {
  res.locals.title = "JSON資料 | " + res.locals.title;
  res.locals.pageName = "json-sales";

  res.render("json-sales", { sales });
});

// app.get(/^\/m\/09\d{2}-?\d{3}-?\d{3}$/i, (req, res) => {
//   let u = req.url.slice(3).split("?")[0];
//   u = u.split("-").join("");

//   res.send({ u });
// });

app.use("/ride", rideRouter);
app.use("/admins", admin2Router);
app.use("/product", productListRouter);
app.use("/cart", cartRouter);
app.use("/ticket", ticketRouter);
app.use("/order", orderRouter);
app.use("/userpay", userpayRouter);
app.use("/shipment", shipmentRouter);
app.use("/payment", paymentRouter);
app.use("/show", showRouter);
app.use("/shop", shopRouter);
app.use("/maintenance", maintainRouter);
app.use("/register", registerRouter);
app.use("/reservation", reservationRouter);
app.get("/try-sess", (req, res) => {
  req.session.n = req.session.n || 0;
  req.session.n++;
  res.json(req.session);
});

app.get("/try-moment", (req, res) => {
  const fm = "YYYY-MM-DD HH:mm:ss";
  const m1 = moment();
  const m2 = moment("12-10-11");
  const m3 = moment("12-10-11", "DD-MM-YY");
  const d1 = dayjs();
  const d2 = dayjs("2023-11-15");
  const a1 = new Date();
  const a2 = new Date("2023-11-15");

  res.json({
    m1: m1.format(fm),
    m2: m2.format(fm),
    m3: m3.format(fm),
    m1a: m1.tz("Europe/Berlin").format(fm),
    d1: d1.format(fm),
    d2: d2.format(fm),
    a1,
    a2,
  });
});

app.get("/try-db", async (req, res) => {
  const [results, fields] = await db.query(
    `SELECT * FROM \`categories\` LIMIT 5`
  );
  res.json(results);
});

app.get("/login", async (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const output = {
    success: false,
    code: 0,
    error:"",
    postData: req.body,
  };
  if (!req.body.email || !req.body.password) {
    // 資料不足
    output.code = 410;
    output.error = "帳號或密碼未填";
    return res.json(output);
  }

  const sql = "SELECT * FROM user WHERE user_email=?";
  const [rows] = await db.query(sql, [req.body.email]);

  if (!rows.length) {
    // 帳號是錯的
    output.code = 400;
    output.error = "帳號不存在";
    return res.json(output);
  }
  const row = rows[0];
  const pass = await bcrypt.compare(req.body.password, row.user_password);
  if (!pass) {
    // 密碼是錯的
    output.code = 420;
    output.error = "密碼錯誤";
    return res.json(output);
  }

  output.code = 200;
  output.success = true;
  // 設定 session
  req.session.admin = {
    user_id: row.user_id,
    email: row.user_email,
    user_nickname: row.user_nickname,
  };
  output.user = req.session.admin;
  res.json(output);
});
  app.get("/logout", async (req, res) => {
  delete req.session.admin;
  res.redirect("/");
});
  app.post("/login-jwt", async (req, res) => {
  const output = {
    success: false,
    error:'',
    code: 0,
    postData: req.body,
    id: 0,
    email: "",
    nickname: "",
    token: "",
  };
  if (!req.body.email || !req.body.password) {
    // 資料不足
    output.code = 410;
    output.error = "帳號或密碼未填";
    return res.json(output);
  }
  const sql = "SELECT * FROM user WHERE user_email=?";
  const [rows] = await db.query(sql, [req.body.email]);

  if (!rows.length) {
    // 帳號是錯的
    output.code = 400;
    output.error = '此帳號不存在';
    return res.json(output);
  }
  const row = rows[0];
  const pass = await bcrypt.compare(req.body.password, row.user_password);
  if (!pass) {
    // 密碼是錯的
    output.code = 420;
    output.error = '密碼錯誤';
    return res.json(output);
  }

  output.code = 200;
  output.error = '資料正確';
  output.success = true;
  
  output.id = row.user_id;
  output.email = row.user_email;
  output.nickname = row.user_nickname;
  output.token = jwt.sign(
    { id: row.user_id, email: row.user_email },
    process.env.JWT_SECRET
  );
  res.json(output);
});
app.get("/logout", async (req, res) => {
  delete req.session.admin;
  res.redirect("/");
});

app.get("/user", async (req, res) => {
  // res.locals.jwt: {id, email}
  const output = {
    success: false,
    error: "",
    data: {},
  };

  if(!res.locals.jwt?.id){
    output.error = "沒有權限";
    return res.json(output);
  }
  const [rows] = await db.query("SELECT `user_id`, `user_email`,`user_password`, `phone`, `birthday`, `user_nickname`, `user_name`, `address` FROM `user` WHERE user_id=?", [res.locals.jwt.id]);
  if(!rows.length){
    output.error = "沒有這個會員";
    return res.json(output);
  }
  output.success = true;
  output.data = rows[0];
  const row = rows[0];
  if(row.birthday){
    row.birthday = dayjs(row.birthday).format("YYYY/MM/DD");
  }else{
    row.birthday="";
  }
  
  
  res.json(output);
});

app.get("/try-jw1", async(req,res)=>{
  // jwt 加密(.env的設定中再加一項)
  const token = jwt.sign({user_id:1, user_email: "DrinkAllDay@iSpan.com"},process.env.JWT_SECRET);
  res.json({token});
});
app.get("/try-jw2", async(req,res)=>{
  // 解密
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsImFjY291bnQiOiJzaGluIiwiaWF0IjoxNzAzNTYxMDU2fQ.ZgaJZX1cNMH-GG99dQJRz-pJGqquf9LTBmgsSw7iPHE";
  const payload = jwt.verify(token,process.env.JWT_SECRET);
  res.json({payload});
});


// 設定靜態內容的資料夾
app.use(express.static("public"));
app.use("/bootstrap", express.static("node_modules/bootstrap/dist"));
app.use("/jquery", express.static("node_modules/jquery/dist"));

// *************** 404 page *** 所有的路由都要放在此之前
app.use((req, res) => {
  res.status(404).send(`<h1>404 Not Found</h1>`);
});

const port = process.env.WEB_PORT || 3001;

app.listen(port, () => {
  console.log(`express server: ${port}`);
});



