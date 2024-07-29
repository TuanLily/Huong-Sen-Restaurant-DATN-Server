const express = require('express');
const router = express.Router();
const connection = require('../../index');

// *Lấy tất cả danh sách danh mục blog
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM blog_categories';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Lỗi khi lấy danh sách danh mục blog:', err);
            return res.status(500).json({ error: 'Không thể lấy danh sách danh mục blog' });
        }
        res.status(200).json(results);
    });
});

// *Lấy thông tin danh mục blog theo id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM blog_categories WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Lỗi khi lấy thông tin danh mục blog:', err);
            return res.status(500).json({ error: 'Không thể lấy thông tin danh mục blog' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy danh mục blog' });
        }
        res.status(200).json(results[0]);
    });
});

// *Thêm danh mục blog mới
router.post('/', (req, res) => {
    const { name, status } = req.body;
    const sql = 'INSERT INTO blog_categories (name, status) VALUES (?, ?)';
    connection.query(sql, [name, status], (err, results) => {
        if (err) {
            console.error('Lỗi khi tạo danh mục blog:', err);
            return res.status(500).json({ error: 'Không thể tạo danh mục blog' });
        }
        res.status(201).json({ message: "Thêm danh mục blog thành công" });
    });
});

// *Cập nhật danh mục blog theo id bằng phương thức put
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, status } = req.body;
    const sql = 'UPDATE blog_categories SET name = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [name, status, id], (err, results) => {
        if (err) {
            console.error('Lỗi khi cập nhật danh mục blog:', err);
            return res.status(500).json({ error: 'Không thể cập nhật danh mục blog' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy danh mục blog' });
        }
        res.status(200).json({ message: "Cập nhật danh mục blog thành công" });
    });
});

// *Cập nhật danh mục blog theo id bằng phương thức patch
router.patch('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const sql = 'UPDATE blog_categories SET ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [updates, id], (err, results) => {
        if (err) {
            console.error('Lỗi khi cập nhật một phần danh mục blog:', err);
            return res.status(500).json({ error: 'Không thể cập nhật một phần danh mục blog' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy danh mục blog' });
        }
        res.status(200).json({ message: "Cập nhật một phần danh mục blog thành công" });
    });
});

// *Xóa danh mục blog theo id
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM blog_categories WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Lỗi khi xóa danh mục blog:', err);
            return res.status(500).json({ error: 'Không thể xóa danh mục blog' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy danh mục blog' });
        }
        res.status(200).json({ message: 'Xóa danh mục blog thành công' });
    });
});

module.exports = router;
