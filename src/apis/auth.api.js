const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Nếu bạn muốn sử dụng JWT
const connection = require('../../index');

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET_KEY; // Thay thế bằng secret key của bạn

// Đăng nhập
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Tìm khách hàng theo email
    const sql = 'SELECT * FROM customer WHERE email = ?';
    connection.query(sql, [email], async (err, results) => {
        if (err) {
            console.error('Error fetching customer:', err);
            return res.status(500).json({ error: 'Failed to fetch customer' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const customer = results[0];

        // Kiểm tra mật khẩu
        try {
            const isMatch = await bcrypt.compare(password, customer.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // Tạo JWT token nếu cần
            const accessToken = jwt.sign({ id: customer.id }, JWT_SECRET, { expiresIn: '1h' });
            const refreshToken = jwt.sign({ id: customer.id }, JWT_SECRET, { expiresIn: '15d' });

            res.status(200).json({
                message: 'Login successful',
                data: {
                    fullname: customer.fullname,
                    email: customer.email,
                    avatar: customer.avatar,
                    tel: customer.tel,
                    address: customer.address,
                },
                accessToken: accessToken,
                refreshToken: refreshToken,
            });
        } catch (err) {
            console.error('Error comparing passwords:', err);
            return res.status(500).json({ error: 'Failed to log in customer' });
        }
    });
});

// Endpoint để lưu thông tin người dùng
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

    const getUserSql = 'SELECT fullname, email, avatar FROM customer WHERE email = ?';
    connection.query(getUserSql, [email], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err });
        }

        if (result.length > 0) {
            // Nếu người dùng tồn tại, gửi thông tin người dùng về client
            const user = result[0];
            res.json({
                success: true,
                user
            });
        } else {
            // Nếu người dùng không tồn tại
            res.status(404).json({ error: 'User not found' });
        }
    });
});


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





module.exports = router;
