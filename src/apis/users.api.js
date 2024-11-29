const express = require('express');
const router = express.Router();
const connection = require('../../index'); // Giả sử bạn đã thiết lập kết nối MySQL trong `index.js`
const bcrypt = require('bcrypt');
const saltRounds = 10;

// Lấy tất cả người dùng
router.get('/', (req, res) => {
    const { search = '', page = 1, limit = 10 } = req.query;

    // Chuyển đổi giá trị limit thành số nguyên, mặc định là 10 nếu không có
    const limitNumber = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10; // Kiểm tra limit có phải là số nguyên dương không, nếu không thì dùng 10

    // Chuyển đổi giá trị page thành số nguyên
    const pageNumber = parseInt(page, 10);
    const offset = (pageNumber - 1) * limitNumber; // Tính toán offset
    const searchTerm = `%${search}%`; // Thêm dấu % cho tìm kiếm

    // Câu truy vấn đếm tổng số người dùng
    const sqlCount = 'SELECT COUNT(*) as total FROM users WHERE fullname LIKE ?';

    // Câu truy vấn lấy danh sách người dùng
    let sql = 'SELECT * FROM users WHERE fullname LIKE ? ORDER BY id DESC';

    // Nếu có phân trang, thêm LIMIT và OFFSET
    const queryParams = [searchTerm];
    if (page && limit) {
        sql += ' LIMIT ? OFFSET ?';
        queryParams.push(limitNumber, offset);
    }

    // Đầu tiên, lấy tổng số bản ghi để tính tổng số trang
    connection.query(sqlCount, [searchTerm], (err, countResults) => {
        if (err) {
            console.error('Error counting users:', err);
            return res.status(500).json({ error: 'Failed to count users' });
        }

        const totalCount = countResults[0].total; // Tổng số người dùng
        const totalPages = Math.ceil(totalCount / limitNumber); // Tổng số trang

        // Tiếp theo, lấy danh sách người dùng
        connection.query(sql, queryParams, (err, results) => {
            if (err) {
                console.error('Error fetching users:', err);
                return res.status(500).json({ error: 'Failed to fetch users' });
            }

            // Trả về kết quả
            res.status(200).json({
                message: 'Show list users successfully',
                results,
                totalCount,
                totalPages, // Tổng số trang
                currentPage: pageNumber, // Trang hiện tại
                limit: limitNumber, // Số bản ghi trên mỗi trang (limit)
            });
        });
    });
});



// Lấy thông tin người dùng theo ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT 
            id, 
            fullname, 
            username, 
            email, 
            tel, 
            address, 
            avatar, 
            status, 
            user_type,
            role_id,
            salary
        FROM Users 
        WHERE id = ?`;

    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Error fetching user:", err);
            return res.status(500).json({ error: "Failed to fetch user" });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ result: results[0] });
    });
});


router.post('/check-email-exists', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const checkEmailSql = 'SELECT * FROM users WHERE email = ?';
    connection.query(checkEmailSql, [email], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }

        if (results.length > 0) {
            res.json({ exists: true, user: results[0] });
        } else {
            res.json({ exists: false });
        }
    });
});


// Tạo mới một người dùng
router.post('/', (req, res) => {
    const { fullname, username, avatar, email, tel, address, password, role_id, status, user_type, salary } = req.body;

    if (!user_type || (user_type !== 'Nhân Viên' && user_type !== 'Khách Hàng')) {
        return res.status(400).json({ error: "Không đúng định dạng Loại Người Dùng " });
    }

    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            console.error("Error hashing password:", err);
            return res.status(500).json({ error: "Lỗi khi tạo tài khoản" });
        }

        const sql = 'INSERT INTO Users (fullname, username, avatar, email, tel, address, password, role_id, status, user_type, salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        connection.query(sql, [fullname, username, avatar, email, tel, address, hash, role_id, status, user_type, salary], (err, results) => {
            if (err) {
                console.error("Error creating user:", err);
                return res.status(500).json({ error: "Lỗi khi tạo tài khoản" });
            }
            res.status(201).json({ message: "Tạo tài khoản thành công" });
        });
    });
});

// Cập nhật thông tin người dùng
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        // Kiểm tra nếu có trường mật khẩu thì mã hóa nó
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, saltRounds);
        }

        // Tạo mảng giá trị và câu lệnh SQL động
        let sql = 'UPDATE users SET ';
        const values = [];
        for (const [key, value] of Object.entries(updates)) {
            sql += `${key} = ?, `;
            values.push(value);
        }
        sql = sql.slice(0, -2); // Xóa dấu phẩy cuối cùng
        sql += ' WHERE id = ?';
        values.push(id);

        // Thực thi query
        connection.query(sql, values, (err, results) => {
            if (err) {
                console.error('Error updating user:', err);
                return res.status(500).json({ error: 'Failed to update user' });
            }
            res.status(200).json({
                message: 'User updated successfully'
            });
        });
    } catch (err) {
        console.error('Error in update process:', err);
        res.status(500).json({ error: 'Failed to update user' });
    }
});


// Xóa người dùng
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    // Câu lệnh kiểm tra xem user có tồn tại trong các bảng khác hay không
    const checkForeignKeySql = `
        SELECT COUNT(*) as count 
        FROM (
            SELECT id FROM membership_cards WHERE user_id = ? 
        ) as relatedRecords
    `;

    connection.query(checkForeignKeySql, [id], (checkError, checkResult) => {
        if (checkError) {
            console.error("Error checking foreign key constraints:", checkError);
            return res.status(500).json({ error: "Đã xảy ra lỗi khi kiểm tra khóa ngoại" });
        }

        const relatedCount = checkResult[0].count;

        if (relatedCount > 0) {
            // Nếu có bản ghi liên quan trong các bảng khác thì không cho phép xóa
            return res.status(400).json({ error: "Không thể xóa tài khoản" });
        }

        // Nếu không có ràng buộc khóa ngoại, tiến hành xóa user
        const deleteSql = 'DELETE FROM Users WHERE id = ?';

        connection.query(deleteSql, [id], (deleteError) => {
            if (deleteError) {
                console.error("Error deleting user:", deleteError);
                return res.status(500).json({ error: "Lỗi khi xóa tài khoản" });
            }
            res.status(200).json({ message: "Xóa tài khoản thành công" });
        });
    });
});

// Hàm kiểu tra nật khẩu dùng cho chức năng cập nhật tài khoản
router.post('/check-password', (req, res) => {
    const { email, currentPassword } = req.body;

    const sql = 'SELECT * FROM users WHERE email = ?';
    connection.query(sql, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch customer' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const user = results[0];
        bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            if (!isMatch) {
                return res.status(400).json({ error: 'Mật khẩu không chính xác' });
            }

            res.status(200).json({ message: 'Password is correct' });
        });
    });
});

module.exports = router;
