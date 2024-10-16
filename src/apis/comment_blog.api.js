const express = require('express');
const router = express.Router();
const connection = require('../../index');
router.get('/', (req, res) => {
    const { search = '', page = 1, pageSize = 5 } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const size = parseInt(pageSize, 10) || 5;
    const offset = (pageNumber - 1) * size;

    const sqlCount = 'SELECT COUNT(*) as total FROM comment_blog WHERE content LIKE ?';
    
    // Join bảng comment_blog và user để lấy thông tin fullname và avatar
    const sql = `
      SELECT comment_blog.*, users.fullname, users.avatar 
      FROM comment_blog 
      JOIN users ON comment_blog.user_id = users.id 
      WHERE content LIKE ? 
      ORDER BY comment_blog.id DESC 
      LIMIT ? OFFSET ?`;

    connection.query(sqlCount, [`%${search}%`], (err, countResults) => {
        if (err) {
            console.error('Lỗi khi đếm bình luận:', err);
            return res.status(500).json({ error: 'Không thể đếm bình luận' });
        }

        const totalCount = countResults[0].total;
        const totalPages = Math.ceil(totalCount / size);

        connection.query(sql, [`%${search}%`, size, offset], (err, results) => {
            if (err) {
                console.error('Lỗi khi lấy danh sách bình luận:', err);
                return res.status(500).json({ error: 'Không thể lấy danh sách bình luận' });
            }

            res.status(200).json({
                message: 'Hiển thị danh sách bình luận thành công',
                results,
                totalCount,
                totalPages,
                currentPage: pageNumber
            });
        });
    });
});


router.get('/blog/:blog_id', (req, res) => {
    const { blog_id } = req.params;
    const { page = 1, pageSize = 5 } = req.query;

    // Ensure this SQL is correct
    const sqlCount = 'SELECT COUNT(*) as total FROM comment_blog WHERE blog_id = ?';
    const sql = `
      SELECT comment_blog.*, users.fullname, users.avatar 
      FROM comment_blog 
      JOIN users ON comment_blog.user_id = users.id 
      WHERE comment_blog.blog_id = ?
      ORDER BY comment_blog.id DESC`;
    connection.query(sqlCount, [blog_id], (err, countResults) => {
        if (err) {
            console.error('Error counting comments:', err);
            return res.status(500).json({ error: 'Cannot count comments' });
        }

        const totalCount = countResults[0].total;

        connection.query(sql, [blog_id], (err, results) => {
            if (err) {
                console.error('Error fetching comments:', err);
                return res.status(500).json({ error: 'Cannot fetch comments' });
            }

            res.status(200).json({
                message: 'Fetched comments successfully',
                results,
                totalCount,
            });
        });
    });

    console.log(`Fetching comments for blog_id: ${blog_id}, page: ${page}, pageSize: ${pageSize}`);
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
        connection.query(sql, [customer_id,content, id], (err, results) => {
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
