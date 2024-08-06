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

    // Bước 1: Kiểm tra xem danh mục có sản phẩm liên kết hay không
    const checkSql = 'SELECT * FROM products WHERE categories_id = ?';
    connection.query(checkSql, [id], (err, results) => {
        if (err) {
            console.error('Error checking products:', err);
            return res.status(500).json({ error: 'Failed to check products' });
        }

        if (results.length > 0) {
            // Bước 2: Tạo danh mục mới
            const newCategoryName = `New Category for ${id}`; // Tên danh mục mới có thể tùy chỉnh
            const createSql = 'INSERT INTO product_categories (name, status) VALUES (?, ?)';
            connection.query(createSql, [newCategoryName, 1], (err, newCategoryResults) => {
                if (err) {
                    console.error('Error creating new category:', err);
                    return res.status(500).json({ error: 'Failed to create new category' });
                }

                const newCategoryId = newCategoryResults.insertId;

                // Bước 3: Cập nhật tất cả sản phẩm sang danh mục mới
                const updateSql = 'UPDATE products SET categories_id = ? WHERE categories_id = ?';
                connection.query(updateSql, [newCategoryId, id], (err) => {
                    if (err) {
                        console.error('Error updating products:', err);
                        return res.status(500).json({ error: 'Failed to update products' });
                    }

                    // Bước 4: Xóa danh mục cũ
                    const deleteSql = 'DELETE FROM product_categories WHERE id = ?';
                    connection.query(deleteSql, [id], (err) => {
                        if (err) {
                            console.error('Error deleting category:', err);
                            return res.status(500).json({ error: 'Failed to delete category' });
                        }
                        res.status(200).json({ message: 'Category deleted and products reassigned successfully' });
                    })
                })
            })
        } else {
            const deleteSql = 'DELETE FROM product_categories WHERE id = ?';
            connection.query(deleteSql, [id], (err) => {
                if (err) {
                    console.error('Error deleting category:', err);
                    return res.status(500).json({ error: 'Failed to delete category' });
                }
                res.status(200).json({ message: 'Category deleted and products reassigned successfully' });
            })
        }
    })
});

module.exports = router;