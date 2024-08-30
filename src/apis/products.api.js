const express = require('express');
const router = express.Router();
const connection = require('../../index');

// *Lấy tất cả danh sách sản phẩm
router.get('/', (req, res) => {
    const { search = '', page = 1, pageSize = 10 } = req.query;

    // Đảm bảo page và pageSize là số nguyên
    const pageNumber = parseInt(page, 10) || 1;
    const size = parseInt(pageSize, 10) || 10;
    const offset = (pageNumber - 1) * size;

    // SQL truy vấn để lấy tổng số bản ghi
    const sqlCount = 'SELECT COUNT(*) as total FROM products WHERE name LIKE ?';
    
    // SQL truy vấn để lấy danh sách promotion phân trang
    let sql = 'SELECT * FROM products WHERE name LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?';

    // Đếm tổng số bản ghi khớp với tìm kiếm
    connection.query(sqlCount, [`%${search}%`], (err, countResults) => {
        if (err) {
            console.error('Error counting products:', err);
            return res.status(500).json({ error: 'Failed to count products' });
        }

        const totalCount = countResults[0].total;
        const totalPages = Math.ceil(totalCount / size); // Tính tổng số trang

        // Lấy danh sách products cho trang hiện tại
        connection.query(sql, [`%${search}%`, size, offset], (err, results) => {
            if (err) {
                console.error('Error fetching products:', err);
                return res.status(500).json({ error: 'Failed to fetch products' });
            }

            // Trả về kết quả với thông tin phân trang
            res.status(200).json({
                message: 'Show list products successfully',
                results,
                totalCount,
                totalPages,
                currentPage: pageNumber
            });
        });
    });
});

// *Lấy tất cả danh sách sản phẩm hoạt động
router.get('/hoat_dong', (req, res) => {
    const { search = '', page = 1, pageSize = 10 } = req.query;

    // Đảm bảo page và pageSize là số nguyên
    const pageNumber = parseInt(page, 10) || 1;
    const size = parseInt(pageSize, 10) || 10;
    const offset = (pageNumber - 1) * size;

    // SQL truy vấn để lấy tổng số bản ghi
    const sqlCount = 'SELECT COUNT(*) as total FROM products WHERE name LIKE ? and status = ?';
    
    // SQL truy vấn để lấy danh sách promotion phân trang
    let sql = 'SELECT * FROM products WHERE name LIKE ? and status = ? ORDER BY id DESC LIMIT ? OFFSET ?';

    // Đếm tổng số bản ghi khớp với tìm kiếm
    connection.query(sqlCount, [`%${search}%` , 1], (err, countResults) => {
        if (err) {
            console.error('Error counting products:', err);
            return res.status(500).json({ error: 'Failed to count products' });
        }

        const totalCount = countResults[0].total;
        const totalPages = Math.ceil(totalCount / size); // Tính tổng số trang

        // Lấy danh sách products cho trang hiện tại
        connection.query(sql, [`%${search}%`, 1, size, offset], (err, results) => {
            if (err) {
                console.error('Error fetching products:', err);
                return res.status(500).json({ error: 'Failed to fetch products' });
            }

            // Trả về kết quả với thông tin phân trang
            res.status(200).json({
                message: 'Show list products successfully',
                results,
                totalCount,
                totalPages,
                currentPage: pageNumber
            });
        });
    });
});

// *Lấy tất cả danh sách sản phẩm ngưng hoạt động
router.get('/ngung_hoat_dong', (req, res) => {
    const { search = '', page = 1, pageSize = 10 } = req.query;

    // Đảm bảo page và pageSize là số nguyên
    const pageNumber = parseInt(page, 10) || 1;
    const size = parseInt(pageSize, 10) || 10;
    const offset = (pageNumber - 1) * size;

    // SQL truy vấn để lấy tổng số bản ghi
    const sqlCount = 'SELECT COUNT(*) as total FROM products WHERE name LIKE ? and status = ?';
    
    // SQL truy vấn để lấy danh sách promotion phân trang
    let sql = 'SELECT * FROM products WHERE name LIKE ? and status = ? ORDER BY id DESC LIMIT ? OFFSET ?';

    // Đếm tổng số bản ghi khớp với tìm kiếm
    connection.query(sqlCount, [`%${search}%`, 0], (err, countResults) => {
        if (err) {
            console.error('Error counting products:', err);
            return res.status(500).json({ error: 'Failed to count products' });
        }

        const totalCount = countResults[0].total;
        const totalPages = Math.ceil(totalCount / size); // Tính tổng số trang

        // Lấy danh sách products cho trang hiện tại
        connection.query(sql, [`%${search}%`, 0, size, offset], (err, results) => {
            if (err) {
                console.error('Error fetching products:', err);
                return res.status(500).json({ error: 'Failed to fetch products' });
            }

            // Trả về kết quả với thông tin phân trang
            res.status(200).json({
                message: 'Show list products successfully',
                results,
                totalCount,
                totalPages,
                currentPage: pageNumber
            });
        });
    });
});

// *Lấy thông tin sản phẩm theo slug
router.get('/slug/:slug', (req, res) => {
    const { slug } = req.params;
    // Tạo SQL để lấy thông tin sản phẩm
    const sql = 'SELECT * FROM products WHERE name = ?';
    const decodedSlug = decodeURIComponent(slug).replace(/\.html$/, '');
    const name = decodedSlug.split('-').join(' ');

    connection.query(sql, [name], (err, results) => {
        if (err) {
            console.error('Error fetching product by slug:', err);
            return res.status(500).json({ error: 'Failed to fetch product by slug' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json({
            message: 'Show information product successfully',
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