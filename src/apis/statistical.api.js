const express = require('express');
const router = express.Router();
const connection = require('../../index');

// Bảng ánh xạ giữa số trạng thái và tên trạng thái
const statusMapping = {
    0: 'Hủy đơn',
    1: 'Chờ thanh toán cọc',
    2: 'Hết hạn thanh toán cọc',
    3: 'Đã thanh toán cọc',
    4: 'Chờ thanh toán toàn bộ đơn',
    5: 'Hoàn thành đơn'
};

// Lấy doanh thu từ tháng 1 đến tháng 12 và thống kê số lượng đơn hàng theo trạng thái trong từng tháng
// router.get('/', (req, res) => {
//     const { year } = req.query; // Năm có thể được truyền qua query parameter, ví dụ: ?year=2024
//     const selectedYear = parseInt(year, 10) || new Date().getFullYear(); // Mặc định là năm hiện tại nếu không truyền vào

//     // SQL truy vấn để tính doanh thu tổng và số lượng đơn hàng theo trạng thái cho từng tháng
//     const sql = `
//         SELECT 
//             MONTH(reservation_date) AS month, 
//             status,
//             COUNT(*) AS orderCount,  -- Đếm số lượng đơn hàng theo trạng thái
//             -- Tính tổng doanh thu chỉ cho những đơn hàng có trạng thái 'Hoàn thành đơn'
//             CASE WHEN status = 5 THEN SUM(total_amount) ELSE 0 END AS totalRevenue 
//         FROM reservations 
//         WHERE YEAR(reservation_date) = ?
//         GROUP BY MONTH(reservation_date), status
//         ORDER BY MONTH(reservation_date), status
//     `;

//     // Thực hiện truy vấn
//     connection.query(sql, [selectedYear], (err, results) => {
//         if (err) {
//             console.error('Error fetching revenue:', err);
//             return res.status(500).json({ error: 'Failed to fetch revenue' });
//         }

//         // Tạo object chứa tổng doanh thu theo tháng và số lượng đơn hàng theo từng trạng thái
//         const monthlyRevenue = Array(12).fill(0); // Mảng 12 phần tử cho tổng doanh thu mỗi tháng (0-based)
        
//         // Khởi tạo số lượng đơn hàng theo trạng thái (tên) cho từng tháng
//         const revenueByMonthAndStatus = Array.from({ length: 12 }, () => ({
//             'Hủy đơn': 0, 
//             'Chờ thanh toán cọc': 0, 
//             'Hết hạn thanh toán cọc': 0, 
//             'Đã thanh toán cọc': 0, 
//             'Chờ thanh toán toàn bộ đơn': 0, 
//             'Hoàn thành đơn': 0
//         }));

//         // Lấp đầy dữ liệu doanh thu cho từng tháng và trạng thái
//         results.forEach(row => {
//             const monthIndex = row.month - 1; // Index của tháng trong mảng (0-based)

//             // Cộng tổng doanh thu cho từng tháng chỉ khi trạng thái là 'Hoàn thành đơn'
//             if (row.status === 5) {
//                 monthlyRevenue[monthIndex] += row.totalRevenue || 0;
//             }

//             // Lấy tên trạng thái từ bảng ánh xạ
//             const statusName = statusMapping[row.status];

//             // Cập nhật số lượng đơn hàng theo trạng thái của tháng hiện tại
//             if (statusName && revenueByMonthAndStatus[monthIndex][statusName] !== undefined) {
//                 revenueByMonthAndStatus[monthIndex][statusName] += row.orderCount || 0;
//             }
//         });

//         // Trả về kết quả
//         res.status(200).json({
//             message: `Revenue and order count statistics for the year ${selectedYear}`,
//             year: selectedYear,
//             monthlyRevenue,            // Tổng doanh thu theo tháng (chỉ cho đơn hàng hoàn thành)
//             revenueByMonthAndStatus    // Số lượng đơn hàng theo trạng thái (tên) trong từng tháng
//         });
//     });
// });

router.get('/', (req, res) => {
    const { year } = req.query; // Năm có thể được truyền qua query parameter, ví dụ: ?year=2024
    const selectedYear = parseInt(year, 10) || new Date().getFullYear(); // Mặc định là năm hiện tại nếu không truyền vào

    // SQL truy vấn để tính doanh thu tổng và số lượng đơn hàng theo trạng thái cho từng tháng
    const sql = `
        SELECT 
            MONTH(reservation_date) AS month, 
            status,
            COUNT(*) AS orderCount,  -- Đếm số lượng đơn hàng theo trạng thái
            -- Tính tổng doanh thu cho trạng thái 'Hoàn thành đơn' và 'Hủy đơn'
            CASE 
                WHEN status = 5 THEN SUM(total_amount) -- Hoàn thành đơn: tính tổng doanh thu
                WHEN status = 0 THEN SUM(deposit)      -- Hủy đơn: tính tổng tiền cọc
                ELSE 0 
            END AS totalRevenue 
        FROM reservations 
        WHERE YEAR(reservation_date) = ?
        GROUP BY MONTH(reservation_date), status
        ORDER BY MONTH(reservation_date), status
    `;

    // Thực hiện truy vấn
    connection.query(sql, [selectedYear], (err, results) => {
        if (err) {
            console.error('Lỗi khi lấy doanh thu:', err);
            return res.status(500).json({ error: 'Lấy doanh thu thất bại' });
        }

        // Tạo object chứa tổng doanh thu theo tháng và số lượng đơn hàng theo từng trạng thái
        const monthlyRevenue = Array(12).fill(0); // Mảng 12 phần tử cho tổng doanh thu mỗi tháng (0-based)
        
        // Khởi tạo số lượng đơn hàng theo trạng thái (tên) cho từng tháng
        const revenueByMonthAndStatus = Array.from({ length: 12 }, () => ({
            'Hủy đơn': 0, 
            'Chờ thanh toán cọc': 0, 
            'Hết hạn thanh toán cọc': 0, 
            'Đã thanh toán cọc': 0, 
            'Chờ thanh toán toàn bộ đơn': 0, 
            'Hoàn thành đơn': 0
        }));

        // Lấp đầy dữ liệu doanh thu cho từng tháng và trạng thái
        results.forEach(row => {
            const monthIndex = row.month - 1; // Index của tháng trong mảng (0-based)

            // Cộng tổng doanh thu cho từng tháng nếu trạng thái là 'Hoàn thành đơn' hoặc 'Hủy đơn'
            if (row.status === 5 || row.status === 0) {
                monthlyRevenue[monthIndex] += row.totalRevenue || 0;
            }

            // Lấy tên trạng thái từ bảng ánh xạ
            const statusName = statusMapping[row.status];

            // Cập nhật số lượng đơn hàng theo trạng thái của tháng hiện tại
            if (statusName && revenueByMonthAndStatus[monthIndex][statusName] !== undefined) {
                revenueByMonthAndStatus[monthIndex][statusName] += row.orderCount || 0;
            }
        });

        // Trả về kết quả
        res.status(200).json({
            message: `Doanh thu và thống kê đơn hàng cho năm ${selectedYear}`,
            year: selectedYear,
            monthlyRevenue,            // Tổng doanh thu theo tháng (bao gồm cả đơn hủy)
            revenueByMonthAndStatus    // Số lượng đơn hàng theo trạng thái (tên) trong từng tháng
        });
    });
});

// API thống kê doanh thu theo khoảng thời gian
// router.get('/revenue', (req, res) => {
//     const { startDate, endDate } = req.query;

//     const startDateTime = `${startDate} 00:00:00`;
//     const endDateTime = `${endDate} 23:59:59`;

//     // Kiểm tra xem startDate và endDate có được truyền vào hay không
//     if (!startDate || !endDate) {
//         return res.status(400).json({ 
//             error: 'Vui lòng truyền đầy đủ startDate và endDate theo định dạng YYYY-MM-DD.' 
//         });
//     }

//     // Câu truy vấn SQL để tính doanh thu
//     const sql = `
//         SELECT 
//             SUM(total_amount) AS totalRevenue, 
//             COUNT(*) AS orderCount
//         FROM reservations
//         WHERE status = 5 
//           AND reservation_date BETWEEN ? AND ?
//     `;

//     // Thực hiện truy vấn với tham số
//     connection.query(sql, [startDateTime, endDateTime], (err, results) => {
//         if (err) {
//             console.error('Lỗi truy vấn dữ liệu:', err);
//             return res.status(500).json({ error: 'Không thể lấy dữ liệu doanh thu.' });
//         }

//         // Kết quả từ truy vấn
//         const totalRevenue = results[0]?.totalRevenue || 0;
//         const orderCount = results[0]?.orderCount || 0;

//         res.status(200).json({
//             message: `Thống kê doanh thu từ ${startDate} đến ${endDate}`,
//             startDate,
//             endDate,
//             totalRevenue,
//             orderCount
//         });
//     });
// });

router.get('/revenue', (req, res) => {
    const { startDate, endDate } = req.query;

    const startDateTime = `${startDate} 00:00:00`;
    const endDateTime = `${endDate} 23:59:59`;

    // Kiểm tra xem startDate và endDate có được truyền vào hay không
    if (!startDate || !endDate) {
        return res.status(400).json({ 
            error: 'Vui lòng truyền đầy đủ startDate và endDate theo định dạng YYYY-MM-DD.' 
        });
    }

    // Câu truy vấn SQL để tính doanh thu
    const sql = `
        SELECT 
            SUM(CASE 
                    WHEN status = 5 THEN total_amount     -- Hoàn thành đơn: tính từ total_amount
                    WHEN status = 0 THEN deposit          -- Hủy đơn: tính từ deposit
                    ELSE 0 
                END) AS totalRevenue, 
            COUNT(*) AS orderCount
        FROM reservations
        WHERE reservation_date BETWEEN ? AND ? 
    `;

    // Thực hiện truy vấn với tham số
    connection.query(sql, [startDateTime, endDateTime], (err, results) => {
        if (err) {
            console.error('Lỗi truy vấn dữ liệu:', err);
            return res.status(500).json({ error: 'Không thể lấy dữ liệu doanh thu.' });
        }

        // Kết quả từ truy vấn
        const totalRevenue = results[0]?.totalRevenue || 0;
        const orderCount = results[0]?.orderCount || 0;

        res.status(200).json({
            message: `Thống kê doanh thu từ ${startDate} đến ${endDate}`,
            startDate,
            endDate,
            totalRevenue,
            orderCount
        });
    });
});


module.exports = router;
