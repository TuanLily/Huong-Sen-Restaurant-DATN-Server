// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();


const JWT_SECRET = process.env.JWT_SECRET_KEY;

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json("Token không có hoặc không hợp lệ hoặc không có quyền truy cập"); // Thông báo lỗi chi tiết khi không có token
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json("Không có quyền truy cập"); // Thông báo lỗi khi token không hợp lệ
        }

        req.user = user; 
        next(); // Chuyển đến middleware hoặc route tiếp theo
    });
};

module.exports = authenticateToken;
