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
const JWT_SECRET = process.env.JWT_SECRET_KEY;

const defaultUserType = "Khách Hàng";

// Đăng ký hoặc đăng nhập bằng tài khoản Google
router.post('/google', async (req, res) => {
    const { fullname, email, avatar } = req.body;

    const defaultTel = '';
    const defaultAddress = '';
    const defaultPassword = '';

    try {
        // Kiểm tra xem email đã tồn tại hay chưa
        const checkEmailSql = 'SELECT * FROM users WHERE email = ?';
        connection.query(checkEmailSql, [email], (checkErr, checkResult) => {
            if (checkErr) {
                return res.status(500).json({ error: 'Database error', details: checkErr });
            }
            if (checkResult.length > 0) {
                // Nếu email đã tồn tại, đăng nhập và tạo accessToken
                const user = checkResult[0];
                const accessToken = jwt.sign(
                    { id: user.id, email: user.email, name: user.fullname, avatar: user.avatar },
                    JWT_SECRET,
                    { expiresIn: '3h' }
                );

                // Tạo một đối tượng mới không có trường password
                const { password, ...userWithoutPassword } = user;

                return res.json({
                    success: true,
                    user: userWithoutPassword, // Trả về đối tượng người dùng không có mật khẩu
                    accessToken
                });
            }


            // Nếu email chưa tồn tại, tiến hành thêm người dùng mới
            const insertSql = `
                INSERT INTO users (fullname, email, avatar, tel, address, password, user_type) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            connection.query(insertSql, [fullname, email, avatar, defaultTel, defaultAddress, defaultPassword, defaultUserType], (insertErr, result) => {
                if (insertErr) {
                    return res.status(500).json({ error: 'Database error', details: insertErr });
                }

                const user = { id: result.insertId, fullname, email, avatar };
                const accessToken = jwt.sign({ id: user.id, email: user.email, name: user.fullname, avatar: user.avatar }, JWT_SECRET, { expiresIn: '3h' });

                res.json({
                    success: true,
                    user,
                    accessToken
                });
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error });
    }
});

// Đăng ký hoặc đăng nhập bằng tài khoản Facebook
router.post('/facebook', async (req, res) => {
    const { fullname, email, avatar } = req.body;

    const defaultTel = '';
    const defaultAddress = '';
    const defaultPassword = '';

    try {
        // Kiểm tra xem email đã tồn tại hay chưa
        const checkEmailSql = 'SELECT * FROM users WHERE email = ?';
        connection.query(checkEmailSql, [email], (checkErr, checkResult) => {
            if (checkErr) {
                return res.status(500).json({ error: 'Database error', details: checkErr });
            }

            if (checkResult.length > 0) {
                // Nếu email đã tồn tại, đăng nhập và tạo accessToken
                const user = checkResult[0];
                const accessToken = jwt.sign(
                    { id: user.id, email: user.email, name: user.fullname, avatar: user.avatar },
                    JWT_SECRET,
                    { expiresIn: '3h' }
                );

                // Tạo một đối tượng mới không có trường password
                const { password, ...userWithoutPassword } = user;

                return res.json({
                    success: true,
                    user: userWithoutPassword, // Trả về đối tượng người dùng không có mật khẩu
                    accessToken
                });
            }

            // Nếu email chưa tồn tại, tiến hành thêm người dùng mới
            const insertSql = `
                INSERT INTO users (fullname, email, avatar, tel, address, password) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            connection.query(insertSql, [fullname, email, avatar, defaultTel, defaultAddress, defaultPassword], (insertErr, result) => {
                if (insertErr) {
                    return res.status(500).json({ error: 'Database error', details: insertErr });
                }

                const user = { id: result.insertId, fullname, email, avatar };
                const accessToken = jwt.sign({ id: user.id, email: user.email, name: user.fullname, avatar: user.avatar }, JWT_SECRET, { expiresIn: '3h' });

                res.json({
                    success: true,
                    user,
                    accessToken
                });
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error });
    }
});



// Kiểm tra email tồn tại
router.get('/check-email', (req, res) => {
    const { email } = req.query;
    const checkEmailSql = 'SELECT * FROM users WHERE email = ?';
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
    const checkEmailSql = 'SELECT * FROM users WHERE email = ?';
    connection.query(checkEmailSql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi kiểm tra email.', details: err });
        if (results.length > 0) return res.status(400).json({ message: 'Email đã tồn tại.' });

        try {
            // Mã hóa mật khẩu
            const hashedPassword = await bcrypt.hash(password, 10);

            // Tạo người dùng mới
            const insertUserSql = 'INSERT INTO users (fullname, email, avatar, tel, address, password, user_type) VALUES (?, ?, ?, ?, ?, ?, ?)';
            connection.query(insertUserSql, [fullname, email, avatar, tel, address, hashedPassword, 'Nhân Viên'], (err, userResults) => {
                if (err) return res.status(500).json({ error: 'Lỗi khi tạo tài khoản.', details: err });

                const newUserId = userResults.insertId;

                // Lấy loại thẻ "Mới" từ bảng membership_tiers
                const defaultMembershipTierSql = 'SELECT id FROM membership_tiers WHERE name = ?';
                connection.query(defaultMembershipTierSql, ['Mới'], (err, tierResults) => {
                    if (err || tierResults.length === 0) return res.status(500).json({ error: 'Không tìm thấy loại thẻ "Mới".' });

                    const defaultTierId = tierResults[0].id;

                    // Tạo thẻ thành viên cho người dùng với loại thẻ "Mới"
                    const insertMembershipCardSql = 'INSERT INTO membership_cards (user_id, membership_card_id, point) VALUES (?, ?, ?)';
                    connection.query(insertMembershipCardSql, [newUserId, defaultTierId, 0], (err, cardResults) => {
                        if (err) return res.status(500).json({ error: 'Lỗi khi tạo thẻ thành viên.', details: err });

                        res.status(201).json({
                            message: 'Đăng ký tài khoản thành công và cấp thẻ "Mới".',
                        });
                    });
                });
            });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi trong quá trình đăng ký.', error });
        }
    });
});

// Đăng nhập
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ?';

    connection.query(query, [email], (err, rows) => {
        if (err) {
            return res.status(500).send('Lỗi không xác định');
        }

        // Kiểm tra nếu không tìm thấy tài khoản (email)
        if (rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Tài khoản không tồn tại, vui lòng kiểm tra lại'
            });
        }

        const user = rows[0];

        console.log("Check user:: ", user);

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).json({ status: 'error', message: 'Lỗi không xác định' });
            }

            // Kiểm tra nếu mật khẩu không khớp
            if (!isMatch) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Tài khoản/mật khẩu không chính xác, vui lòng thử lại!'
                });
            }

            // Tạo access token có thời hạn 1 giờ
            const token = jwt.sign(
                { id: user.id, email: user.email, name: user.fullname, avatar: user.avatar },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Tạo đối tượng người dùng không có trường password
            const { password, ...userWithoutPassword } = user;

            return res.json({
                message: "Đăng nhập thành công!",
                user: userWithoutPassword,
                accessToken: token
            });
        });
    });
});



// Quên mật khẩu

router.post('/forgot-password', (req, res) => {
    const { email } = req.body;

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


            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Lỗi khi gửi email:', error);
                    return res.status(500).json({ status: 500, message: 'Lỗi khi gửi email' });
                } else {
                    return res.status(200).json({ status: 200, message: 'Email đặt lại mật khẩu đã được gửi' });
                }
            });
        });
    });
});


router.post('/change-password', (req, res) => {
    const { token, newPassword } = req.body;

    const query = 'SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiration > ?';
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

            return res.status(200).json({ status: 'success', message: 'Đổi mật khẩu thành công' });
        });
    });
});


module.exports = router;
