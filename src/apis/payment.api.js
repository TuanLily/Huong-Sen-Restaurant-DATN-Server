const axios = require("axios");
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const connection = require("../../index");

var accessKey = process.env.MOMO_ACCESSKEY;
var secretKey = process.env.MOMO_SECRETKEY;


router.post("/", async (req, res) => {
  const { amount, reservationId } = req.body;

  var orderInfo = "pay with MoMo";
  var partnerCode = "MOMO";
  var redirectUrl = "http://localhost:3001/confirm";
  var ipnUrl = `${process.env.LOCAL_URL}/api/public/payment/callback`;
  var requestType = "payWithMethod";
  var orderId = partnerCode + new Date().getTime();
  var requestId = orderId;
  var extraData = "";
  var orderGroupId = "";
  var autoCapture = true;
  var lang = "vi";

  var rawSignature =
    "accessKey=" +
    accessKey +
    "&amount=" +
    amount +
    "&extraData=" +
    extraData +
    "&ipnUrl=" +
    ipnUrl +
    "&orderId=" +
    orderId +
    "&orderInfo=" +
    orderInfo +
    "&partnerCode=" +
    partnerCode +
    "&redirectUrl=" +
    redirectUrl +
    "&requestId=" +
    requestId +
    "&requestType=" +
    requestType;

  var signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const requestBody = JSON.stringify({
    partnerCode: partnerCode,
    partnerName: "Test",
    storeId: "MomoTestStore",
    requestId: requestId,
    amount: amount,
    orderId: orderId,
    orderInfo: orderInfo,
    redirectUrl: redirectUrl,
    ipnUrl: ipnUrl,
    lang: lang,
    requestType: requestType,
    autoCapture: autoCapture,
    extraData: extraData,
    orderGroupId: orderGroupId,
    signature: signature,
  });

  const options = {
    method: "POST",
    url: "https://test-payment.momo.vn/v2/gateway/api/create",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(requestBody),
    },
    data: requestBody,
  };

  try {
    // Gửi yêu cầu thanh toán đến MoMo
    const result = await axios(options);

    // Lấy payUrl từ phản hồi của MoMo
    const { payUrl } = result.data;

    // Cập nhật momo_order_id vào bảng reservations
    const updateQuery = `UPDATE reservations SET momo_order_id = ? WHERE id = ?`;
    await new Promise((resolve, reject) => {
      connection.query(updateQuery, [orderId, reservationId], (err) => {
        if (err) {
          console.error("Error updating momo_order_id:", err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Trả về payUrl cho client
    return res.status(200).json({ payUrl });
  } catch (error) {
    console.error("Error in MoMo payment request:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Server error",
    });
  }
});

router.post("/get_pay_url", async (req, res) => {
  const { amount, reservationId } = req.body;

  try {
    // Kiểm tra xem mã đơn momo_order_id đã tồn tại trong cơ sở dữ liệu hay chưa
    const checkQuery = `SELECT momo_order_id FROM reservations WHERE id = ?`;
    const momoOrderId = await new Promise((resolve, reject) => {
      connection.query(checkQuery, [reservationId], (err, results) => {
        if (err) {
          console.error("Error fetching momo_order_id:", err);
          reject(err);
        } else if (results.length > 0 && results[0].momo_order_id) {
          resolve(results[0].momo_order_id); // Lấy mã momo_order_id đã tồn tại
        } else {
          resolve(null); // Không có mã momo_order_id
        }
      });
    });

    let orderId;
    if (momoOrderId) {
      // Nếu đã có mã momo_order_id trong cơ sở dữ liệu, sử dụng mã đó
      orderId = momoOrderId;
    } else {
      // Nếu chưa có, tạo mã mới
      orderId = "MOMO" + new Date().getTime();
    }

    var orderInfo = "pay with MoMo";
    var partnerCode = "MOMO";
    var redirectUrl = "http://localhost:3001/confirm";
    var ipnUrl = `${process.env.LOCAL_URL}/api/public/payment/callback`;
    var requestType = "payWithMethod";
    var requestId = orderId;
    var extraData = "";
    var orderGroupId = "";
    var autoCapture = true;
    var lang = "vi";

    var rawSignature =
      "accessKey=" +
      accessKey +
      "&amount=" +
      amount +
      "&extraData=" +
      extraData +
      "&ipnUrl=" +
      ipnUrl +
      "&orderId=" +
      orderId +
      "&orderInfo=" +
      orderInfo +
      "&partnerCode=" +
      partnerCode +
      "&redirectUrl=" +
      redirectUrl +
      "&requestId=" +
      requestId +
      "&requestType=" +
      requestType;

    var signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestBody = JSON.stringify({
      partnerCode: partnerCode,
      partnerName: "Test",
      storeId: "MomoTestStore",
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: redirectUrl,
      ipnUrl: ipnUrl,
      lang: lang,
      requestType: requestType,
      autoCapture: autoCapture,
      extraData: extraData,
      orderGroupId: orderGroupId,
      signature: signature,
    });

    const options = {
      method: "POST",
      url: "https://test-payment.momo.vn/v2/gateway/api/create",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody),
      },
      data: requestBody,
    };

    // Gửi yêu cầu thanh toán đến MoMo
    const result = await axios(options);

    // Lấy payUrl từ phản hồi của MoMo
    const { payUrl } = result.data;

    // Trả về payUrl cho client
    return res.status(200).json({ payUrl });
  } catch (error) {
    console.error("Error in MoMo payment request:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Server error",
    });
  }
});


router.post("/callback", async (req, res) => {
  console.log("callback:: ");
  console.log(req.body); // In toàn bộ body để kiểm tra

  // Lấy các trường cần thiết từ request body
  const { resultCode, orderId, message } = req.body;

  console.log("resultCode:", resultCode);
  console.log("orderId:", orderId);
  console.log("message:", message);

  // Kiểm tra resultCode từ callback
  if (resultCode === 0) { // Giao dịch thành công
    // Cập nhật trạng thái của đơn đặt chỗ trong bảng reservations
    const updateStatusQuery = `UPDATE reservations SET status = 3 WHERE momo_order_id = ?`;

    try {
      await new Promise((resolve, reject) => {
        connection.query(updateStatusQuery, [orderId], (err) => {
          if (err) {
            console.error('Error updating reservation status:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
      console.log('Reservation status updated successfully');
    } catch (error) {
      console.error('Error during status update:', error);
      return res.status(500).json({ message: "Error updating reservation status." });
    }
  } else if (resultCode === 49) { // Giao dịch quá hạn
    console.log('Giao dịch đã hết hạn.');
    return res.status(400).json({ message: "Giao dịch đã hết hạn." });
  } else if (resultCode === 1001) { // Giao dịch bị hủy bởi người dùng
    console.log('Giao dịch đã bị hủy bởi người dùng.');
    return res.status(400).json({ message: "Giao dịch đã bị hủy bởi người dùng." });
  } else {
    console.log('Giao dịch thất bại với resultCode:', resultCode);
    return res.status(400).json({ message: `Giao dịch thất bại với mã lỗi ${resultCode}.` });
  }

  return res.status(200).json(req.body);
});


router.post("/transaction-status", async (req, res) => {
  const { orderId } = req.body;

  const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=MOMO&requestId=${orderId}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const requestBody = JSON.stringify({
    partnerCode: "MOMO",
    requestId: orderId,
    orderId,
    signature,
    lang: "vi",
  });

  //options for axios
  const options = {
    method: "POST",
    url: "https://test-payment.momo.vn/v2/gateway/api/query",
    headers: {
      "Content-Type": "application/json",
    },
    data: requestBody,
  };

  let result = await axios(options);

  return res.status(200).json(result.data);
});

module.exports = router;
