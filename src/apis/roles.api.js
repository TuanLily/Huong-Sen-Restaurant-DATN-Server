const express = require('express');
const router = express.Router();
const connection = require('../../index');

// *Lấy tất cả danh sách vai trò
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM roles order by id desc';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Lỗi khi lấy danh sách vai trò:', err);
            return res.status(500).json({ error: 'Không thể lấy danh sách vai trò' });
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
            console.error('Lỗi khi lấy thông tin vai trò:', err);
            return res.status(500).json({ error: 'Không thể lấy thông tin vai trò' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy vai trò' });
        }
        res.status(200).json(results[0]);
    });
});

// *Thêm vai trò mới
router.post('/', (req, res) => {
    const { name, description } = req.body;

    if(!name){
        return res.status(404).json({ error: 'Name is required' });
    }
    if(!description){
        return res.status(404).json({ error: 'Description is required' });
    }

    const sql = 'INSERT INTO roles (name, description) VALUES (?, ?)';
    connection.query(sql, [name, description], (err, results) => {
        if (err) {
            console.error('Lỗi khi tạo vai trò:', err);
            return res.status(500).json({ error: 'Không thể tạo vai trò' });
        }
        res.status(201).json({ message: "Thêm vai trò thành công",  roleId: results.insertId });
    });
});

// *Cập nhật vai trò theo id bằng phương thức put
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    if(!name){
        return res.status(404).json({ error: 'Name is required' });
    }
    if(!description){
        return res.status(404).json({ error: 'Description is required' });
    }

    const sql = 'UPDATE roles SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [name, description, id], (err, results) => {
        if (err) {
            console.error('Lỗi khi cập nhật vai trò:', err);
            return res.status(500).json({ error: 'Không thể cập nhật vai trò' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy vai trò' });
        }
        res.status(200).json({ message: "Cập nhật vai trò thành công" });
    });
});

// *Cập nhật vai trò theo id bằng phương thức patch
router.patch('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    if(!updates.name){
        return res.status(404).json({ error: 'Name is required' });
    }
    if(!updates.description){
        return res.status(404).json({ error: 'Description is required' });
    }

    const sql = 'UPDATE roles SET ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [updates, id], (err, results) => {
        if (err) {
            console.error('Lỗi khi cập nhật một phần vai trò:', err);
            return res.status(500).json({ error: 'Không thể cập nhật một phần vai trò' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy vai trò' });
        }
        res.status(200).json({ message: "Cập nhật một phần vai trò thành công" });
    });
});

// *Xóa vai trò theo id
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM roles WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Lỗi khi xóa vai trò:', err);
            return res.status(500).json({ error: 'Không thể xóa vai trò' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy vai trò' });
        }
        res.status(200).json({ message: 'Xóa vai trò thành công' });
    });
});

module.exports = router;
