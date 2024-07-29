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
router.post('/login-google', async (req, res) => {
    const { fullname, email, avatar } = req.body;

    // Giá trị mặc định cho các trường không thể null
    const defaultTel = '';
    const defaultAddress = '';
    const defaultPassword = '';

    try {
        const sql = `
            INSERT INTO customer (fullname, email, avatar, tel, address, password) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        connection.query(sql, [fullname, email, avatar, defaultTel, defaultAddress, defaultPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: 'Database error', details: err });
            }
            res.send('User saved successfully');
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error });
    }
});



module.exports = router;
