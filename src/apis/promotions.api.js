const express = require('express');
const router = express.Router();
const connection = require('../../index');

// *Lấy tất cả danh sách promotions
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM promotions order by id DESC';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching promotions:', err);
            return res.status(500).json({ error: 'Failed to fetch promotions' });
        }
        res.status(200).json({ message: 'Show list promotions successfully', results });
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
    const { name , discount , valid_from , valid_to } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    if (!discount) {
        return res.status(400).json({ error: 'Discount is required' });
    }
    if (!valid_from) {
        return res.status(400).json({ error: 'Valid_from is required' });
    }
    if (!valid_to) {
        return res.status(400).json({ error: 'Valid_to is required' });
    }

    const sql = 'INSERT INTO promotions (name , discount , valid_from , valid_to) VALUES (?, ?, ?, ?)';
    connection.query(sql, [name , discount , valid_from , valid_to], (err, results) => {
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
    const { name , discount , valid_from , valid_to } = req.body;
    const sql = 'UPDATE promotions SET name = ?, discount = ?, valid_from = ?, valid_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [name , discount , valid_from , valid_to , id], (err, results) => {
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

// *Xóa sản phẩm theo id
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