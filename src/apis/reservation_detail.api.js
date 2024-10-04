const express = require('express');
const router = express.Router();
const connection = require('../../index');

// *Lấy tất cả chi tiết đơn đặt chỗ
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM reservation_details';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching reservation details:', err);
            return res.status(500).json({ error: 'Failed to fetch reservation details' });
        }
        res.status(200).json(results);
    });
});

// *Lấy chi tiết đặt chỗ theo id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM reservation_details WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error fetching reservation detail:', err);
            return res.status(500).json({ error: 'Failed to fetch reservation detail' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Reservation detail not found' });
        }
        res.status(200).json(results[0]);
    });
});

// *Thêm chi tiết đặt chỗ mới
router.post('/', (req, res) => {
    const { reservation_id, product_id, quantity, price } = req.body;

    const sql = `INSERT INTO reservation_details 
                 (reservation_id, product_id, quantity, price) 
                 VALUES (?, ?, ?, ?)`;

    connection.query(sql, [reservation_id, product_id, quantity, price], 
        (err, results) => {
            if (err) {
                console.error('Error creating reservation detail:', err);
                return res.status(500).json({ error: 'Failed to create reservation detail' });
            }
            res.status(201).json({ message: "Reservation detail created successfully", id: results.insertId });
        }
    );
});

// *Cập nhật chi tiết đặt chỗ theo id
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { reservation_id, product_id, quantity, price } = req.body;

    const sql = `UPDATE reservation_details 
                 SET reservation_id = ?, product_id = ?, quantity = ?, price = ? 
                 WHERE id = ?`;

    connection.query(sql, [reservation_id, product_id, quantity, price, id], 
        (err, results) => {
            if (err) {
                console.error('Error updating reservation detail:', err);
                return res.status(500).json({ error: 'Failed to update reservation detail' });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Reservation detail not found' });
            }
            res.status(200).json({ message: "Reservation detail updated successfully" });
        }
    );
});

// *Xóa chi tiết đặt chỗ theo id
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM reservation_details WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error deleting reservation detail:', err);
            return res.status(500).json({ error: 'Failed to delete reservation detail' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Reservation detail not found' });
        }
        res.status(200).json({ message: 'Reservation detail deleted successfully' });
    });
});

module.exports = router;
