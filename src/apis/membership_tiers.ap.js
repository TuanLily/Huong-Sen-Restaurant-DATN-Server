const express = require('express');
const router = express.Router();
const connection = require('../../index');

// Hàm lấy danh sách thẻ thành viên hiện có của nhà hàng
router.get('/', (req, res) => {

    const query = `SELECT * FROM membership_tiers`;

    connection.query(query, (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Lỗi khi lấy thông tin thẻ hội viên.', error });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin thẻ hội viên.' });
        }

        res.status(200).json({
            message: 'Lấy dữ liệu thành công',
            result: results
        });
    });
});

router.get('/:user_id', async (req, res) => {
    const user_id = req.params.user_id;

    try {
        // Truy vấn điểm từ bảng membership_card dựa vào user_id
        const membershipCardResults = await new Promise((resolve, reject) => {
            connection.query('SELECT point FROM membership_cards WHERE user_id = ?', [user_id], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });

        if (!membershipCardResults || membershipCardResults.length === 0) {
            return res.status(404).json({ message: 'Thẻ thành viên không tìm thấy' });
        }

        const userPoints = membershipCardResults[0].point;

        // Truy vấn tất cả các hạng mục membership_tiers và sắp xếp theo điểm từ cao đến thấp
        const membershipTiersResults = await new Promise((resolve, reject) => {
            connection.query('SELECT name, point FROM membership_tiers ORDER BY point DESC', (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });

        if (!membershipTiersResults || membershipTiersResults.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy cấp độ thành viên nào' });
        }

        // Tìm cấp độ tương ứng
        const matchingTier = membershipTiersResults.find(tier => userPoints >= tier.point);

        if (matchingTier) {
            return res.json({
                message: 'Lấy dữ liệu thành công',
                userPoints: userPoints,
                tierName: matchingTier.name
            });
        } else {
            return res.status(404).json({ message: 'Không tìm thấy cấp độ tương ứng với số điểm hiện tại' });
        }
    } catch (error) {
        console.error('Error fetching membership level:', error);
        return res.status(500).json({ message: 'Có lỗi xảy ra' });
    }
});


module.exports = router;
