const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Nếu bạn muốn sử dụng JWT
const connection = require('../../index');

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET_KEY; // Thay thế bằng secret key của bạn

// Đăng nhập
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    // Tìm nhân viên theo tên
    const sql = 'SELECT * FROM employees WHERE username = ?';
    connection.query(sql, [username], async (err, results) => {
        if (err) {
            console.error('Error fetching employee:', err);
            return res.status(500).json({ error: 'Failed to fetch employees' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid username or employees', message: "Tên đăng nhập hoặc mật khẩu không đúng" });
        }

        const employee = results[0];

        // Kiểm tra mật khẩu
        try {
            const isMatch = await bcrypt.compare(password, employee.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid username or password', message: "Tên đăng nhập hoặc mật khẩu không đúng" });
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
            return res.status(500).json({ error: 'Failed to log in employee' });
        }
    });
});

module.exports = router;