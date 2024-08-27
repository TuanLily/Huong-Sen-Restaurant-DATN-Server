const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken'); // Nếu bạn muốn sử dụng JWT
const connection = require('../../index');
const authenticateJWT = require('./authMiddleware');
require('dotenv').config();

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET_KEY; // Thay thế bằng secret key của bạn

// Đăng nhập
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user_type = 'Nhân Viên';

    // Kiểm tra các trường bắt buộc
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Tìm nhân viên theo email
    const sql = 'SELECT * FROM users WHERE email = ? AND user_type = ?';
    connection.query(sql, [email , user_type], async (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ error: 'Failed to fetch users' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password', message: "Email hoặc mật khẩu không đúng" });
        }

        const employee = results[0];

        // Kiểm tra mật khẩu
        try {
            const isMatch = await bcrypt.compare(password, employee.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid email or password', message: "Email hoặc mật khẩu không đúng" });
            }

            // Tạo JWT token nếu cần
            const expiresIn = 30 * 60; // Thời gian hết hạn 30 phút
            const accessToken = jwt.sign({ id: employee.id }, JWT_SECRET, { expiresIn: '1h' });

            res.status(200).json({
                message: 'Login successful',
                data: {
                    fullname: employee.fullname,
                    username: employee.username,
                    email: employee.email,
                    avatar: employee.avatar,
                    tel: employee.tel,
                    address: employee.address,
                },
                accessToken: accessToken,
                expiresIn: expiresIn
            });
        } catch (err) {
            console.error('Error comparing passwords:', err);
            return res.status(500).json({ error: 'Failed to log in users' });
        }
    });
});

router.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    console.log('Email nhận được:', email); // Thêm dòng log này

    const query = 'SELECT * FROM users WHERE email = ?';
    connection.query(query, [email], (err, rows) => {
        if (err) {
            console.error('Lỗi khi lấy người dùng:', err);
            return res.status(500).json({ status: 500, message: 'Lỗi khi lấy người dùng' });
        }

        if (rows.length === 0) {
            return res.status(404).json({ status: 404, message: 'Email không tồn tại' });
        }

        // Tạo mã thông báo đặt lại mật khẩu và thời gian hết hạn
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpiration = Date.now() + 2 * 60 * 1000; // 2 phút

        // Cập nhật người dùng với mã thông báo đặt lại và thời gian hết hạn
        const updateQuery = 'UPDATE users SET resetToken = ?, resetTokenExpiration = ? WHERE email = ?';
        connection.query(updateQuery, [resetToken, resetTokenExpiration, email], (err, result) => {
            if (err) {
                console.error('Lỗi khi cập nhật người dùng với mã thông báo đặt lại:', err);
                return res.status(500).json({ status: 500, message: 'Lỗi khi cập nhật người dùng' });
            }

            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD
                }
            });

            // Gửi email với mã thông báo đặt lại
            const mailOptions = {
                from: process.env.EMAIL_USERNAME,
                to: email,
                subject: '[No-reply] - Đặt lại mật khẩu - Nhà hàng Hương Sen',
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                        <h2>Đặt lại mật khẩu</h2>
                        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
                        <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
                        <a href="http://localhost:3000/forgot?token=${resetToken}" style="text-decoration: none;">
                            <button style="background-color: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">
                                Đặt lại mật khẩu
                            </button>
                        </a>
                        <p><small>*Xin lưu ý rằng liên kết này chỉ có hiệu lực trong vòng 2 phút và không được chia sẻ với bất kỳ ai khác.</small></p>
                        <p><small>(Nếu bạn không yêu cầu việc đặt lại mật khẩu, vui lòng bỏ qua email này)</small></p>
                    </div>
                `,
            };

            console.log('Sending email to:', email); // Thêm dòng log này

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Lỗi khi gửi email:', error);
                    return res.status(500).json({ status: 500, message: 'Lỗi khi gửi email' });
                } else {
                    console.log('Email sent:', info.response); // Thêm dòng log này
                    return res.status(200).json({ status: 200, message: 'Email đặt lại mật khẩu đã được gửi' });
                }
            });
        });
    });
});


router.post('/change-password', (req, res) => {
    const { token, newPassword } = req.body;

    console.log('Received token:', token);
    console.log('Received new password:', newPassword);

    const query = 'SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiration > ?';
    console.log (Date.now ())
    connection.query(query, [token, Date.now()], (err, rows) => {
        if (err) {
            console.error('Lỗi khi lấy thông tin tài khoản với mã token:', err);
            return res.status(500).json({ status: 'error', message: 'Lỗi khi lấy thông tin tài khoản' });
        }

        if (rows.length === 0) {
            console.warn('Mã token không hợp lệ hoặc đã hết hạn:', token);
            return res.status(400).json({ status: 'error', message: 'Mã token không hợp lệ hoặc đã hết hạn' });
        }

        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        const updateQuery = 'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiration = NULL WHERE resetToken = ?';
        connection.query(updateQuery, [hashedPassword, token], (err, result) => {
            if (err) {
                console.error('Lỗi khi cập nhật mật khẩu tài khoản:', err);
                return res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật mật khẩu tài khoản' });
            }

            console.log('Đổi mật khẩu thành công cho token:', token);
            return res.status(200).json({ status: 'success', message: 'Đổi mật khẩu thành công' });
        });
    });
});

module.exports = router;