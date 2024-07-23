const express = require('express');
const router = express.Router();
const connection = require('../../index');

// *Lấy tất cả danh sách danh mục blog
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM category_blogs';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching blog categories:', err);
            return res.status(500).json({ error: 'Failed to fetch blog categories' });
        }
        res.status(200).json(results);
    });
});

// *Lấy thông tin danh mục blog theo id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM category_blogs WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error fetching blog category:', err);
            return res.status(500).json({ error: 'Failed to fetch blog category' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Blog category not found' });
        }
        res.status(200).json(results[0]);
    });
});

// *Thêm danh mục blog mới
router.post('/', (req, res) => {
    const { name } = req.body;
    const sql = 'INSERT INTO category_blogs (name) VALUES (?)';
    connection.query(sql, [name], (err, results) => {
        if (err) {
            console.error('Error creating blog category:', err);
            return res.status(500).json({ error: 'Failed to create blog category' });
        }
        res.status(201).json({ message: "Blog category added successfully" });
    });
});

// *Cập nhật danh mục blog theo id bằng phương thức put
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const sql = 'UPDATE category_blogs SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [name, id], (err, results) => {
        if (err) {
            console.error('Error updating blog category:', err);
            return res.status(500).json({ error: 'Failed to update blog category' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Blog category not found' });
        }
        res.status(200).json({ message: "Blog category updated successfully" });
    });
});

// *Cập nhật danh mục blog theo id bằng phương thức patch
router.patch('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const sql = 'UPDATE category_blogs SET ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [updates, id], (err, results) => {
        if (err) {
            console.error('Error partially updating blog category:', err);
            return res.status(500).json({ error: 'Failed to partially update blog category' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Blog category not found' });
        }
        res.status(200).json({ message: "Blog category partially updated successfully" });
    });
});

// *Xóa danh mục blog theo id
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM category_blogs WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error deleting blog category:', err);
            return res.status(500).json({ error: 'Failed to delete blog category' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Blog category not found' });
        }
        res.status(200).json({ message: 'Blog category deleted successfully' });
    });
});

module.exports = router;
