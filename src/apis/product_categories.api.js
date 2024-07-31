const express = require('express');
const router = express.Router();
const connection = require('../../index');


// *Lấy tất cả danh sách danh mục sản phẩm
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM product_categories order by id DESC';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return res.status(500).json({ error: 'Failed to fetch categories' });
        }
        res.status(200).json({ message: 'Show list product successfully', results });
    });
});

// *Lấy thông tin danh mục sản phẩm theo id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM product_categories WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error fetching category:', err);
            return res.status(500).json({ error: 'Failed to fetch category' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(200).json({
            message: 'Show information Category successfully',
            data: results[0]
        });
    });
});

// *Thêm danh mục sản phẩm mới
router.post('/', (req, res) => {
    const { name , status } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    const sql = 'INSERT INTO product_categories (name , status) VALUES (?, ?)';
    connection.query(sql, [name, status], (err, results) => {
        if (err) {
            console.error('Error creating category:', err);
            return res.status(500).json({ error: 'Failed to create category' });
        }
        res.status(201).json({ message: "Category products add new successfully" });
    });
});

// *Cập nhật danh mục sản phẩm theo id bằng phương thức put
router.put('/:id', (req, res) => {
    const { id } = req.params
    const { name } = req.body;
    const sql = 'UPDATE product_categories SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [name, id], (err, results) => {
        if (err) {
            console.error('Error updating category:', err);
            return res.status(500).json({ error: 'Failed to update category' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(200).json({ message: "Category products update successfully" });
    });
});

// *Cập nhật danh mục sản phẩm theo id bằng phương thức patch
router.patch('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const sql = 'UPDATE product_categories SET ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [updates, id], (err, results) => {
        if (err) {
            console.error('Error partially updating category:', err);
            return res.status(500).json({ error: 'Failed to partially update category' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(200).json({ message: "Category products update successfully" });
    });
});

// *Xóa danh mục sản phẩm theo id
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM product_categories WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error deleting category:', err);
            return res.status(500).json({ error: 'Failed to delete category' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(200).json({ message: 'Category deleted successfully' });
    });
});

module.exports = router;