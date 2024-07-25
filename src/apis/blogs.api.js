const express = require('express');
const router = express.Router();
const connection = require('../../index');

// *Lấy tất cả danh sách blog
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM blogs';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching blogs:', err);
            return res.status(500).json({ error: 'Failed to fetch blogs' });
        }
        res.status(200).json(results);
    });
});

// *Lấy thông tin blog theo id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM blogs WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error fetching blog:', err);
            return res.status(500).json({ error: 'Failed to fetch blog' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        res.status(200).json(results[0]);
    });
});

// *Thêm blog mới
router.post('/', (req, res) => {
    const { poster, title, content, author } = req.body;
    const sql = 'INSERT INTO blogs (poster, title, content, author  ) VALUES (?, ?, ?, ?)';
    connection.query(sql, [poster, title, content, author,  ], (err, results) => {
        if (err) {
            console.error('Error creating blog:', err);
            return res.status(500).json({ error: 'Failed to create blog' });
        }
        res.status(201).json({ message: "Blog added successfully" });
    });
});

// *Cập nhật blog theo id bằng phương thức put
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { poster, title, content, author  } = req.body;
    const sql = 'UPDATE blogs SET poster = ?, title = ?, content = ?, author = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [poster, title, content, author, id], (err, results) => {
        if (err) {
            console.error('Error updating blog:', err);
            return res.status(500).json({ error: 'Failed to update blog' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        res.status(200).json({ message: "Blog updated successfully" });
    });
});

// *Cập nhật blog theo id bằng phương thức patch
router.patch('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const sql = 'UPDATE blogs SET ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [updates, id], (err, results) => {
        if (err) {
            console.error('Error partially updating blog:', err);
            return res.status(500).json({ error: 'Failed to partially update blog' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        res.status(200).json({ message: "Blog partially updated successfully" });
    });
});

// *Xóa blog theo id
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM blogs WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error deleting blog:', err);
            return res.status(500).json({ error: 'Failed to delete blog' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        res.status(200).json({ message: 'Blog deleted successfully' });
    });
});

module.exports = router;
