const express = require('express');
const router = express.Router();
const connection = require('../../index');

// Lấy tất cả danh sách bảng
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM tables';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Lỗi khi lấy danh sách bảng:', err);
            return res.status(500).json({ error: 'Không thể lấy danh sách bảng' });
        }
        res.status(200).json({ message: 'Show list of tables successfully', results });
    });
});

// Lấy thông tin bảng theo id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM tables WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Lỗi khi lấy thông tin bảng:', err);
            return res.status(500).json({ error: 'Không thể lấy thông tin bảng' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy bảng' });
        }
        res.status(200).json(results[0]);
    });
});

// Thêm bảng mới
router.post('/', (req, res) => {
    const { number, type, status } = req.body;

    if (number === undefined) {
        return res.status(400).json({ error: 'Number is required' });
    }
    if (!type) {
        return res.status(400).json({ error: 'Type is required' });
    }
    if (status === undefined) {
        return res.status(400).json({ error: 'Status is required' });
    }

    const sql = 'INSERT INTO tables (number, type, status) VALUES (?, ?, ?)';
    connection.query(sql, [number, type, status], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Bàn đã tồn tại' });
            }
            console.error('Lỗi khi tạo bàn:', err);
            return res.status(500).json({ error: 'Không thể tạo bàn' });
        }
        res.status(201).json({ message: 'Thêm bàn thành công', tableId: results.insertId });
    });
});

// Cập nhật bảng theo id bằng phương thức put
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { number, type, status } = req.body;

    if (number === undefined) {
        return res.status(400).json({ error: 'Number is required' });
    }
    if (!type) {
        return res.status(400).json({ error: 'Type is required' });
    }
    if (status === undefined) {
        return res.status(400).json({ error: 'Status is required' });
    }

    const sql = 'UPDATE tables SET number = ?, type = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [number, type, status, id], (err, results) => {
        if (err) {
            console.error('Lỗi khi cập nhật bàn:', err);
            return res.status(500).json({ error: 'Không thể cập nhật bàn' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy bàn' });
        }
        res.status(200).json({ message: 'Cập nhật bàn thành công' });
    });
});

// Cập nhật bảng theo id bằng phương thức patch
router.patch('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    let sql = 'UPDATE tables SET ';
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
                return res.status(409).json({ error: 'Bàn đã tồn tại' });
            }
            console.error('Lỗi khi cập nhật bảng:', err);
            return res.status(500).json({ error: 'Không thể cập nhật bàn' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy bàn' });
        }
        res.status(200).json({ message: 'Cập nhật bàn thành công' });
    });
});


// Xóa bảng theo id
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM tables WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Lỗi khi xóa bảng:', err);
            return res.status(500).json({ error: 'Không thể xóa bảng' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy bảng' });
        }
        res.status(200).json({ message: 'Xóa bảng thành công' });
    });
});

module.exports = router;
