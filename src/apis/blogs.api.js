const express = require("express");
const router = express.Router();
const connection = require("../../index");
const bcrypt = require('bcrypt');

const saltRounds = 10;


// *Lấy tất cả danh sách blog
router.get('/', (req, res) => {
  const { searchName = '', page = 1, limit = 10 } = req.query;

  // Chuyển đổi giá trị limit và page thành số nguyên
  const limitNumber = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10; // Mặc định là 10 nếu không hợp lệ
  const pageNumber = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1; // Mặc định là 1 nếu không hợp lệ
  const offset = (pageNumber - 1) * limitNumber; // Tính toán offset
  const searchTerm = `%${searchName}%`; // Thêm dấu % cho tìm kiếm

  // Câu truy vấn đếm tổng số blog
  const sqlCount = `SELECT COUNT(*) as total 
                    FROM blogs 
                    WHERE title LIKE ? 
                    OR author LIKE ?`;

  // Câu truy vấn lấy danh sách blog
  const sql = `
    SELECT * 
    FROM blogs 
    WHERE title LIKE ? 
    OR author LIKE ? 
    ORDER BY id DESC 
    LIMIT ? OFFSET ?
  `;

  // Đầu tiên, lấy tổng số bản ghi để tính tổng số trang
  connection.query(sqlCount, [searchTerm, searchTerm], (err, countResults) => {
    if (err) {
      console.error('Error counting blogs:', err);
      return res.status(500).json({ error: 'Failed to count blogs' });
    }

    const totalCount = countResults[0].total; // Tổng số blog
    const totalPages = Math.ceil(totalCount / limitNumber); // Tổng số trang

    // Tiếp theo, lấy danh sách blog
    connection.query(sql, [searchTerm, searchTerm, limitNumber, offset], (err, results) => {
      if (err) {
        console.error('Error fetching blogs:', err);
        return res.status(500).json({ error: 'Failed to fetch blogs' });
      }

      // Trả về kết quả
      res.status(200).json({
        message: 'Fetch blogs successfully',
        results, // Danh sách blog
        totalCount, // Tổng số blog
        totalPages, // Tổng số trang
        currentPage: pageNumber, // Trang hiện tại
        limit: limitNumber, // Số bản ghi trên mỗi trang
      });
    });
  });
});


// Lấy danh sách bài viết với phân trang
router.get("/posts", (req, res) => {
  const { page = 1, pageSize = 12} = req.query;

  const pageNumber = parseInt(page, 10) || 1;
  const size = parseInt(pageSize, 10) || 12; // Sử dụng giá trị mặc định là 8
  const offset = (pageNumber - 1) * size;

  const sqlCount = "SELECT COUNT(*) as total FROM blogs"; // Giả sử bảng bài viết là 'posts'

  const sql = `
    SELECT * 
    FROM blogs 
    ORDER BY created_at DESC -- Hoặc bất kỳ trường nào bạn muốn sắp xếp
    LIMIT ? OFFSET ?
  `;

  connection.query(sqlCount, (err, countResults) => {
    if (err) {
      console.error("Lỗi khi đếm bài viết:", err);
      return res.status(500).json({ error: "Không thể đếm bài viết" });
    }

    const totalCount = countResults[0].total;
    const totalPages = Math.ceil(totalCount / size);

    connection.query(sql, [size, offset], (err, results) => {
      if (err) {
        console.error("Lỗi khi lấy danh sách bài viết:", err);
        return res.status(500).json({ error: "Không thể lấy danh sách bài viết" });
      }

      res.status(200).json({
        message: "Hiển thị danh sách bài viết thành công",
        results,
        totalCount,
        totalPages,
        currentPage: pageNumber,
      });
    });
  });
});

// *Lấy thông tin blog theo id
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM blogs WHERE id = ?";
  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error fetching blog:", err);
      return res.status(500).json({ error: "Failed to fetch blog" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Blog not found" });
    }
    res.status(200).json(results[0]);
  });
});

const createSlug = (title) => {
  return title
    .toLowerCase()
    .normalize("NFD") // Chuẩn hóa chuỗi để loại bỏ dấu
    .replace(/[\u0300-\u036f]/g, "") // Loại bỏ các ký tự dấu
    .replace(/[^a-z0-9\s-]/g, "") // Chỉ giữ lại chữ, số, dấu cách và gạch ngang
    .trim() // Xóa khoảng trắng ở đầu và cuối
    .replace(/\s+/g, "-") // Thay khoảng trắng thành dấu gạch ngang
    .replace(/-+/g, "-"); // Xóa các gạch ngang dư thừa
};

router.post("/", (req, res) => {
  const { poster, title, content, author, blog_category_id } = req.body;

  // Tạo slug từ title
  const slug = createSlug(title);

  const sql =
    "INSERT INTO blogs (poster, title, slug, content, author, blog_category_id) VALUES (?, ?, ?, ?, ?, ?)";
  connection.query(
    sql,
    [poster, title, slug, content, author, blog_category_id],
    (err, results) => {
      if (err) {
        console.error("Error creating blog:", err);
        return res.status(500).json({ error: "Failed to create blog" });
      }
      res.status(201).json({ message: "Blog added successfully", id: results.insertId });
    }
  );
});



// *Cập nhật blog theo id bằng phương thức put
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { poster, title, content, author, blog_category_id } = req.body;

  // Tạo slug mới từ title
  const slug = createSlug(title);

  const sql =
    "UPDATE blogs SET poster = ?, title = ?, slug = ?, content = ?, author = ?, blog_category_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
  connection.query(
    sql,
    [poster, title, slug, content, author, blog_category_id, id],
    (err, results) => {
      if (err) {
        console.error("Error updating blog:", err);
        return res.status(500).json({ error: "Failed to update blog" });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Blog not found" });
      }
      res.status(200).json({ message: "Blog updated successfully" });
    }
  );
});


// *Cập nhật blog theo id bằng phương thức patch
router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Nếu `title` tồn tại trong `updates`, tạo lại `slug` từ `title`
  if (updates.title) {
    updates.slug = createSlug(updates.title);
  }

  // Dynamically build the SET clause of the SQL query
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  values.push(id);

  const sql = `UPDATE blogs SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

  connection.query(sql, values, (err, results) => {
    if (err) {
      console.error("Error partially updating blog:", err);
      return res.status(500).json({ error: "Failed to partially update blog" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Blog not found" });
    }
    res.status(200).json({ message: "Blog partially updated successfully" });
  });
});


router.get('/slug/:slug', (req, res) => {
  const { slug } = req.params;

  const sql = 'SELECT * FROM blogs WHERE slug = ?';

  connection.query(sql, [slug], (err, results) => {
    if (err) {
      console.error('Error fetching blog by slug:', err);
      return res.status(500).json({ error: 'Failed to fetch blog by slug' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.status(200).json({
      message: 'Show information blog successfully',
      data: results[0]
    });
  });
});


// *Xóa blog theo id
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM blogs WHERE id = ?";
  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error deleting blog:", err);
      return res.status(500).json({ error: "Failed to delete blog" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Blog not found" });
    }
    res.status(200).json({ message: "Blog deleted successfully" });
  });
});



module.exports = router;
