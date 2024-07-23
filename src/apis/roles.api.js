const express = require('express');
const router = express.Router();
const connection = require('../../index');

// *Lấy tất cả danh sách vai trò
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM roles';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching roles:', err);
            return res.status(500).json({ error: 'Failed to fetch roles' });
        }
        res.status(200).json(results);
    });
});

// *Lấy thông tin vai trò theo id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM roles WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error fetching role:', err);
            return res.status(500).json({ error: 'Failed to fetch role' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Role not found' });
        }
        res.status(200).json(results[0]);
    });
});

// *Thêm vai trò mới
router.post('/', (req, res) => {
    const { name } = req.body;
    const sql = 'INSERT INTO roles (name) VALUES (?)';
    connection.query(sql, [name], (err, results) => {
        if (err) {
            console.error('Error creating role:', err);
            return res.status(500).json({ error: 'Failed to create role' });
        }
        res.status(201).json({ message: "Role added successfully" });
    });
});

// *Cập nhật vai trò theo id bằng phương thức put
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const sql = 'UPDATE roles SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [name, id], (err, results) => {
        if (err) {
            console.error('Error updating role:', err);
            return res.status(500).json({ error: 'Failed to update role' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Role not found' });
        }
        res.status(200).json({ message: "Role updated successfully" });
    });
});

// *Cập nhật vai trò theo id bằng phương thức patch
router.patch('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const sql = 'UPDATE roles SET ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [updates, id], (err, results) => {
        if (err) {
            console.error('Error partially updating role:', err);
            return res.status(500).json({ error: 'Failed to partially update role' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Role not found' });
        }
        res.status(200).json({ message: "Role partially updated successfully" });
    });
});

// *Xóa vai trò theo id
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM roles WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error deleting role:', err);
            return res.status(500).json({ error: 'Failed to delete role' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Role not found' });
        }
        res.status(200).json({ message: 'Role deleted successfully' });
    });
});

module.exports = router;
