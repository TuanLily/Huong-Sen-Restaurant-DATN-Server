const express = require("express");
const router = express.Router();
const connection = require("../../index");

// Lấy danh sách bàn với phân trang
router.get('/', (req, res) => {
  const { search = '', page = 1, limit = 10, searchCapacity = '' } = req.query;

  // Chuyển đổi giá trị limit thành số nguyên, mặc định là 10 nếu không có
  const limitNumber = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10; // Kiểm tra limit có phải là số nguyên dương không, nếu không thì dùng 10

  // Chuyển đổi giá trị page thành số nguyên
  const pageNumber = parseInt(page, 10);
  const offset = (pageNumber - 1) * limitNumber; // Tính toán offset
  const searchTerm = `%${search}%`; // Thêm dấu % cho tìm kiếm
  const seaCapacity = `%${searchCapacity}%`;

  // Câu truy vấn đếm tổng số bàn
  const sqlCount = 'SELECT COUNT(*) as total FROM tables WHERE number LIKE ? and capacity LIKE ?';

  // Câu truy vấn lấy danh sách bàn
  let sql = 'SELECT * FROM tables WHERE number LIKE ? and capacity LIKE ? ORDER BY id DESC';

  // Nếu có phân trang, thêm LIMIT và OFFSET
  const queryParams = [searchTerm, seaCapacity];
  if (page && limit) {
      sql += ' LIMIT ? OFFSET ?';
      queryParams.push(limitNumber, offset);
  }

  // Đầu tiên, lấy tổng số bản ghi để tính tổng số trang
  connection.query(sqlCount, [searchTerm, seaCapacity], (err, countResults) => {
      if (err) {
          console.error('Error counting tables:', err);
          return res.status(500).json({ error: 'Failed to count tables' });
      }

      const totalCount = countResults[0].total; // Tổng số bàn
      const totalPages = Math.ceil(totalCount / limitNumber); // Tổng số trang

      // Tiếp theo, lấy danh sách bàn
      connection.query(sql, queryParams, (err, results) => {
          if (err) {
              console.error('Error fetching tables:', err);
              return res.status(500).json({ error: 'Failed to fetch tables' });
          }

          // Trả về kết quả
          res.status(200).json({
              message: 'Show list tables successfully',
              results,
              totalCount,
              totalPages, // Tổng số trang
              currentPage: pageNumber, // Trang hiện tại
              limit: limitNumber, // Số bản ghi trên mỗi trang (limit)
          });
      });
  });
});


// Lấy thông tin bàn theo ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM tables WHERE id = ?";
  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Lỗi khi lấy thông tin bàn:", err);
      return res.status(500).json({ error: "Không thể lấy thông tin bàn" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy bàn " });
    }
    res.status(200).json({
      message: "Hiển thị thông tin bàn thành công",
      data: results[0],
    });
  });
});



// Thêm bàn mới
router.post("/", (req, res) => {
  const { number, capacity, status } = req.body;

  if (number === undefined || number < 0) {
    return res.status(400).json({ error: "Số bàn là bắt buộc và không được âm" });
  }
  if (capacity === undefined || capacity < 0 || capacity > 8) {
    return res.status(400).json({ error: "Số lượng người không được âm và không được quá 8 người" });
  }
  if (status === undefined) {
    return res.status(400).json({ error: "Trạng thái là bắt buộc" });
  }

  const sql = "INSERT INTO tables (number, capacity, status) VALUES (?, ?, ?)";
  connection.query(sql, [number, capacity, status], (err, results) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "Bàn đã tồn tại" });
      }
      console.error("Lỗi khi tạo bàn:", err);
      return res.status(500).json({ error: "Không thể tạo bàn" });
    }
    res.status(201).json({
      message: "Thêm bàn thành công",
      tableId: results.insertId,
    });
  });
});

// Cập nhật thông tin bàn theo ID
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { number, capacity, status } = req.body;

  if (number === undefined || number < 0) {
    return res.status(400).json({ error: "Số bàn là bắt buộc và không được âm" });
  }
  if (capacity === undefined || capacity < 0 || capacity > 8) {
    return res.status(400).json({ error: "Số lượng người không được âm và không được quá 8 người" });
  }
  if (status === undefined) {
    return res.status(400).json({ error: "Trạng thái là bắt buộc" });
  }

  const sql =
    "UPDATE tables SET number = ?, capacity = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
  connection.query(sql, [number, capacity, status, id], (err, results) => {
    if (err) {
      console.error("Lỗi khi cập nhật bàn:", err);
      return res.status(500).json({ error: "Không thể cập nhật bàn" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy bàn" });
    }
    res.status(200).json({ message: "Cập nhật bàn thành công" });
  });
});

// Cập nhật một số trường thông tin của bàn theo ID
router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (updates.capacity !== undefined && (updates.capacity < 0 || updates.capacity > 8)) {
    return res.status(400).json({ error: "Số lượng người không được âm và không được quá 8 người" });
  }

  let sql = "UPDATE tables SET ";
  const values = [];
  for (const [key, value] of Object.entries(updates)) {
    if (key !== "updated_at") {
      sql += `${key} = ?, `;
      values.push(value);
    }
  }
  sql += "updated_at = NOW() WHERE id = ?";
  values.push(id);

  connection.query(sql, values, (err, results) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "Bàn đã tồn tại" });
      }
      console.error("Lỗi khi cập nhật bàn:", err);
      return res.status(500).json({ error: "Không thể cập nhật bàn" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy bàn" });
    }
    res.status(200).json({ message: "Cập nhật bàn thành công" });
  });
});

// Xóa bàn theo ID
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM tables WHERE id = ?";
  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Lỗi khi xóa bàn:", err);
      return res.status(500).json({ error: "Không thể xóa bàn" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy bàn" });
    }
    res.status(200).json({ message: "Xóa bàn thành công" });
  });
});

// Lấy chi tiết đơn đặt bàn theo table_id
router.get("/:table_id/reservations", (req, res) => {
  const { table_id } = req.params;

  const sql = "SELECT * FROM reservations WHERE table_id = ?";
  connection.query(sql, [table_id], (err, results) => {
    if (err) {
      console.error("Lỗi khi lấy thông tin đặt bàn:", err);
      return res.status(500).json({ error: "Không thể lấy thông tin đặt bàn" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy đơn đặt bàn cho bàn này" });
    }
    res.status(200).json({
      message: "Hiển thị thông tin đặt bàn thành công",
      data: results,
    });
  });
});



module.exports = router;
