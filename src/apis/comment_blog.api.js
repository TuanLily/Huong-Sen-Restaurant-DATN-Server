const express = require('express');
const router = express.Router();
const connection = require('../../index');
router.get('/', (req, res) => {
    const { searchName = '', page = 1, limit = 10 } = req.query;

    // Chuyển đổi giá trị limit và page thành số nguyên
    const limitNumber = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10; // Mặc định là 10 nếu không hợp lệ
    const pageNumber = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1; // Mặc định là 1 nếu không hợp lệ
    const offset = (pageNumber - 1) * limitNumber; // Tính toán offset
    const searchTerm = `%${searchName}%`; // Thêm dấu % cho tìm kiếm

    // Câu truy vấn đếm tổng số bình luận
    const sqlCount = 'SELECT COUNT(*) as total FROM comment_blog WHERE content LIKE ?';

    // Câu truy vấn lấy danh sách bình luận (có join với bảng users)
    const sql = `
      SELECT comment_blog.*, users.fullname, users.avatar 
      FROM comment_blog 
      JOIN users ON comment_blog.user_id = users.id 
      WHERE comment_blog.content LIKE ? 
      ORDER BY comment_blog.id DESC 
      LIMIT ? OFFSET ?
    `;

    // Đầu tiên, lấy tổng số bản ghi để tính tổng số trang
    connection.query(sqlCount, [searchTerm], (err, countResults) => {
        if (err) {
            console.error('Error counting comments:', err);
            return res.status(500).json({ error: 'Failed to count comments' });
        }

        const totalCount = countResults[0].total; // Tổng số bình luận
        const totalPages = Math.ceil(totalCount / limitNumber); // Tổng số trang

        // Tiếp theo, lấy danh sách bình luận
        connection.query(sql, [searchTerm, limitNumber, offset], (err, results) => {
            if (err) {
                console.error('Error fetching comments:', err);
                return res.status(500).json({ error: 'Failed to fetch comments' });
            }

            // Trả về kết quả
            res.status(200).json({
                message: 'Fetch comments successfully',
                results, // Danh sách bình luận
                totalCount, // Tổng số bình luận
                totalPages, // Tổng số trang
                currentPage: pageNumber, // Trang hiện tại
                limit: limitNumber, // Số bản ghi trên mỗi trang
            });
        });
    });
});



router.get('/blog/:blog_id', (req, res) => {
    const { blog_id } = req.params;
    const { page = 1, limit = 10 } = req.query; // Mặc định `limit` là 10 nếu không được cung cấp
  
    // Chuyển đổi các giá trị query về số nguyên
    const limitNumber = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10; // Mặc định là 10 nếu không hợp lệ
    const pageNumber = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1; // Mặc định là 1 nếu không hợp lệ
    const offset = (pageNumber - 1) * limitNumber; // Tính toán offset
  
    // Câu truy vấn đếm tổng số bình luận cho blog_id
    const sqlCount = `
      SELECT COUNT(*) as total 
      FROM comment_blog 
      WHERE blog_id = ?
    `;
  
    // Câu truy vấn lấy danh sách bình luận, kết hợp thông tin từ bảng `users`
    const sql = `
      SELECT comment_blog.*, users.fullname, users.avatar 
      FROM comment_blog 
      JOIN users ON comment_blog.user_id = users.id 
      WHERE comment_blog.blog_id = ? 
      ORDER BY comment_blog.id DESC 
      LIMIT ? OFFSET ?
    `;
  
    // Bước 1: Đếm tổng số bình luận
    connection.query(sqlCount, [blog_id], (err, countResults) => {
      if (err) {
        console.error('Error counting comments:', err);
        return res.status(500).json({ error: 'Failed to count comments' });
      }
  
      const totalCount = countResults[0]?.total || 0; // Tổng số bình luận
      const totalPages = Math.ceil(totalCount / limitNumber); // Tổng số trang
  
      // Bước 2: Lấy danh sách bình luận cho trang hiện tại
      connection.query(sql, [blog_id, limitNumber, offset], (err, results) => {
        if (err) {
          console.error('Error fetching comments:', err);
          return res.status(500).json({ error: 'Failed to fetch comments' });
        }
  
        // Trả về kết quả với thông tin phân trang
        res.status(200).json({
          message: 'Fetch comments successfully',
          results, // Danh sách bình luận
          totalCount, // Tổng số bình luận
          totalPages, // Tổng số trang
          currentPage: pageNumber, // Trang hiện tại
          limit: limitNumber, // Số bản ghi trên mỗi trang
        });
      });
    });
  });
  




router.post('/', (req, res) => {
    const { blog_id, user_id, content } = req.body;

    const sql = 'INSERT INTO comment_blog (blog_id, user_id, content) VALUES (?, ?, ?)';
    connection.query(sql, [blog_id, user_id, content], (err, results) => {
        if (err) {
            console.error('Lỗi khi tạo bình luận:', err);
            return res.status(500).json({ error: 'Không thể tạo bình luận' });
        }
        res.status(201).json({ message: "Thêm bình luận thành công" });
    });
});


// *Cập nhật bình luận theo id bằng phương thức put
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { customer_id, content } = req.body;

    const sql = 'UPDATE comment_blog SET customer_id = ?, content = ? , updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [customer_id, content, id], (err, results) => {
        if (err) {
            console.error('Lỗi khi cập nhật bình luận:', err);
            return res.status(500).json({ error: 'Không thể cập nhật bình luận' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy bình luận' });
        }
        res.status(200).json({ message: "Cập nhật bình luận thành công" });
    });
});


// *Cập nhật bình luận theo id bằng phương thức patch
router.patch('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const sql = 'UPDATE comment_blog SET ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [updates, id], (err, results) => {
        if (err) {
            console.error('Lỗi khi cập nhật một phần bình luận:', err);
            return res.status(500).json({ error: 'Không thể cập nhật một phần bình luận' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy bình luận' });
        }
        res.status(200).json({ message: "Cập nhật một phần bình luận thành công" });
    });
});

// *Xóa bình luận theo id
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM comment_blog WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Lỗi khi xóa bình luận:', err);
            return res.status(500).json({ error: 'Không thể xóa bình luận' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy bình luận' });
        }
        res.status(200).json({ message: 'Xóa bình luận thành công' });
    });
});

module.exports = router;
