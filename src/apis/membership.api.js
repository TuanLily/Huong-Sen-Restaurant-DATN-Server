const express = require('express');
const router = express.Router();
const connection = require('../../index');

// Hàm lấy thông tin membership_card từ user_id
router.get('/:user_id', (req, res) => {
    const userId = req.params.user_id;

    const query = `SELECT mc.*, u.fullname FROM membership_cards mc JOIN users u ON mc.user_id = u.id WHERE mc.user_id = ?`;

    connection.query(query, [userId], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Lỗi khi lấy thông tin thẻ hội viên.', error });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin thẻ hội viên cho user_id này.' });
        }

        res.status(200).json({
            message: 'Lấy dữ liệu thành công',
            result: results[0]
        });
    });
});






module.exports = router;
