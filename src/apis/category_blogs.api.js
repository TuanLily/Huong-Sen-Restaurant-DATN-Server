const express = require('express');
const router = express.Router();
const connection = require('../../index');

// *Lấy tất cả danh sách danh mục blog với phân trang
router.get('/', (req, res) => {
    const { search = '', page = 1, pageSize = 5 } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const size = parseInt(pageSize, 10) || 5;
    const offset = (pageNumber - 1) * size;

    const sqlCount = 'SELECT COUNT(*) as total FROM blog_categories WHERE name LIKE ?';
    let sql = 'SELECT * FROM blog_categories WHERE name LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?';

    connection.query(sqlCount, [`%${search}%`], (err, countResults) => {
        if (err) {
            console.error('Lỗi khi đếm danh mục blog:', err);
            return res.status(500).json({ error: 'Không thể đếm danh mục blog' });
        }

        const totalCount = countResults[0].total;
        const totalPages = Math.ceil(totalCount / size);

        connection.query(sql, [`%${search}%`, size, offset], (err, results) => {
            if (err) {
                console.error('Lỗi khi lấy danh sách danh mục blog:', err);
                return res.status(500).json({ error: 'Không thể lấy danh sách danh mục blog' });
            }

            res.status(200).json({
                message: 'Lấy danh sách danh mục blog thành công',
                results,
                totalCount,
                totalPages,
                currentPage: pageNumber
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

// *Xóa danh mục blog theo id
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    
    // Bước 1: Tìm id của danh mục "Undefined"
    const undefinedCategorySql = 'SELECT id FROM blog_categories WHERE name = "Undefined" LIMIT 1';

    connection.query(undefinedCategorySql, (err, results) => {
        if (err) {
            console.error('Lỗi khi lấy danh mục không xác định:', err);
            return res.status(500).json({ error: 'Không thể xử lý yêu cầu' });
        }
        if (results.length === 0) {
            return res.status(500).json({ error: 'Danh mục không xác định không tồn tại' });
        }

        const undefinedCategoryId = results[0].id;

        // Bước 2: Chuyển tất cả bài viết sang danh mục "Undefined"
        const updatePostsSql = 'UPDATE blogs SET blog_category_id = ? WHERE blog_category_id = ?';
        connection.query(updatePostsSql, [undefinedCategoryId, id], (err) => {
            if (err) {
                console.error('Lỗi khi cập nhật bài viết:', err);
                return res.status(500).json({ error: 'Không thể cập nhật bài viết' });
            }

            // Bước 3: Cập nhật trạng thái của danh mục
            const updateCategoryStatusSql = 'UPDATE blog_categories SET status = 0 WHERE id = ?';
            connection.query(updateCategoryStatusSql, [id], (err) => {
                if (err) {
                    console.error('Lỗi khi cập nhật trạng thái danh mục:', err);
                    return res.status(500).json({ error: 'Không thể cập nhật trạng thái danh mục' });
                }

                res.status(200).json({ message: 'Xóa mềm danh mục blog thành công' });
            });
        });
    });
});



module.exports = router;
