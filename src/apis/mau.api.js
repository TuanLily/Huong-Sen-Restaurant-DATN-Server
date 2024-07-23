const express = require('express');
const router = express.Router();
const connection = require('../../index');
const bcrypt = require('bcrypt');


const saltRounds = 10;


// *Lấy tất cả danh sách tài khoản khách hàng
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM customer';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return res.status(500).json({ error: 'Failed to fetch categories' });
        }
        res.status(200).json({ message: 'Show list customer successfully', results });
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

module.exports = router;