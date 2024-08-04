const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken'); // Nếu bạn muốn sử dụng JWT
const connection = require('../../index');
require('dotenv').config();

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET_KEY; // Thay thế bằng secret key của bạn

// Đăng nhập
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM customer WHERE email = ?';

    connection.query(query, [email], (err, rows) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).send('Error fetching user');
        }

        if (rows.length === 0) {
            return res.status(404).send('Invalid email or password');
        }

        const user = rows[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).json({ status: 'error', message: 'Error comparing passwords' });
            }

            if (!isMatch) {
                return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
            }

            // Tạo access token có thời hạn 1 giờ
            const token = jwt.sign(
                { id: user.id, email: user.email, name: user.fullname, avatar: user.avatar },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            return res.json({
                message: "Đăng nhập thành công!",
                user: {
                    fullname: user.fullname,
                    email: user.email,
                    tel: user.tel,
                    avatar: user.avatar,
                    address: user.address,
                },
                accessToken: token
            });
        });
    });
});


// Đăng ký = tài khoản google
router.post('/register-google', async (req, res) => {
    const { fullname, email, avatar } = req.body;

    const defaultTel = '';
    const defaultAddress = '';
    const defaultPassword = '';

    try {
        // Kiểm tra xem email đã tồn tại hay chưa
        const checkEmailSql = 'SELECT COUNT(*) as count FROM customer WHERE email = ?';
        connection.query(checkEmailSql, [email], (checkErr, checkResult) => {
            if (checkErr) {
                return res.status(500).json({ error: 'Database error', details: checkErr });
            }

            if (checkResult[0].count > 0) {
                return res.status(409).json({ error: 'Email đã tồn tại' });
            }

            // Nếu email chưa tồn tại, tiến hành thêm người dùng mới
            const insertSql = `
                INSERT INTO customer (fullname, email, avatar, tel, address, password) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            connection.query(insertSql, [fullname, email, avatar, defaultTel, defaultAddress, defaultPassword], (insertErr, result) => {
                if (insertErr) {
                    return res.status(500).json({ error: 'Database error', details: insertErr });
                }
                res.json({
                    success: true,
                    user: {
                        fullname,
                        email,
                        avatar
                    }
                });
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error });
    }
});

router.get('/login-google', (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const getUserSql = 'SELECT fullname, email, avatar, tel, address FROM customer WHERE email = ?';
    connection.query(getUserSql, [email], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err });
        }

        if (result.length > 0) {
            // Nếu người dùng tồn tại, gửi thông tin người dùng về client
            const user = result[0];
            
            // Tạo accessToken với thời hạn 3 giờ
            const accessToken = jwt.sign({ id: user.id, email: user.email, name: user.fullname, avatar: user.avatar}, JWT_SECRET, { expiresIn: '3h' });

            res.json({
                success: true,
                user,
                accessToken
            });
        } else {
            // Nếu người dùng không tồn tại
            res.status(404).json({ error: 'User not found' });
        }
    });
});

// Kiểm tra email tồn tại
router.get('/check-email', (req, res) => {
    const { email } = req.query;
    const checkEmailSql = 'SELECT * FROM customer WHERE email = ?';
    connection.query(checkEmailSql, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err });
        }
        if (results.length > 0) {
            res.json({ exists: true, user: results[0] });
        } else {
            res.json({ exists: false });
        }
    });
});

// Đăng ký tài khoản
router.post('/register', async (req, res) => {
    const { fullname, email, avatar, tel, address, password } = req.body;

    if (!fullname) {
        return res.status(400).json({ error: 'Họ và tên là bắt buộc!' });
    }
    if (!email) {
        return res.status(400).json({ error: 'Email là bắt buộc!' });
    }
    if (!tel) {
        return res.status(400).json({ error: 'Số điện thoại là bắt buộc!' });
    }
    if (!address) {
        return res.status(400).json({ error: 'Địa chỉ là bắt buộc!' });
    }
    if (!password) {
        return res.status(400).json({ error: 'Mật khẩu là bắt buộc!' });
    }

    // Kiểm tra email đã tồn tại chưa
    const checkEmailSql = 'SELECT * FROM customer WHERE email = ?';
    connection.query(checkEmailSql, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi không xác định', details: err });
        }
        if (results.length > 0) {
            return res.status(400).json({ message: 'Email đã được sử dụng' });
        }

        try {
            // Mã hóa mật khẩu
            const hashedPassword = await bcrypt.hash(password, 10);

            // Tạo người dùng mới
            const insertUserSql = 'INSERT INTO customer (fullname, email, avatar, tel, address, password) VALUES (?, ?, ?, ?, ?, ?)';
            connection.query(insertUserSql, [fullname, email, avatar, tel, address, hashedPassword], (err, results) => {
                if (err) {
                    return res.status(500).json({ error: 'Lỗi không xác định', details: err });
                }

                res.status(201).json({
                    message: 'Đăng ký tài khoản thành công!',
                });
            });
        } catch (error) {
            res.status(500).json({ message: 'Đã xảy ra lỗi khi đăng ký', error });
        }
    });
});

// Quên mật khẩu

router.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    console.log('Email nhận được:', email); // Thêm dòng log này

    const query = 'SELECT * FROM customer WHERE email = ?';
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
        const updateQuery = 'UPDATE customer SET resetToken = ?, resetTokenExpiration = ? WHERE email = ?';
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
                        <a href="http://localhost:3001/change-password?token=${resetToken}" style="text-decoration: none;">
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

    const query = 'SELECT * FROM customer WHERE resetToken = ? AND resetTokenExpiration > ?';
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
        const updateQuery = 'UPDATE customer SET password = ?, resetToken = NULL, resetTokenExpiration = NULL WHERE resetToken = ?';
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
