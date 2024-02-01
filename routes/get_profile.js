import "dotenv/config";
import express from "express";
import db from "../utils/connect-mysql.js";
import upload from "./../utils/upload-imgs.js";
import fileUpload from "express-fileupload";
import morgan from "morgan";
import lodash from "lodash";
import bodyParser from "body-parser";


const router = express.Router();

// 單檔上傳測試
/*--------------------------*/
router.post('/uploads', async (req, res) => {
  try {
      if(!req.files) {
          res.send({
              status: false,
              message: 'No file uploaded'
          });
      } else {
          //使用輸入框的名稱來獲取上傳檔案 (例如 "avatar")
          let avatar = req.files.avatar;
          
          //使用 mv() 方法來移動上傳檔案到要放置的目錄裡 (例如 "uploads")
          avatar.mv('./uploads/' + avatar.name);

          //送出回應
          res.json({
              status: true,
              message: 'File is uploaded',
              data: {
                  name: avatar.name,
                  mimetype: avatar.mimetype,
                  size: avatar.size
              }
          });
      }
  } catch (err) {
      res.status(500).json(err);
  }
});
export default router;
