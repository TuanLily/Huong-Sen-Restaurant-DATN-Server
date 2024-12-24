const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

router.post('/send', (req, res) => {
    const { dishes, dishList, customerInfo } = req.body;

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // Lấy thời gian hiện tại
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const formattedDateTime = `${formattedDate} lúc ${formattedTime}`;

    const oldDishListHtml = dishes.map(dish => 
        `<li>${dish.product_name} - ${dish.quantity} x ${dish.price}</li>`
    ).join('');

    const newDishListHtml = dishList.map(dish => 
        `<li>${dish.product_name} - ${dish.quantity} x ${dish.price}</li>`
    ).join('');

    const mailOptions = {
        from: `"Nhà hàng Hương Sen" <${process.env.EMAIL_USERNAME}>`,
        to: customerInfo.email,
        subject: '[No-reply] - Yêu cầu thay đổi món ăn - Nhà hàng Hương Sen',
        html: `
            <h3>Xin chào ${customerInfo.fullname},</h3>
            <p>Bạn đã gửi yêu cầu thay đổi món ăn tại nhà hàng Hương Sen vào ngày ${formattedDateTime}. Dưới đây là thông tin chi tiết:</p>
            <h4>Thông tin khách hàng:</h4>
            <ul>
                <li><strong>Mã đơn hàng:</strong> ${customerInfo.reservation_code}</li>
                <li><strong>Tên khách hàng:</strong> ${customerInfo.fullname}</li>
                <li><strong>Số điện thoại:</strong> ${customerInfo.tel}</li>
                <li><strong>Email:</strong> ${customerInfo.email}</li>
            </ul>
            <h4>Danh sách món ăn cũ:</h4>
            <ul>
                ${oldDishListHtml}
            </ul>
            <h4>Danh sách món ăn mới:</h4>
            <ul>
                ${newDishListHtml}
            </ul>
            <p style="color: red;">Chúng tôi sẽ xử lý yêu cầu của bạn trong thời gian sớm nhất, hãy chú ý điện thoại chúng tôi sẽ gọi cho bạn để xác nhận.</p>
            <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
            <p>Trân trọng,</p>
            <p>Nhà hàng Hương Sen</p>
        `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Lỗi khi gửi email:', error);
            return res.status(500).json({ status: 500, message: 'Lỗi khi gửi email' });
        } else {
            return res.status(200).json({ status: 200, message: 'Email yêu cầu đổi món đã được gửi' });
        }
    });
});

module.exports = router;
