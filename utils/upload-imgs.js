import multer from "multer";
import { v4 as uuidv4 } from "uuid";
// 下載uuid套件並使用套件中的v4功能，以下以uuidv4代替v4
// 設定副檔名
const extMap = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
// cb是callback function
const fileFilter = (req, file, cb) => {
  cb(null, !!extMap[file.mimetype]);
};
// 設定存取的方式及檔案放置處
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img");
  },
  // 設定主檔名(main)及副檔名(ext)
  filename: (req, file, cb) => {
    const main = uuidv4();
    const ext = extMap[file.mimetype];
    cb(null, main + ext);
  },
});
export default multer({ fileFilter, storage });