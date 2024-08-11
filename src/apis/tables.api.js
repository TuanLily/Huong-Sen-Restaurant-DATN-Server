const express = require("express");
const router = express.Router();
const connection = require("../../index");

router.get("/", (req, res) => {
  const { search = "", page = 1, pageSize = 5 } = req.query;

  const pageNumber = parseInt(page, 10) || 1;
  const size = parseInt(pageSize, 10) || 5;
  const offset = (pageNumber - 1) * size;

  const sqlCount = "SELECT COUNT(*) as total FROM tables WHERE number LIKE ?";
  let sql =
    "SELECT * FROM tables WHERE number LIKE ? ORDER BY number ASC LIMIT ? OFFSET ?";

  connection.query(sqlCount, [`%${search}%`], (err, countResults) => {
    if (err) {
      console.error("Lỗi khi đếm bàn:", err);
      return res.status(500).json({ error: "Không thể đếm bàn" });
    }

    const totalCount = countResults[0].total;
    const totalPages = Math.ceil(totalCount / size);

    connection.query(sql, [`%${search}%`, size, offset], (err, results) => {
      if (err) {
        console.error("Lỗi khi lấy danh sách bàn:", err);
        return res.status(500).json({ error: "Không thể lấy danh sách bàn" });
      }

      res.status(200).json({
        message: "Show list of tables successfully",
        results,
        totalCount,
        totalPages,
        currentPage: pageNumber,
      });
    });
  });
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM tables WHERE id = ?";
  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Lỗi khi lấy thông tin bàn:", err);
      return res.status(500).json({ error: "Không thể lấy thông tin bàn" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy bàn" });
    }
    res.status(200).json({
      message: "Show information table successfully",
      data: results[0],
    });
  });
});

router.post("/", (req, res) => {
  const { number, capacity, status } = req.body;

  if (number === undefined) {
    return res.status(400).json({ error: "Number is required" });
  }
  if (!capacity || capacity > 8) {
    return res.status(400).json({ error: "Số lượng người không được quá 8 người" });
  }
  if (status === undefined) {
    return res.status(400).json({ error: "Status is required" });
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

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { number, capacity, status } = req.body;

  if (number === undefined) {
    return res.status(400).json({ error: "Number is required" });
  }
  if (!capacity || capacity > 8) {
    return res.status(400).json({ error: "Số lượng người không được quá 8 người" });
  }
  if (status === undefined) {
    return res.status(400).json({ error: "Status is required" });
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

router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (updates.capacity && updates.capacity > 8) {
    return res.status(400).json({ error: "Số lượng người không được quá 8 người" });
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

module.exports = router;
