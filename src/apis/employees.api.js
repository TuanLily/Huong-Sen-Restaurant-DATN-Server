const express = require('express');
const router = express.Router();
const connection = require('../../index');

// *Lấy tất cả danh sách nhân viên
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM employees';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching employees:', err);
            return res.status(500).json({ error: 'Failed to fetch employees' });
        }
        res.status(200).json(results);
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
    const { fullname , username , avatar , email , tel , address , password , role_id , status } = req.body;
    const sql = 'INSERT INTO employees (fullname , username , avatar , email , tel , address , password , role_id , status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    connection.query(sql, [fullname , username , avatar , email , tel , address , password , role_id , status], (err, results) => {
        if (err) {
            console.error('Error creating category:', err);
            return res.status(500).json({ error: 'Failed to create employees' });
        }
        res.status(201).json({ message: "Employees add new successfully" });
    });
});

// *Cập nhật nhân viên id bằng phương thức put
router.put('/:id', (req, res) => {
    const { id } = req.params
    const { fullname , username , avatar , email , tel , address , password , role_id , status } = req.body;
    const sql = 'UPDATE employees SET fullname = ?, username = ?, avatar = ?, email = ?, tel = ?, address = ?, password = ?, role_id = ?, status = ? , updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [fullname , username , avatar , email , tel , address , password , role_id , status , id], (err, results) => {
        if (err) {
            console.error('Error updating employees:', err);
            return res.status(500).json({ error: 'Failed to update employees' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Employees not found' });
        }
        res.status(200).json({ message: "Employees update successfully" });
    });
});

// *Cập nhật nhân viên theo id bằng phương thức patch
router.patch('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const sql = 'UPDATE employees SET ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [updates, id], (err, results) => {
        if (err) {
            console.error('Error partially updating employees:', err);
            return res.status(500).json({ error: 'Failed to partially update employees' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Employees not found' });
        }
        res.status(200).json({ message: "Employees products update successfully" });
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