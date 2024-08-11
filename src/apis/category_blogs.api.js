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
