const express = require("express");
const router = express.Router();
const connection = require("../../index");

// Lấy danh sách bàn với phân trang
router.get("/", (req, res) => {
  const { search = '', page = 1, limit = 10, searchCapacity = '' } = req.query;

  const limitNumber = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
  const pageNumber = parseInt(page, 10);
  const offset = (pageNumber - 1) * limitNumber;
  const searchTerm = `%${search}%`;
  const seaCapacity = `%${searchCapacity}%`;

  // Câu truy vấn đếm tổng số bàn
  const sqlCount = `
    SELECT COUNT(*) as total 
    FROM tables 
    LEFT JOIN reservations ON tables.id = reservations.table_id 
    WHERE tables.number LIKE ? AND tables.capacity LIKE ?
  `;

  // Câu truy vấn lấy danh sách bàn
  let sql = `
    SELECT 
      tables.id, 
      tables.number, 
      tables.capacity, 
      tables.status, 
      reservations.fullname AS guest_name
    FROM tables
    LEFT JOIN reservations ON tables.id = reservations.table_id
    WHERE tables.number LIKE ? AND tables.capacity LIKE ?
    ORDER BY tables.id DESC
  `;

  const queryParams = [searchTerm, seaCapacity];
  if (page && limit) {
    sql += " LIMIT ? OFFSET ?";
    queryParams.push(limitNumber, offset);
  }

  connection.query(sqlCount, [searchTerm, seaCapacity], (err, countResults) => {
    if (err) {
      console.error("Error counting tables:", err);
      return res.status(500).json({ error: "Failed to count tables" });
    }

    const totalCount = countResults[0].total;
    const totalPages = Math.ceil(totalCount / limitNumber);

    connection.query(sql, queryParams, (err, results) => {
      if (err) {
        console.error("Error fetching tables:", err);
        return res.status(500).json({ error: "Failed to fetch tables" });
      }

      res.status(200).json({
        message: "Show list tables successfully",
        results,
        totalCount,
        totalPages,
        currentPage: pageNumber,
        limit: limitNumber,
      });
    });
  });
});

// Lọc bàn ăn theo ngày với phân trang
router.get("/filter-by-date", (req, res) => {
  const { date, page = 1, pageSize = 8 } = req.query;

  console.log("Chj date::", date);

  if (!date) {
    return res.status(400).json({ error: "Ngày là bắt buộc" });
  }

  const pageNumber = parseInt(page, 10) || 1;
  const size = parseInt(pageSize, 10) || 8; // Sử dụng giá trị mặc định là 8
  const offset = (pageNumber - 1) * size;

  const sqlCount = `
    SELECT COUNT(*) as total 
    FROM tables t
    LEFT JOIN reservations r ON t.id = r.table_id AND DATE(r.reservation_date) = ?
    WHERE t.status IN (0, 1)
  `;

  const sql = `
    SELECT t.id, t.number, t.capacity, 
           CASE 
             WHEN r.table_id IS NOT NULL THEN 0 -- Đang phục vụ
             ELSE 1 -- Bàn trống
           END AS status,
           r.reservation_date 
    FROM tables t
    LEFT JOIN reservations r ON t.id = r.table_id AND DATE(r.reservation_date) = ?
    WHERE t.status IN (0, 1)
    ORDER BY t.number ASC
    LIMIT ? OFFSET ?
  `;

  connection.query(sqlCount, [date], (err, countResults) => {
    if (err) {
      console.error("Lỗi khi đếm bàn:", err);
      return res.status(500).json({ error: "Không thể đếm bàn" });
    }

    const totalCount = countResults[0].total;
    const totalPages = Math.ceil(totalCount / size);

    connection.query(sql, [date, size, offset], (err, results) => {
      if (err) {
        console.error("Lỗi khi lấy danh sách bàn:", err);
        return res.status(500).json({ error: "Không thể lấy danh sách bàn" });
      }

      res.status(200).json({
        message: "Hiển thị danh sách bàn theo ngày thành công",
        results,
        totalCount,
        totalPages,
        currentPage: pageNumber,
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
