const express = require('express');
const router = express.Router();
const connection = require('../../index');

// *Lấy tất cả danh sách sản phẩm
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM products order by id DESC';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ error: 'Failed to fetch products' });
        }
        res.status(200).json({ message: 'Show list product successfully', results });
    });
});

// *Lấy thông tin sản phẩm theo id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM products WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ error: 'Failed to fetch products' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Products not found' });
        }
        res.status(200).json({
            message: 'Show information products successfully',
            data: results[0]
        });
    });
});

// *Thêm sản phẩm mới
router.post('/', (req, res) => {
    const { product_code , name , image , price , sale_price , description , status , category_id } = req.body;

    if (!product_code) {
        return res.status(400).json({ error: 'Product_code is required' });
    }
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    if (!image) {
        return res.status(400).json({ error: 'Image is required' });
    }
    if (!price) {
        return res.status(400).json({ error: 'Price is required' });
    }
    if (!sale_price) {
        return res.status(400).json({ error: 'Sale_price is required' });
    }
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }
    if (!category_id) {
        return res.status(400).json({ error: 'Category_id is required' });
    }

    const sql = 'INSERT INTO products (product_code , name , image , price , sale_price , description , status , categories_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    connection.query(sql, [product_code , name , image , price , sale_price , description , status , category_id], (err, results) => {
        if (err) {
            console.error('Error creating products:', err);
            return res.status(500).json({ error: 'Failed to create products', customerId: results.insertId });
        }
        res.status(201).json({ message: "Products add new successfully" });
    });
});

// *Cập nhật sản phẩm id bằng phương thức put
router.put('/:id', (req, res) => {
    const { id } = req.params
    const { product_code , name , image , price , sale_price , description , status , category_id } = req.body;
    const sql = 'UPDATE products SET product_code = ?, name = ?, image = ?, price = ?, sale_price = ?, description = ?, status = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [product_code , name , image , price , sale_price , description , status , category_id , id], (err, results) => {
        if (err) {
            console.error('Error updating products:', err);
            return res.status(500).json({ error: 'Failed to update products' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Products not found' });
        }
        res.status(200).json({ message: "Products update successfully" });
    });
});

// *Cập nhật sản phẩm theo id bằng phương thức patch
router.patch('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const sql = 'UPDATE products SET ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [updates, id], (err, results) => {
        if (err) {
            console.error('Error partially updating products:', err);
            return res.status(500).json({ error: 'Failed to partially update products' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Products not found' });
        }
        res.status(200).json({ message: "Products update successfully" });
    });
});

// *Xóa sản phẩm theo id
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM products WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error deleting products:', err);
            return res.status(500).json({ error: 'Failed to delete products' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Products not found' });
        }
        res.status(200).json({ message: 'Products deleted successfully' });
    });
});

module.exports = router;