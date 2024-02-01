import { createHash } from "crypto";

// {
//     MerchantID,
//     MerchantTradeNo,
//     MerchantTradeDate,
//     PaymentType,
//     TradeDesc,
//     ItemName,
//     ReturnURL,
//     ChoosePayment,
//     CheckMacValue,
//     TotalAmount,
//     EncryptType;
// }

const HASH_KEY = "pwFHCqoQZGmho4w6";
const HASH_IV = "EkRm7iFT261dpevs";

const createCheckMac = (params) => {
  // (1) 將傳遞參數依照第一個英文字母，由A到Z的順序來排序(遇到第一個英名字母相同時，
  // 以第二個英名字母來比較，以此類推)，並且以&方式將所有參數串連。
  const mac1 = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  // (2) 參數最前面加上HashKey、最後面加上HashIV
  const mac2 = `HashKey=${HASH_KEY}&${mac1}&HashIV=${HASH_IV}`;

  // (3) 將整串字串進行URL encode
  const mac3 = encodeURIComponent(mac2);

  // (4) 轉為小寫
  const mac4 = mac3.toLowerCase();

  const mac4Transcoded = mac4
  .replace(/%20/g, "+")
  .replace(/%2d/g, "-")
  .replace(/%5f/g, "_")
  .replace(/%2e/g, ".")
  .replace(/%21/g, "!")
  .replace(/%2a/g, "*")
  .replace(/%28/g, "(")
  .replace(/%29/g, ")")
  .replace(/%20/g, "+");

  // (5) 以SHA256加密方式來產生雜凑值
  const mac5 = createHash("sha256").update(mac4Transcoded).digest("hex");

  // (6) 再轉大寫產生CheckMacValue
  const mac6 = mac5.toUpperCase();

  return mac6;
};

// const macValue = createCheckMac({
//   MerchantID: "3002607",
//   MerchantTradeNo: "test334567890123",
//   MerchantTradeDate: "2023/01/21 15:30:13",
//   PaymentType: "aio",
//   TotalAmount: 8787,
//   TradeDesc: "aasdf",
//   ItemName: "asdf",
//   ReturnURL: "https://google.com",
//   ChoosePayment: "Credit",
//   EncryptType: 1 
// });

// console.log(macValue);

export default createCheckMac