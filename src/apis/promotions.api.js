const express = require('express');
const router = express.Router();
const connection = require('../../index');

// *Lấy tất cả danh sách promotions
router.get('/', (req, res) => {
    const { search = '', page = 1, pageSize = 10 } = req.query;

    // Đảm bảo page và pageSize là số nguyên
    const pageNumber = parseInt(page, 10) || 1;
    const size = parseInt(pageSize, 10) || 10;
    const offset = (pageNumber - 1) * size;

    // SQL truy vấn để lấy tổng số bản ghi
    const sqlCount = 'SELECT COUNT(*) as total FROM promotions WHERE code_name LIKE ?';
    
    // SQL truy vấn để lấy danh sách promotion phân trang
    let sql = 'SELECT * FROM promotions WHERE code_name LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?';

    // Đếm tổng số bản ghi khớp với tìm kiếm
    connection.query(sqlCount, [`%${search}%`], (err, countResults) => {
        if (err) {
            console.error('Error counting promotions:', err);
            return res.status(500).json({ error: 'Failed to count promotions' });
        }

        const totalCount = countResults[0].total;
        const totalPages = Math.ceil(totalCount / size); // Tính tổng số trang

        // Lấy danh sách promotion cho trang hiện tại
        connection.query(sql, [`%${search}%`, size, offset], (err, results) => {
            if (err) {
                console.error('Error fetching promotions:', err);
                return res.status(500).json({ error: 'Failed to fetch promotions' });
            }

            // Trả về kết quả với thông tin phân trang
            res.status(200).json({
                message: 'Show list promotions successfully',
                results,
                totalCount,
                totalPages,
                currentPage: pageNumber
            });
        });
    });
});

// *Lấy thông tin promotions theo id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM promotions WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error fetching promotions:', err);
            return res.status(500).json({ error: 'Failed to fetch promotions' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Promotions not found' });
        }
        res.status(200).json({
            message: 'Show information promotions successfully',
            data: results[0]
        });
    });
});

// *Thêm promotions mới
router.post('/', (req, res) => {
    const { code_name , discount , quantity , valid_from , valid_to } = req.body;

    if (!code_name) {
        return res.status(400).json({ error: 'Code_name is required' });
    }
    if (!discount) {
        return res.status(400).json({ error: 'Discount is required' });
    }
    if (!quantity) {
        return res.status(400).json({ error: 'Quantity is required' });
    }
    if (!valid_from) {
        return res.status(400).json({ error: 'Valid_from is required' });
    }
    if (!valid_to) {
        return res.status(400).json({ error: 'Valid_to is required' });
    }

    const sql = 'INSERT INTO promotions (code_name , discount , quantity , valid_from , valid_to) VALUES (?, ?, ?, ?, ?)';
    connection.query(sql, [code_name , discount , quantity , valid_from , valid_to], (err, results) => {
        if (err) {
            console.error('Error creating promotions:', err);
            return res.status(500).json({ error: 'Failed to create promotions', promotionId: results.insertId });
        }
        res.status(201).json({ message: "Promotions add new successfully" });
    });
});

// *Cập nhật promotions id bằng phương thức put
router.put('/:id', (req, res) => {
    const { id } = req.params
    const { name , discount , quantity , valid_from , valid_to } = req.body;
    const sql = 'UPDATE promotions SET name = ?, discount = ?, quantity = ?, valid_from = ?, valid_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [name , discount , quantity , valid_from , valid_to , id], (err, results) => {
        if (err) {
            console.error('Error updating promotions:', err);
            return res.status(500).json({ error: 'Failed to update promotions' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Promotions not found' });
        }
        res.status(200).json({ message: "Promotions update successfully" });
    });
});

// *Cập nhật promotions theo id bằng phương thức patch
router.patch('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const sql = 'UPDATE promotions SET ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [updates, id], (err, results) => {
        if (err) {
            console.error('Error partially updating promotions:', err);
            return res.status(500).json({ error: 'Failed to partially update promotions' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Promotions not found' });
        }
        res.status(200).json({ message: "Promotions update successfully" });
    });
});

// *Xóa promotions theo id
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM promotions WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error deleting promotions:', err);
            return res.status(500).json({ error: 'Failed to delete promotions' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Promotions not found' });
        }
        res.status(200).json({ message: 'Promotions deleted successfully' });
    });
});

module.exports = router;