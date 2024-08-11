const express = require('express');
const router = express.Router();
const connection = require('../../index');
const bcrypt = require('bcrypt');


const saltRounds = 10;

// Lấy tất cả danh sách tài khoản khách hàng với phân trang
router.get('/', (req, res) => {
    const { search = '', page = 1, pageSize = 10 } = req.query;

    // Đảm bảo page và pageSize là số nguyên
    const pageNumber = parseInt(page, 10) || 1;
    const size = parseInt(pageSize, 10) || 10;
    const offset = (pageNumber - 1) * size;

    // SQL truy vấn để lấy tổng số bản ghi
    const sqlCount = 'SELECT COUNT(*) as total FROM employees WHERE fullname LIKE ?';
    
    // SQL truy vấn để lấy danh sách khách hàng phân trang
    let sql = 'SELECT * FROM employees WHERE fullname LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?';

    // Đếm tổng số bản ghi khớp với tìm kiếm
    connection.query(sqlCount, [`%${search}%`], (err, countResults) => {
        if (err) {
            console.error('Error counting employees:', err);
            return res.status(500).json({ error: 'Failed to count employees' });
        }

        const totalCount = countResults[0].total;
        const totalPages = Math.ceil(totalCount / size); // Tính tổng số trang

        // Lấy danh sách khách hàng cho trang hiện tại
        connection.query(sql, [`%${search}%`, size, offset], (err, results) => {
            if (err) {
                console.error('Error fetching employees:', err);
                return res.status(500).json({ error: 'Failed to fetch employees' });
            }

            // Trả về kết quả với thông tin phân trang
            res.status(200).json({
                message: 'Show list employees successfully',
                results,
                totalCount,
                totalPages,
                currentPage: pageNumber
            });
        });
    });
});

// *Lấy thông tin nhân viên theo id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM employees WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error fetching category:', err);
            return res.status(500).json({ error: 'Failed to fetch employees' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Employees not found' });
        }
        res.status(200).json(results[0]);
    });
});

// *Thêm nhân viên mới
router.post('/', (req, res) => {
    const { fullname , avatar , email , tel , address , password , role_id , status } = req.body;

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
    if (!role_id === undefined) {
        return res.status(400).json({ error: 'Role is required' });
    }
    if (!status === undefined) {
        return res.status(400).json({ error: 'Status is required' });
    }

    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).json({ error: 'Failed to hash password' });
        }

    const sql = 'INSERT INTO employees (fullname , avatar , email , tel , address , password , role_id , status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    connection.query(sql, [fullname , avatar , email , tel , address , hashedPassword , role_id , status], (err, results) => {
        if (err) {
            console.error('Error creating category:', err);
            return res.status(500).json({ error: 'Failed to create employees' });
        }
        res.status(201).json({ message: "Thêm nhân viên thành công",  employeeId: results.insertId });
    });
});
});

// *Cập nhật danh mục blog theo id bằng phương thức patch
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    if (!updates.fullname) {
        return res.status(400).json({ error: 'Fullname is required' });
    }
    if (!updates.email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    if (!updates.tel) {
        return res.status(400).json({ error: 'Tel is required' });
    }
    if (!updates.address) {
        return res.status(400).json({ error: 'Address is required' });
    }
    if (!updates.password) {
        return res.status(400).json({ error: 'Password is required' });
    }
    if (!updates.role_id === undefined) {
        return res.status(400).json({ error: 'Role is required' });
    }
    if (!updates.status === undefined) {
        return res.status(400).json({ error: 'Status is required' });
    }

    if (updates.password) {
        try {
            updates.password = await bcrypt.hash(updates.password, saltRounds);
        } catch (err) {
            console.error('Error hashing password:', err);
            return res.status(500).json({ error: 'Failed to update employee' });
        }
    }

    let sql = 'UPDATE employees SET ';
    const values = [];
    for (const [key, value] of Object.entries(updates)) {
        if (key !== 'updated_at') {
            sql += `${key} = ?, `;
            values.push(value);
        }
    }
    sql += 'updated_at = NOW() WHERE id = ?';
    values.push(id);

    connection.query(sql, values, (err, results) => {
        if (err) {
            console.error('Error updating employee blog:', err);
            return res.status(500).json({ error: 'Failed to update employee' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.status(200).json({ message: 'Employee updated successfully' });
    });
});

// *Xóa nhân viên theo id
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM employees WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error deleting employees:', err);
            return res.status(500).json({ error: 'Failed to delete employees' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Employees not found' });
        }
        res.status(200).json({ message: 'Employees deleted successfully' });
    });
});

module.exports = router;