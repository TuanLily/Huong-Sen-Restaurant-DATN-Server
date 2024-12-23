const axios = require("axios");
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const connection = require("../../index");

var accessKey = process.env.MOMO_ACCESSKEY;
var secretKey = process.env.MOMO_SECRETKEY;

router.post("/", async (req, res) => {
  const { amount, reservationId, reservation_code } = req.body;
  var orderInfo = "pay with MoMo";
  var partnerCode = "MOMO";
  var redirectUrl = "http://localhost:3001/confirm";
  var ipnUrl = `${process.env.LOCAL_URL}/api/public/payment/callback`;
  var requestType = "payWithMethod";
  var orderId = reservation_code; // Sử dụng reservation_code
  var requestId = orderId;
  var extraData = "";
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
    autoCapture: true,
    extraData: extraData,
    orderGroupId: "",
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

    // Đếm ngược thời gian 1 giờ 40 phút
    setTimeout(async () => {
      const checkStatusQuery = `SELECT status FROM reservations WHERE id = ?`;
      connection.query(
        checkStatusQuery,
        [reservationId],
        async (err, results) => {
          if (err) {
            console.error("Error checking reservation status:", err);
          } else if (results[0].status !== 3) {
            const updateStatusQuery = `UPDATE reservations SET status = 2 WHERE id = ?`;
            await new Promise((resolve, reject) => {
              connection.query(updateStatusQuery, [reservationId], (err) => {
                if (err) {
                  console.error("Error updating reservation status:", err);
                  reject(err);
                } else {
                  resolve();
                }
              });
            });
            console.log("Reservation status updated to 2 due to timeout");
          }
        }
      );
    }, 100 * 60000); // 1 giờ 40 phút

    return res.status(200).json(result.data);
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

  // Hàm tạo mã ngẫu nhiên với hai chữ HS và 8 chữ số cuối
  const generateReservationCode = () => {
    const randomNumber = Math.floor(10000000 + Math.random() * 90000000); // Tạo số ngẫu nhiên gồm 8 chữ số
    return `HS${randomNumber}`;
  };

  try {
    // Kiểm tra xem mã đơn reservation_code đã tồn tại trong cơ sở dữ liệu hay chưa
    const checkQuery = `SELECT reservation_code FROM reservations WHERE id = ?`;
    const reservationCode = await new Promise((resolve, reject) => {
      connection.query(checkQuery, [reservationId], (err, results) => {
        if (err) {
          console.error("Error fetching reservation_code:", err);
          reject(err);
        } else if (results.length > 0 && results[0].reservation_code) {
          resolve(results[0].reservation_code); // Lấy mã reservation_code đã tồn tại
        } else {
          resolve(null); // Không có mã reservation_code
        }
      });
    });

    let reseCode;
    if (reservationCode) {
      reseCode = generateReservationCode();
      // Cập nhật reservation_code vào cơ sở dữ liệu
      const updateQuery = `UPDATE reservations SET reservation_code = ? WHERE id = ?`;
      await new Promise((resolve, reject) => {
        connection.query(updateQuery, [reseCode, reservationId], (err, results) => {
          if (err) {
            console.error("Error updating reservation_code:", err);
            reject(err);
          } else {
            resolve(results);
          }
        });
      });
    } else {
      reseCode = generateReservationCode();
      // Cập nhật reservation_code vào cơ sở dữ liệu
      const updateQuery = `UPDATE reservations SET reservation_code = ? WHERE id = ?`;
      await new Promise((resolve, reject) => {
        connection.query(updateQuery, [reseCode, reservationId], (err, results) => {
          if (err) {
            console.error("Error updating reservation_code:", err);
            reject(err);
          } else {
            resolve(results);
          }
        });
      });
    }

    var orderInfo = "pay with MoMo";
    var partnerCode = "MOMO";
    var redirectUrl = "http://localhost:3001/confirm";
    var ipnUrl = `${process.env.LOCAL_URL}/api/public/payment/callback`;
    var requestType = "payWithMethod";
    var requestId = reseCode;
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
      reseCode +
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
      orderId: reseCode,
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

router.post("/pay_balance", async (req, res) => {
  const { amount, reservationId } = req.body;

  // Hàm tạo mã ngẫu nhiên với hai chữ HS và 8 chữ số cuối
  const generateReservationCode = () => {
    const randomNumber = Math.floor(10000000 + Math.random() * 90000000); // Tạo số ngẫu nhiên gồm 8 chữ số
    return `HS${randomNumber}`;
  };

  try {
    // Kiểm tra xem mã đơn reservation_code đã tồn tại trong cơ sở dữ liệu hay chưa
    const checkQuery = `SELECT reservation_code FROM reservations WHERE id = ?`;
    const reservationCode = await new Promise((resolve, reject) => {
      connection.query(checkQuery, [reservationId], (err, results) => {
        if (err) {
          console.error("Error fetching reservation_code:", err);
          reject(err);
        } else if (results.length > 0 && results[0].reservation_code) {
          resolve(results[0].reservation_code); // Lấy mã reservation_code đã tồn tại
        } else {
          resolve(null); // Không có mã reservation_code
        }
      });
    });

    let reseCode;
    if (reservationCode) {
      reseCode = generateReservationCode();
      // Cập nhật reservation_code vào cơ sở dữ liệu
      const updateQuery = `UPDATE reservations SET reservation_code = ? WHERE id = ?`;
      await new Promise((resolve, reject) => {
        connection.query(updateQuery, [reseCode, reservationId], (err, results) => {
          if (err) {
            console.error("Error updating reservation_code:", err);
            reject(err);
          } else {
            resolve(results);
          }
        });
      });
    } else {
      reseCode = generateReservationCode();
      // Cập nhật reservation_code vào cơ sở dữ liệu
      const updateQuery = `UPDATE reservations SET reservation_code = ? WHERE id = ?`;
      await new Promise((resolve, reject) => {
        connection.query(updateQuery, [reseCode, reservationId], (err, results) => {
          if (err) {
            console.error("Error updating reservation_code:", err);
            reject(err);
          } else {
            resolve(results);
          }
        });
      });
    }

    var orderInfo = "pay with MoMo";
    var partnerCode = "MOMO";
    var redirectUrl = "http://localhost:3001/confirm";
    var ipnUrl = `${process.env.LOCAL_URL}/api/public/payment/callback`;
    var requestType = "payWithMethod";
    var requestId = reseCode;
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
      reseCode +
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
      orderId: reseCode,
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

const updateReservationStatus = async (orderId) => {
  // Lấy trạng thái hiện tại
  const getStatusQuery = `SELECT status FROM reservations WHERE reservation_code = ?`;
  const updateStatusQuery = `UPDATE reservations SET status = ? WHERE reservation_code = ?`;

  try {
    const currentStatus = await new Promise((resolve, reject) => {
      connection.query(getStatusQuery, [orderId], (err, results) => {
        if (err) {
          console.error("Error fetching reservation status:", err);
          reject(err);
        } else if (results.length === 0) {
          reject(new Error("Reservation not found."));
        } else {
          resolve(results[0].status);
        }
      });
    });

    // Kiểm tra và cập nhật trạng thái
    const newStatus = currentStatus == 3 ? 5 : 3;
    await new Promise((resolve, reject) => {
      connection.query(updateStatusQuery, [newStatus, orderId], (err) => {
        if (err) {
          console.error("Error updating reservation status:", err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    console.log(`Reservation status updated successfully to ${newStatus}`);
    return newStatus;
  } catch (error) {
    throw error;
  }
};

router.post("/callback", async (req, res) => {
  console.log("callback:: ");
  console.log(req.body); // In toàn bộ body để kiểm tra

  // Lấy các trường cần thiết từ request body
  const { resultCode, orderId, message } = req.body;

  console.log("resultCode:", resultCode);
  console.log("orderId:", orderId);
  console.log("message:", message);

  // Kiểm tra resultCode từ callback
  if (resultCode === 0) {
    // Giao dịch thành công
    // Cập nhật trạng thái của đơn đặt chỗ trong bảng reservations
    const newStatus = await updateReservationStatus(orderId);
    return res.status(200).json({ message: `Reservation status updated to ${newStatus}.` });
    // const updateStatusQuery = `UPDATE reservations SET status = 3 WHERE reservation_code = ?`;

    // try {
    //   await new Promise((resolve, reject) => {
    //     connection.query(updateStatusQuery, [orderId], (err) => {
    //       if (err) {
    //         console.error("Error updating reservation status:", err);
    //         reject(err);
    //       } else {
    //         resolve();
    //       }
    //     });
    //   });
    //   console.log("Reservation status updated successfully");
    // } catch (error) {
    //   console.error("Error during status update:", error);
    //   return res
    //     .status(500)
    //     .json({ message: "Error updating reservation status." });
    // }
  } else if (resultCode === 49) {
    // Giao dịch quá hạn
    console.log("Giao dịch đã hết hạn.");
    return res.status(400).json({ message: "Giao dịch đã hết hạn." });
  } else if (resultCode === 1001) {
    // Giao dịch bị hủy bởi người dùng
    console.log("Giao dịch đã bị hủy bởi người dùng.");
    return res
      .status(400)
      .json({ message: "Giao dịch đã bị hủy bởi người dùng." });
  } else {
    console.log("Giao dịch thất bại với resultCode:", resultCode);
    return res
      .status(400)
      .json({ message: `Giao dịch thất bại với mã lỗi ${resultCode}.` });
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
