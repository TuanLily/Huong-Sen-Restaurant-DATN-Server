const express = require('express');
const router = express.Router();
const connection = require('../../index');

// *Lấy tất cả danh sách đặt chỗ
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM reservations';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching reservations:', err);
            return res.status(500).json({ error: 'Failed to fetch reservations' });
        }
        res.status(200).json(results);
    });
});

// *Lấy thông tin đặt chỗ theo id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM reservations WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error fetching reservation:', err);
            return res.status(500).json({ error: 'Failed to fetch reservation' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        res.status(200).json(results[0]);
    });
});

// *Thêm đặt chỗ mới
router.post('/', (req, res) => {
    const {
        user_id, table_id, promotion_id, fullname, tel, email, reservation_date, party_size, note, total_amount
    } = req.body;

    const reservation_code = `HS-${Math.floor(1000 + Math.random() * 9000)}`;

    const status = 1;
    
    const validTotalAmount = total_amount ? parseFloat(total_amount) : 0;

    // Calculate deposit only if total_amount is valid
    const deposit = validTotalAmount * 0.3;

    const sql = `INSERT INTO reservations 
                 (reservation_code,user_id, table_id, promotion_id, fullname, tel, email, reservation_date, party_size, note, total_amount, deposit, status) 
                 VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    connection.query(sql, [reservation_code, user_id, table_id, promotion_id, fullname, tel, email, reservation_date, party_size, note, total_amount, deposit, status], 
        (err, results) => {
            if (err) {
                console.error('Error creating reservation:', err);
                return res.status(500).json({ error: 'Failed to create reservation' });
            }
            res.status(201).json({ message: "Reservation created successfully", id: results.insertId });
        }
    );
});

// *Cập nhật đặt chỗ theo id bằng phương thức put
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const {
        user_id, table_id, promotion_id, fullname, tel, email, reservation_date, party_size, note, total_amount, deposit, status
    } = req.body;

    const sql = `UPDATE reservations 
                 SET user_id = ?, table_id = ?, promotion_id = ?, fullname = ?, tel = ?, email = ?, 
                     reservation_date = ?, party_size = ?, note = ?, total_amount = ?, deposit = ?, status = ? 
                 WHERE id = ?`;

    connection.query(sql, [user_id, table_id, promotion_id, fullname, tel, email, reservation_date, party_size, note, total_amount, deposit, status, id], 
        (err, results) => {
            if (err) {
                console.error('Error updating reservation:', err);
                return res.status(500).json({ error: 'Failed to update reservation' });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Reservation not found' });
            }
            res.status(200).json({ message: "Reservation updated successfully" });
        }
    );
});

// *Cập nhật đặt chỗ theo id bằng phương thức patch
router.patch('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const sql = 'UPDATE reservations SET ? WHERE id = ?';
    connection.query(sql, [updates, id], (err, results) => {
        if (err) {
            console.error('Error partially updating reservation:', err);
            return res.status(500).json({ error: 'Failed to partially update reservation' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        res.status(200).json({ message: "Reservation updated successfully" });
    });
});

// *Xóa đặt chỗ theo id
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM reservations WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error deleting reservation:', err);
            return res.status(500).json({ error: 'Failed to delete reservation' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        res.status(200).json({ message: 'Reservation deleted successfully' });
    });
});

module.exports = router;
