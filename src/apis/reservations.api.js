const express = require("express");
const router = express.Router();
const connection = require("../../index");

// *Lấy tất cả danh sách đặt chỗ
router.get("/", (req, res) => {
  const sql = `
    SELECT tables.id, tables.number, tables.capacity, tables.status, reservations.fullname as guest_name
    FROM tables
    LEFT JOIN reservations ON tables.id = reservations.table_id
  `;
  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching tables:", err);
      return res.status(500).json({ error: "Failed to fetch tables" });
    }
    res.status(200).json(results);
  });
});


// *Lấy thông tin đặt chỗ theo id
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT tables.id, tables.number, tables.capacity, tables.status, reservations.fullname as guest_name
    FROM tables
    LEFT JOIN reservations ON tables.id = reservations.table_id
    WHERE tables.id = ?
  `;
  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error fetching table:", err);
      return res.status(500).json({ error: "Failed to fetch table" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Table not found" });
    }
    res.status(200).json(results[0]);
  });
});


// *Thêm đặt chỗ mới
router.post("/", (req, res) => {
  const {
    reservation_code,
    user_id,
    promotion_id,
    fullname,
    tel,
    email,
    reservation_date,
    party_size,
    note,
    total_amount,
  } = req.body;

  const status = 1; // Trạng thái mặc định là "Chờ xác nhận"
  const validTotalAmount = total_amount ? parseFloat(total_amount) : 0;
  const deposit = validTotalAmount * 0.3;

  // Xác định sức chứa bàn cần tìm dựa vào số người
  let requiredCapacity;
  if (party_size === 1 || party_size === 2) {
    requiredCapacity = 2; // Bàn cho 2 người
  } else if (party_size >= 3 && party_size <= 4) {
    requiredCapacity = 4; // Bàn cho 4 người
  } else if (party_size >= 5 && party_size <= 6) {
    requiredCapacity = 6; // Bàn cho 6 người
  } else if (party_size >= 7 && party_size <= 8) {
    requiredCapacity = 8; // Bàn cho 8 người
  } else {
    requiredCapacity = 8; // Nhóm lớn hơn 8 người vẫn chỉ chọn bàn 8 người
  }

  // SQL để tìm bàn phù hợp
  const today = new Date().toISOString().split("T")[0];
  const reservationDate = new Date(reservation_date).toISOString().split("T")[0];

  const findTableSql =
    reservationDate === today
      ? `
        SELECT id, number, capacity
        FROM tables
        WHERE capacity >= ? AND status = 1
        ORDER BY capacity ASC, id ASC
        LIMIT 1
      `
      : `
        SELECT id, number, capacity
        FROM tables
        WHERE capacity >= ? AND (status = 1 OR status = 0)
        ORDER BY status DESC, capacity ASC, id ASC
        LIMIT 1
      `;

  // Thực thi truy vấn để tìm bàn
  connection.query(findTableSql, [requiredCapacity], (err, tableResults) => {
    if (err) {
      console.error("Error finding table:", err);
      return res.status(500).json({ error: "Failed to find a suitable table" });
    }

    if (tableResults.length === 0) {
      return res
        .status(400)
        .json({ error: "No available table for the specified party size" });
    }

    const table = tableResults[0]; // Lấy bàn đầu tiên phù hợp
    const tableId = table.id;

    // SQL để thêm đặt bàn (bao gồm table_id)
    const sql = `
      INSERT INTO reservations 
      (reservation_code, user_id, promotion_id, fullname, tel, email, reservation_date, party_size, note, total_amount, deposit, status, table_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(
      sql,
      [
        reservation_code,
        user_id,
        promotion_id,
        fullname,
        tel,
        email,
        reservation_date,
        party_size,
        note,
        validTotalAmount,
        deposit,
        status,
        tableId,
      ],
      (err, results) => {
        if (err) {
          console.error("Error creating reservation:", err);
          return res
            .status(500)
            .json({ error: "Failed to create reservation" });
        }

        const reservationId = results.insertId;

        // Kiểm tra nếu reservation_date là ngày hiện tại
        if (reservationDate === today) {
          // Nếu ngày đặt bàn là hôm nay, cập nhật trạng thái bàn thành 0
          const updateTableSql = "UPDATE tables SET status = 0 WHERE id = ?";
          connection.query(updateTableSql, [tableId], (err) => {
            if (err) {
              console.error("Error updating table status:", err);
              return res
                .status(500)
                .json({ error: "Failed to update table status" });
            }
          });
        }

        // Xử lý giảm số lượng khuyến mãi nếu có
        if (promotion_id) {
          const updatePromotionSql =
            "UPDATE promotions SET quantity = quantity - 1 WHERE id = ? AND quantity > 0";
          connection.query(updatePromotionSql, [promotion_id], (err) => {
            if (err) {
              console.error("Error updating promotion quantity:", err);
              return res.status(500).json({
                error: "Failed to update promotion quantity",
              });
            }
            res.status(201).json({
              message: "Reservation created successfully",
              id: reservationId,
              table,
            });
          });
        } else {
          res.status(201).json({
            message: "Reservation created successfully",
            id: reservationId,
            table,
          });
        }
      }
    );
  });
});




// *Cập nhật đặt chỗ theo id bằng phương thức put
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const {
    user_id,
    promotion_id,
    fullname,
    tel,
    email,
    reservation_date,
    party_size,
    note,
    total_amount,
    deposit,
    status,
  } = req.body;

  const sql = `UPDATE reservations 
                 SET user_id = ?, promotion_id = ?, fullname = ?, tel = ?, email = ?, 
                     reservation_date = ?, party_size = ?, note = ?, total_amount = ?, deposit = ?, status = ? 
                 WHERE id = ?`;

  connection.query(
    sql,
    [
      user_id,
      promotion_id,
      fullname,
      tel,
      email,
      reservation_date,
      party_size,
      note,
      total_amount,
      deposit,
      status,
      id,
    ],
    (err, results) => {
      if (err) {
        console.error("Error updating reservation:", err);
        return res.status(500).json({ error: "Failed to update reservation" });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Reservation not found" });
      }
      res.status(200).json({ message: "Reservation updated successfully" });
    }
  );
});

// *Cập nhật đặt chỗ theo id bằng phương thức patch
router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const sql = "UPDATE reservations SET ? WHERE id = ?";
  connection.query(sql, [updates, id], (err, results) => {
    if (err) {
      console.error("Error partially updating reservation:", err);
      return res
        .status(500)
        .json({ error: "Failed to partially update reservation" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Reservation not found" });
    }
    res.status(200).json({ message: "Reservation updated successfully" });
  });
});

// *Xóa đặt chỗ theo id
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM reservations WHERE id = ?";
  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error deleting reservation:", err);
      return res.status(500).json({ error: "Failed to delete reservation" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Reservation not found" });
    }
    res.status(200).json({ message: "Reservation deleted successfully" });
  });
});

module.exports = router;
