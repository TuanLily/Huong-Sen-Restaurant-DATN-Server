const express = require('express');
const router = express.Router();
const connection = require('../../index');
const bcrypt = require('bcrypt');


const saltRounds = 10;


// Lấy tất cả danh sách tài khoản khách hàng với phân trang
router.get('/', (req, res) => {
    const { search = '', page = 1, pageSize = 5 } = req.query;

    // Đảm bảo page và pageSize là số nguyên
    const pageNumber = parseInt(page, 10) || 1;
    const size = parseInt(pageSize, 10) || 5;
    const offset = (pageNumber - 1) * size;

    // SQL truy vấn để lấy tổng số bản ghi
    const sqlCount = 'SELECT COUNT(*) as total FROM customer WHERE fullname LIKE ?';

    // SQL truy vấn để lấy danh sách khách hàng phân trang
    let sql = 'SELECT * FROM customer WHERE fullname LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?';

    // Đếm tổng số bản ghi khớp với tìm kiếm
    connection.query(sqlCount, [`%${search}%`], (err, countResults) => {
        if (err) {
            console.error('Error counting customers:', err);
            return res.status(500).json({ error: 'Failed to count customers' });
        }

        const totalCount = countResults[0].total;
        const totalPages = Math.ceil(totalCount / size); // Tính tổng số trang

        // Lấy danh sách khách hàng cho trang hiện tại
        connection.query(sql, [`%${search}%`, size, offset], (err, results) => {
            if (err) {
                console.error('Error fetching customers:', err);
                return res.status(500).json({ error: 'Failed to fetch customers' });
            }

            // Trả về kết quả với thông tin phân trang
            res.status(200).json({
                message: 'Show list customer successfully',
                results,
                totalCount,
                totalPages,
                currentPage: pageNumber
            });
        });
    });
});



// *Lấy thông tin tài khoản khách hàng theo id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM customer WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error fetching customer:', err);
            return res.status(500).json({ error: 'Failed to fetch customer' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.status(200).json({
            message: 'Show information customer successfully',
            data: results[0]
        });
    });
});

// *Thêm mới tài khoản với mật khẩu được mã hóa
router.post('/', async (req, res) => {
    const { fullname, avatar, email, tel, address, password } = req.body;

    if (!fullname) {
        return res.status(400).json({ error: 'Fullname is required' });
    }
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    if (!tel) {
        return res.status(400).json({ error: 'Tel is required' });
    }
    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }
    if (!password) {
        return res.status(400).json({ error: 'Password is required' });
    }

    try {
        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Tạo SQL query
        const sql = `INSERT INTO customer (fullname, avatar, email, tel, address, password) VALUES (?, ?, ?, ?, ?, ?)`;
        const values = [fullname, avatar, email, tel, address, hashedPassword];

        // Thực thi query
        connection.query(sql, values, (err, results) => {
            if (err) {
                console.error('Error creating customer:', err);
                return res.status(500).json({ error: 'Failed to create customer' });
            }
            res.status(201).json({
                message: 'Customer created successfully',
                customerId: results.insertId,
            });
        });
    } catch (err) {
        console.error('Error hashing password:', err);
        return res.status(500).json({ error: 'Failed to create customer' });
    }
});


// *Cập nhật tài khoản khách hàng theo id bằng phương thức patch
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Kiểm tra nếu có trường mật khẩu thì mã hóa nó
    if (updates.password) {
        try {
            updates.password = await bcrypt.hash(updates.password, saltRounds);
        } catch (err) {
            console.error('Error hashing password:', err);
            return res.status(500).json({ error: 'Failed to update customer' });
        }
    }

    // Tạo mảng giá trị và câu lệnh SQL động
    let sql = 'UPDATE customer SET ';
    const values = [];
    for (const [key, value] of Object.entries(updates)) {
        sql += `${key} = ?, `;
        values.push(value);
    }
    sql += 'updated_at = NOW() WHERE id = ?';
    values.push(id);

    // Thực thi query
    connection.query(sql, values, (err, results) => {
        if (err) {
            console.error('Error updating customer:', err);
            return res.status(500).json({ error: 'Failed to update customer' });
        }
        res.status(200).json({
            message: 'Customer updated successfully'
        });
    });
});



// *Xóa tài khoản khách hàng theo id
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM customer WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error deleting customer:', err);
            return res.status(500).json({ error: 'Failed to delete customer' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.status(200).json({ message: 'Customer deleted successfully' });
    });
});

router.post('/check-password', (req, res) => {
    const { email, currentPassword } = req.body;

    const sql = 'SELECT * FROM customer WHERE email = ?';
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