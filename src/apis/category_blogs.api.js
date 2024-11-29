const express = require('express');
const router = express.Router();
const connection = require('../../index');

// *Lấy tất cả danh sách danh mục blog với phân trang
router.get('/', (req, res) => {
    const { search = '', page = 1, limit = 5 } = req.query;

    // Chuyển đổi giá trị limit thành số nguyên, mặc định là 5 nếu không có
    const limitNumber = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 5;

    // Chuyển đổi giá trị page thành số nguyên
    const pageNumber = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const offset = (pageNumber - 1) * limitNumber; // Tính toán offset
    const searchTerm = `%${search}%`; // Thêm dấu % cho tìm kiếm

    // Câu truy vấn đếm tổng số danh mục blog
    const sqlCount = 'SELECT COUNT(*) as total FROM blog_categories WHERE name LIKE ?';

    // Câu truy vấn lấy danh sách danh mục blog
    let sql = 'SELECT * FROM blog_categories WHERE name LIKE ? ORDER BY id DESC';

    // Nếu có phân trang, thêm LIMIT và OFFSET
    const queryParams = [searchTerm];
    if (page && limit) {
        sql += ' LIMIT ? OFFSET ?';
        queryParams.push(limitNumber, offset);
    }

    // Đầu tiên, lấy tổng số bản ghi để tính tổng số trang
    connection.query(sqlCount, [searchTerm], (err, countResults) => {
        if (err) {
            console.error('Error counting blog categories:', err);
            return res.status(500).json({ error: 'Failed to count blog categories' });
        }

        const totalCount = countResults[0].total; // Tổng số danh mục blog
        const totalPages = Math.ceil(totalCount / limitNumber); // Tổng số trang

        // Tiếp theo, lấy danh sách danh mục blog
        connection.query(sql, queryParams, (err, results) => {
            if (err) {
                console.error('Error fetching blog categories:', err);
                return res.status(500).json({ error: 'Failed to fetch blog categories' });
            }

            // Trả về kết quả
            res.status(200).json({
                message: 'Fetched blog categories successfully',
                results,
                totalCount,
                totalPages, // Tổng số trang
                currentPage: pageNumber, // Trang hiện tại
                limit: limitNumber, // Số bản ghi trên mỗi trang (limit)
            });
        });
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
        res.status(200).json({
            message: 'Lấy thông tin danh mục blog thành công',
            data: results[0]
        });
    });
});

// *Thêm danh mục blog mới
router.post('/', (req, res) => {
    const { name, status } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    if (status === undefined) {
        return res.status(400).json({ error: 'Status is required' });
    }

    const sql = 'INSERT INTO blog_categories (name, status) VALUES (?, ?)';
    connection.query(sql, [name, status], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Danh mục blog đã tồn tại' });
            }
            console.error('Lỗi khi tạo danh mục blog:', err);
            return res.status(500).json({ error: 'Không thể tạo danh mục blog' });
        }
        res.status(201).json({
            message: 'Thêm danh mục blog thành công',
            categoryId: results.insertId
        });
    });
});

// *Cập nhật danh mục blog theo id bằng phương thức patch
router.patch('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    if (!updates.name && !updates.status) {
        return res.status(400).json({ error: 'At least one field (name or status) is required for update' });
    }

    let sql = 'UPDATE blog_categories SET ';
    const values = [];
    for (const [key, value] of Object.entries(updates)) {
        if (key !== 'updated_at') {
            sql += `${key} = ?, `;
            values.push(value);
        }
    }
    sql += 'updated_at = NOW() WHERE id = ?';
    values.push(id);

    connection.query(sql, values, (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Danh mục blog đã tồn tại' });
            }
            console.error('Lỗi khi cập nhật danh mục blog:', err);
            return res.status(500).json({ error: 'Không thể cập nhật danh mục blog' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy danh mục blog' });
        }
        res.status(200).json({ message: 'Cập nhật danh mục blog thành công' });
    });
});

// Xóa danh mục blog theo id
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    // Bước 1: Kiểm tra xem danh mục có tên là "Chưa phân loại"
    const checkCategoryNameSql = 'SELECT * FROM blog_categories WHERE id = ?';
    connection.query(checkCategoryNameSql, [id], (err, categoryResults) => {
        if (err) {
            console.error('Lỗi khi kiểm tra danh mục:', err);
            return res.status(500).json({ error: 'Không thể kiểm tra danh mục' });
        }

        if (categoryResults.length === 0) {
            return res.status(404).json({ error: 'Danh mục không tồn tại' });
        }

        const categoryName = categoryResults[0].name;

        // Nếu danh mục có tên là "Chưa phân loại", không cho phép xóa
        if (categoryName === 'Chưa phân loại') {
            return res.status(200).json({ error: 'Không thể xóa danh mục "Chưa phân loại"' });
        }

        // Bước 2: Kiểm tra xem có bài viết nào liên kết với danh mục không
        const checkPostsSql = 'SELECT * FROM blogs WHERE blog_category_id = ?';
        connection.query(checkPostsSql, [id], (err, results) => {
            if (err) {
                console.error('Lỗi khi kiểm tra bài viết:', err);
                return res.status(500).json({ error: 'Không thể kiểm tra bài viết' });
            }

            const hasPosts = results.length > 0;

            if (hasPosts) {
                // Bước 3: Kiểm tra xem danh mục "Chưa phân loại" có tồn tại không
                const checkUndefinedCategorySql = 'SELECT * FROM blog_categories WHERE name = ?';
                connection.query(checkUndefinedCategorySql, ['Chưa phân loại'], (err, undefinedResults) => {
                    if (err) {
                        console.error('Lỗi khi kiểm tra danh mục "Chưa phân loại":', err);
                        return res.status(500).json({ error: 'Không thể kiểm tra danh mục "Chưa phân loại"' });
                    }

                    let undefinedCategoryId;

                    // Nếu danh mục "Chưa phân loại" không tồn tại, tạo mới
                    if (undefinedResults.length === 0) {
                        const createUndefinedCategorySql = 'INSERT INTO blog_categories (name, status) VALUES (?, ?)';
                        connection.query(createUndefinedCategorySql, ['Chưa phân loại', 1], (err, newCategoryResults) => {
                            if (err) {
                                console.error('Lỗi khi tạo danh mục "Chưa phân loại":', err);
                                return res.status(500).json({ error: 'Không thể tạo danh mục "Chưa phân loại"' });
                            }
                            undefinedCategoryId = newCategoryResults.insertId;
                            reassignPostsAndDeleteCategory(id, undefinedCategoryId, res);
                        });
                    } else {
                        undefinedCategoryId = undefinedResults[0].id;
                        reassignPostsAndDeleteCategory(id, undefinedCategoryId, res);
                    }
                });
            } else {
                // Nếu không có bài viết, xóa danh mục ngay lập tức
                const deleteCategorySql = 'DELETE FROM blog_categories WHERE id = ?';
                connection.query(deleteCategorySql, [id], (err) => {
                    if (err) {
                        console.error('Lỗi khi xóa danh mục:', err);
                        return res.status(500).json({ error: 'Không thể xóa danh mục' });
                    }
                    res.status(200).json({ message: 'Danh mục blog đã được xóa thành công' });
                });
            }
        });
    });
});

// Hàm để chuyển bài viết và xóa danh mục
function reassignPostsAndDeleteCategory(categoryId, undefinedCategoryId, res) {
    // Cập nhật tất cả bài viết sang danh mục "Chưa phân loại"
    const updatePostsSql = 'UPDATE blogs SET blog_category_id = ? WHERE blog_category_id = ?';
    connection.query(updatePostsSql, [undefinedCategoryId, categoryId], (err) => {
        if (err) {
            console.error('Lỗi khi cập nhật bài viết:', err);
            return res.status(500).json({ error: 'Không thể cập nhật bài viết' });
        }

        // Xóa danh mục cũ
        const deleteCategorySql = 'DELETE FROM blog_categories WHERE id = ?';
        connection.query(deleteCategorySql, [categoryId], (err) => {
            if (err) {
                console.error('Lỗi khi xóa danh mục:', err);
                return res.status(500).json({ error: 'Không thể xóa danh mục' });
            }
            res.status(200).json({ message: 'Danh mục blog và bài viết đã được cập nhật thành công' });
        });
    });
}

module.exports = router;
