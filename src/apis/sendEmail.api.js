const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const connection = require('../../index');

router.post('/send', (req, res) => {
    const { dishes, dishList, customerInfo, currentTotal, VAT10 } = req.body;

    // Hàm định dạng giá
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

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
        `<li>${dish.product_name} - ${dish.quantity} x ${formatCurrency(dish.price)}</li>`
    ).join('');

    const newDishListHtml = dishList.map(dish => 
        `<li>${dish.product_name} - ${dish.quantity} x ${formatCurrency(dish.price)}</li>`
    ).join(''); 

    const mailOptionsCustomer = {
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
            <h4>Thông tin thanh toán:</h4>
            <ul>
                <li><strong>Tổng tiền ban đầu:</strong> ${formatCurrency(customerInfo.total_amount)}</li>
                <li><strong>Tiền đã đặt cọc:</strong> ${formatCurrency(customerInfo.deposit)}</li>
                <li><strong>Tạm tính:</strong> ${formatCurrency(currentTotal)} <strong>Tạm tính:</strong> ${formatCurrency(VAT10)}</li>
                <li><strong>Tổng tiền sau thay đổi:</strong> ${formatCurrency(currentTotal + VAT10)}</li>
                <li><strong>Tiền phải trả sau khi đến ăn:</strong> ${formatCurrency((currentTotal + VAT10) - customerInfo.deposit)}</li>
            </ul>
            <p style="color: red;">Chúng tôi sẽ xử lý yêu cầu của bạn trong thời gian sớm nhất, hãy chú ý điện thoại chúng tôi sẽ gọi cho bạn để xác nhận.</p>
            <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
            <p>Trân trọng,</p>
            <p>Nhà hàng Hương Sen</p>
        `,
    };

    // Email gửi cho nhân viên
    const mailOptionsRestaurant = {
        from: `"Nhà hàng Hương Sen" <${process.env.EMAIL_USERNAME}>`,
        to: process.env.EMAIL_EMPLOYYER,  // Địa chỉ email nhân viên
        subject: '[Thông báo] - Yêu cầu thay đổi món ăn từ khách hàng',
        html: `
            <h3>Có yêu cầu thay đổi món ăn từ khách hàng!</h3>
            <p>Yêu cầu được gửi vào ngày ${formattedDateTime}. Dưới đây là thông tin chi tiết:</p>
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
            <h4>Thông tin thanh toán:</h4>
            <ul>
                <li><strong>Tổng tiền ban đầu:</strong> ${formatCurrency(customerInfo.total_amount)}</li>
                <li><strong>Tiền đã đặt cọc:</strong> ${formatCurrency(customerInfo.deposit)}</li>
                <li><strong>Tạm tính:</strong> ${formatCurrency(currentTotal)} <strong>Thuế(10%):</strong> ${formatCurrency(VAT10)}</li>
                <li><strong>Tổng tiền sau thay đổi:</strong> ${formatCurrency(currentTotal + VAT10)}</li>
                <li><strong>Tiền phải trả sau khi đến ăn:</strong> ${formatCurrency((currentTotal + VAT10) - customerInfo.deposit)}</li>
            </ul>
            <p style="color: red;">Vui lòng xử lý yêu cầu thay đổi món ăn của khách hàng.</p>
        `,
    };

    // Gửi email cho khách hàng và nhà hàng
    transporter.sendMail(mailOptionsCustomer, (error, info) => {
        if (error) {
            console.error('Lỗi khi gửi email:', error);
            return res.status(500).json({ status: 500, message: 'Lỗi khi gửi email cho khách hàng' });
        }

        transporter.sendMail(mailOptionsRestaurant, (error, info) => {
            if (error) {
                console.error('Lỗi khi gửi email cho nhà hàng:', error);
                return res.status(500).json({ status: 500, message: 'Lỗi khi gửi email cho nhà hàng' });
            }

            // Truy vấn cập nhật cột number_change thành 0
            const query = `UPDATE reservations SET number_change = 0 WHERE id = ?`;
            connection.query(query, [customerInfo.id], (err, result) => {
                if (err) {
                    console.error('Lỗi khi cập nhật cơ sở dữ liệu:', err);
                    return res.status(500).json({ status: 500, message: 'Lỗi khi cập nhật cơ sở dữ liệu' });
                }
                return res.status(200).json({ status: 200, message: 'Email yêu cầu đổi món đã được gửi và cập nhật thành công' });
            });
        });
    });
});


module.exports = router;
