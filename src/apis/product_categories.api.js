const express = require('express');
const router = express.Router();
const connection = require('../../index');


// *Lấy tất cả danh sách danh mục sản phẩm
router.get('/', (req, res) => {
    const { search = '', page = 1, pageSize = 10 } = req.query;

    // Đảm bảo page và pageSize là số nguyên
    const pageNumber = parseInt(page, 10) || 1;
    const size = parseInt(pageSize, 10) || 10;
    const offset = (pageNumber - 1) * size;

    // SQL truy vấn để lấy tổng số bản ghi
    const sqlCount = 'SELECT COUNT(*) as total FROM product_categories WHERE name LIKE ?';

    // SQL truy vấn để lấy danh sách promotion phân trang
    let sql = 'SELECT * FROM product_categories WHERE name LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?';

    // Đếm tổng số bản ghi khớp với tìm kiếm
    connection.query(sqlCount, [`%${search}%`], (err, countResults) => {
        if (err) {
            console.error('Error counting product_categories:', err);
            return res.status(500).json({ error: 'Failed to count product_categories' });
        }

        const totalCount = countResults[0].total;
        const totalPages = Math.ceil(totalCount / size); // Tính tổng số trang

        // Lấy danh sách products cho trang hiện tại
        connection.query(sql, [`%${search}%`, size, offset], (err, results) => {
            if (err) {
                console.error('Error fetching product_categories:', err);
                return res.status(500).json({ error: 'Failed to fetch product_categories' });
            }

            // Trả về kết quả với thông tin phân trang
            res.status(200).json({
                message: 'Show list product_categories successfully',
                results,
                totalCount,
                totalPages,
                currentPage: pageNumber
            });
        });
    });
});

// *Lấy tất cả danh sách danh mục sản phẩm hoạt động
router.get('/hoat_dong', (req, res) => {
    const { search = '', page = 1, limit = 10 } = req.query;

    // Chuyển đổi giá trị limit thành số nguyên, mặc định là 10 nếu không có
    const limitNumber = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10; // Kiểm tra limit có phải là số nguyên dương không, nếu không thì dùng 10

    // Đảm bảo page và pageSize là số nguyên
    const pageNumber = parseInt(page, 10);
    const offset = (pageNumber - 1) * limitNumber; // Tính toán offset
    const sea = `%${search}%`; // Thêm dấu % cho tìm kiếm

    // SQL truy vấn để lấy tổng số bản ghi
    const sqlCount = 'SELECT COUNT(*) as total FROM product_categories WHERE status = ? and name LIKE ?';

    // SQL truy vấn để lấy danh sách promotion phân trang
    let sql = 'SELECT * FROM product_categories WHERE status = ? and name LIKE ? ORDER BY id DESC';

    // Nếu có phân trang, thêm LIMIT và OFFSET
    const queryParams = [1, sea];
    if (page && limit) {
        sql += ' LIMIT ? OFFSET ?';
        queryParams.push(limitNumber, offset);
    }

    // Đếm tổng số bản ghi khớp với tìm kiếm
    connection.query(sqlCount, [1, sea], (err, countResults) => {
        if (err) {
            console.error('Error counting product_categories:', err);
            return res.status(500).json({ error: 'Failed to count product_categories' });
        }

        const totalCount = countResults[0].total;
        const totalPages = Math.ceil(totalCount / limitNumber); // Tính tổng số trang

        // Lấy danh sách products cho trang hiện tại
        connection.query(sql, queryParams, (err, results) => {
            if (err) {
                console.error('Error fetching product_categories:', err);
                return res.status(500).json({ error: 'Failed to fetch product_categories' });
            }

            // Trả về kết quả với thông tin phân trang
            res.status(200).json({
                message: 'Show list product_categories successfully',
                results,
                totalCount,
                totalPages,
                currentPage: pageNumber,
                limit: limitNumber,
            });
        });
    });
});

// *Lấy tất cả danh sách danh mục sản phẩm hoạt động
router.get('/danh_muc', (req, res) => {
    const { search = '' } = req.query;

    // SQL truy vấn để lấy danh mục sản phẩm hoạt động
    const sql = 'SELECT * FROM product_categories WHERE name LIKE ? AND status = ? ORDER BY id ASC';

    // Lấy danh sách danh mục
    connection.query(sql, [`%${search}%`, 1], (err, results) => {
        if (err) {
            console.error('Error fetching product_categories:', err);
            return res.status(500).json({ error: 'Failed to fetch product categories' });
        }

        // Trả về kết quả
        res.status(200).json({
            message: 'Show list product categories successfully',
            results,
        });
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
    const { name, status } = req.body;

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
    const checkSql = 'SELECT * FROM product_categories WHERE id = ?';
    connection.query(checkSql, [id], (err, results) => {
        if (err) {
            console.error('Error checking category:', err);
            return res.status(500).json({ error: 'Failed to check category' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const categoryName = results[0].name;

        // Kiểm tra xem danh mục có tên "Chưa phân loại" không
        if (categoryName === 'Chưa phân loại') {
            return res.status(200).json({ error: 'Cannot delete "Chưa phân loại" category' });
        }

        // Bước 2: Kiểm tra xem danh mục có sản phẩm liên kết hay không
        const checkProductsSql = 'SELECT * FROM products WHERE categories_id = ?';
        connection.query(checkProductsSql, [id], (err, productsResults) => {
            if (err) {
                console.error('Error checking products:', err);
                return res.status(500).json({ error: 'Failed to check products' });
            }

            const hasProducts = productsResults.length > 0;

            if (hasProducts) {
                // Bước 3: Kiểm tra xem danh mục "Chưa phân loại" có tồn tại không
                const checkUncategorizedSql = 'SELECT * FROM product_categories WHERE name = ?';
                connection.query(checkUncategorizedSql, ['Chưa phân loại'], (err, uncategorizedResults) => {
                    if (err) {
                        console.error('Error checking uncategorized category:', err);
                        return res.status(500).json({ error: 'Failed to check uncategorized category' });
                    }

                    let uncategorizedId;

                    // Nếu danh mục "Chưa phân loại" không tồn tại, tạo mới
                    if (uncategorizedResults.length === 0) {
                        const createUncategorizedSql = 'INSERT INTO product_categories (name, status) VALUES (?, ?)';
                        connection.query(createUncategorizedSql, ['Chưa phân loại', 1], (err, newCategoryResults) => {
                            if (err) {
                                console.error('Error creating uncategorized category:', err);
                                return res.status(500).json({ error: 'Failed to create uncategorized category' });
                            }
                            uncategorizedId = newCategoryResults.insertId;
                            reassignProductsAndDeleteCategory(id, uncategorizedId, res);
                        });
                    } else {
                        uncategorizedId = uncategorizedResults[0].id;
                        reassignProductsAndDeleteCategory(id, uncategorizedId, res);
                    }
                });
            } else {
                // Nếu không có sản phẩm, xóa danh mục cũ ngay lập tức
                const deleteSql = 'DELETE FROM product_categories WHERE id = ?';
                connection.query(deleteSql, [id], (err) => {
                    if (err) {
                        console.error('Error deleting category:', err);
                        return res.status(500).json({ error: 'Failed to delete category' });
                    }
                    res.status(200).json({ message: 'Category deleted successfully' });
                });
            }
        });
    });
});

// Hàm để chuyển sản phẩm và xóa danh mục
function reassignProductsAndDeleteCategory(categoryId, uncategorizedId, res) {
    // Cập nhật tất cả sản phẩm sang danh mục "Chưa phân loại"
    const updateSql = 'UPDATE products SET categories_id = ? WHERE categories_id = ?';
    connection.query(updateSql, [uncategorizedId, categoryId], (err) => {
        if (err) {
            console.error('Error updating products:', err);
            return res.status(500).json({ error: 'Failed to update products' });
        }

        // Xóa danh mục cũ
        const deleteSql = 'DELETE FROM product_categories WHERE id = ?';
        connection.query(deleteSql, [categoryId], (err) => {
            if (err) {
                console.error('Error deleting category:', err);
                return res.status(500).json({ error: 'Failed to delete category' });
            }
            res.status(200).json({ message: 'Category deleted and products reassigned successfully' });
        });
    });
}

module.exports = router;