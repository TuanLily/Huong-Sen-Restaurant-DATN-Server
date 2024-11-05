const express = require("express");
const router = express.Router();
const connection = require("../../index");

// Lấy tất cả đặt bàn
router.get("/", (req, res) => {
  const {
    searchName = "",
    searchPhone = "",
    searchEmail = "",
    status = "",
    reservation_code = "",
    page = 1,
    pageSize = 10,
  } = req.query;

  // Đảm bảo page và pageSize là số nguyên
  const pageNumber = parseInt(page, 10) || 1;
  const size = parseInt(pageSize, 10) || 10;
  const offset = (pageNumber - 1) * size;

  // SQL truy vấn để lấy tổng số bản ghi
  const sqlCount =
    "SELECT COUNT(*) as total FROM reservations WHERE fullname LIKE ? AND tel LIKE ? AND email LIKE ? AND status LIKE ? AND reservation_code LIKE ?";

  // SQL truy vấn để lấy danh sách reservations phân trang
  // let sql = 'SELECT * FROM reservations WHERE fullname LIKE ? AND tel LIKE ? AND email LIKE ? AND status LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?';
  let sql = `
        SELECT r.*, t.number AS tableName 
        FROM reservations r
        LEFT JOIN tables t ON r.table_id = t.id
        WHERE r.fullname LIKE ? 
        AND r.tel LIKE ? 
        AND r.email LIKE ? 
        AND r.status LIKE ? 
        AND r.reservation_code LIKE ? 
        ORDER BY r.id DESC 
        LIMIT ? OFFSET ?
    `;

  // Đếm tổng số bản ghi khớp với tìm kiếm
  connection.query(
    sqlCount,
    [
      `%${searchName}%`,
      `%${searchPhone}%`,
      `%${searchEmail}%`,
      `%${status}%`,
      `%${reservation_code}%`,
    ],
    (err, countResults) => {
      if (err) {
        console.error("Error counting reservations:", err);
        return res.status(500).json({ error: "Failed to count reservations" });
      }

      const totalCount = countResults[0].total;
      const totalPages = Math.ceil(totalCount / size); // Tính tổng số trang

      // Lấy danh sách reservations cho trang hiện tại
      connection.query(
        sql,
        [
          `%${searchName}%`,
          `%${searchPhone}%`,
          `%${searchEmail}%`,
          `%${status}%`,
          `%${reservation_code}%`,
          size,
          offset,
        ],
        (err, results) => {
          if (err) {
            console.error("Error fetching reservations:", err);
            return res
              .status(500)
              .json({ error: "Failed to fetch reservations" });
          }

          // Trả về kết quả với thông tin phân trang
          res.status(200).json({
            message: "Show list reservations successfully",
            results,
            totalCount,
            totalPages,
            currentPage: pageNumber,
          });
        }
      );
    }
  );
});

// Lấy tất cả đặt bàn theo id người dùng
router.get("/myBooking/:user_id", (req, res) => {
  const { user_id } = req.params;
  const {
    searchName = "",
    searchPhone = "",
    searchEmail = "",
    status = "",
    page = 1,
    pageSize = 10,
  } = req.query;

  // Đảm bảo page và pageSize là số nguyên
  const pageNumber = parseInt(page, 10) || 1;
  const size = parseInt(pageSize, 10) || 10;
  const offset = (pageNumber - 1) * size;

  // SQL truy vấn để lấy tổng số bản ghi (thêm điều kiện user_id)
  const sqlCount = `
        SELECT COUNT(*) as total 
        FROM reservations 
        WHERE fullname LIKE ? 
        AND tel LIKE ? 
        AND email LIKE ? 
        AND status LIKE ? 
        AND user_id = ?
    `;

  // SQL truy vấn để lấy danh sách reservations phân trang (thêm điều kiện user_id)
  const sql = `
        SELECT r.*, t.number AS tableName 
        FROM reservations r
        LEFT JOIN tables t ON r.table_id = t.id
        WHERE r.fullname LIKE ? 
        AND r.tel LIKE ? 
        AND r.email LIKE ? 
        AND r.status LIKE ? 
        AND r.user_id = ?
        ORDER BY r.id DESC 
        LIMIT ? OFFSET ?
    `;

  // Đếm tổng số bản ghi khớp với tìm kiếm và user_id
  connection.query(
    sqlCount,
    [
      `%${searchName}%`,
      `%${searchPhone}%`,
      `%${searchEmail}%`,
      `%${status}%`,
      user_id,
    ],
    (err, countResults) => {
      if (err) {
        console.error("Error counting reservations:", err);
        return res.status(500).json({ error: "Failed to count reservations" });
      }

      const totalCount = countResults[0].total;
      const totalPages = Math.ceil(totalCount / size); // Tính tổng số trang

      // Lấy danh sách reservations cho trang hiện tại và khớp user_id
      connection.query(
        sql,
        [
          `%${searchName}%`,
          `%${searchPhone}%`,
          `%${searchEmail}%`,
          `%${status}%`,
          user_id,
          size,
          offset,
        ],
        (err, results) => {
          if (err) {
            console.error("Error fetching reservations:", err);
            return res
              .status(500)
              .json({ error: "Failed to fetch reservations" });
          }

          // Trả về kết quả với thông tin phân trang
          res.status(200).json({
            message: "Show list reservations successfully",
            results,
            totalCount,
            totalPages,
            currentPage: pageNumber,
          });
        }
      );
    }
  );
});

// Lấy đặt bàn theo id
router.get("/:id", (req, res) => {
  const { id } = req.params;

  // SQL truy vấn để lấy thông tin đặt bàn theo ID
  const sql = `
        SELECT r.*, t.number AS tableName, p.discount AS discount 
        FROM reservations r
        LEFT JOIN tables t ON r.table_id = t.id
        LEFT JOIN promotions p ON r.promotion_id = p.id
        WHERE r.id = ?
    `;

  // Thực hiện truy vấn
  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error fetching reservation by ID:", err);
      return res.status(500).json({ error: "Failed to fetch reservation" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const pageNumber = 1;
    const totalCount = 1;
    const totalPages = 1;

    // Trả về kết quả
    res.status(200).json({
      message: "Show list reservations successfully",
      results,
      totalCount,
      totalPages,
      currentPage: pageNumber,
    });
  });
});

// Lấy tất cả chi tiết đặt bàn theo reservation_id
router.get("/reservation_details/:reservation_id", (req, res) => {
  const { reservation_id } = req.params;

  // SQL truy vấn để lấy danh sách reservations kèm theo thông tin sản phẩm
  let sql = `
        SELECT rd.*, p.name AS product_name, p.image AS product_image
        FROM reservation_details rd
        JOIN products p ON rd.product_id = p.id
        WHERE rd.reservation_id = ?
    `;

  // Lấy danh sách
  connection.query(sql, [reservation_id], (err, results) => {
    if (err) {
      console.error("Error fetching reservation_details:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch reservation_details" });
    }

    // Trả về kết quả với thông tin phân trang
    res.status(200).json({
      message: "Show list reservation_details successfully",
      results,
    });
  });
});

// Hàm cập nhật hoặc thêm sản phẩm
const upsertProducts = async (reservationId, products) => {
  // Kiểm tra nếu không có sản phẩm
  if (!Array.isArray(products) || products.length === 0) {
    console.warn("Không có sản phẩm nào để cập nhật.");
    return;
  }

  console.log("ID đặt chỗ:", reservationId);
  console.log("Danh sách sản phẩm:", products);

  try {
    // Truy vấn danh sách sản phẩm hiện có theo reservation_id
    connection.query(
      `SELECT product_id, quantity, price FROM reservation_details WHERE reservation_id = ?`,
      [reservationId],
      async (error, results) => {
        if (error) {
          console.error("Lỗi truy vấn:", error);
          throw new Error("Lỗi khi truy vấn sản phẩm.");
        }

        console.log("Kết quả truy vấn:", results);

        // Kiểm tra xem kết quả có trả về mảng hay không
        const existingProducts = Array.isArray(results) ? results : [];
        console.log("existingProducts:", existingProducts);

        // Tạo một đối tượng để tra cứu sản phẩm đã có
        const existingProductMap = {};
        existingProducts.forEach((product) => {
          existingProductMap[product.product_id] = product;
        });

        console.log("existingProductMap:", existingProductMap);

        // Duyệt qua từng sản phẩm và thực hiện truy vấn tương ứng
        const queries = products
          .map((product) => {
            const { product_id, quantity, price } = product;

            // Kiểm tra dữ liệu sản phẩm trước khi thực hiện truy vấn
            if (
              product_id === undefined ||
              quantity === undefined ||
              price === undefined
            ) {
              console.warn(`Thiếu dữ liệu sản phẩm:`, product);
              return null; // Bỏ qua sản phẩm nếu thiếu dữ liệu
            }

            console.log("Đang xử lý sản phẩm:", product);

            if (existingProductMap[product_id]) {
              const existingProduct = existingProductMap[product_id];
              const newQuantity = existingProduct.quantity + quantity;

              console.log(
                `Cập nhật số lượng mới cho sản phẩm ${product_id}:`,
                newQuantity
              );

              // Truy vấn cập nhật sản phẩm nếu đã tồn tại
              return new Promise((resolve, reject) => {
                connection.query(
                  `UPDATE reservation_details SET quantity = ? WHERE reservation_id = ? AND product_id = ?`,
                  [newQuantity, reservationId, product_id],
                  (err) => {
                    if (err) reject(err);
                    else resolve();
                  }
                );
              });
            } else {
              // Thêm mới sản phẩm nếu chưa tồn tại
              console.log(`Thêm mới sản phẩm:`, product);

              return new Promise((resolve, reject) => {
                connection.query(
                  `INSERT INTO reservation_details (reservation_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
                  [reservationId, product_id, quantity, price],
                  (err) => {
                    if (err) reject(err);
                    else resolve();
                  }
                );
              });
            }
          })
          .filter((query) => query !== null); // Loại bỏ các truy vấn không hợp lệ

        // Đợi tất cả các truy vấn hoàn thành
        try {
          await Promise.all(queries);
          console.log("Tất cả sản phẩm đã được cập nhật.");
        } catch (err) {
          console.error("Lỗi khi cập nhật sản phẩm:", err);
          throw new Error("Lỗi khi thực hiện truy vấn.");
        }
      }
    );
  } catch (error) {
    console.error("Lỗi khi cập nhật sản phẩm:", error);
    throw new Error("Lỗi khi xử lý sản phẩm.");
  }
};

// Route PATCH để cập nhật đặt chỗ
router.patch("/reservation_ad/:id", async (req, res) => {
  const reservationId = req.params.id;
  const {
    fullname,
    tel,
    email,
    reservation_date,
    party_size,
    note,
    total_amount,
    deposit,
    status,
    products,
  } = req.body;

  try {
    // Cập nhật thông tin đặt chỗ
    const updateReservationQuery = `
            UPDATE reservations
            SET fullname = ?, tel = ?, email = ?, reservation_date = ?,
                party_size = ?, note = ?, total_amount = ?, deposit = ?, status = ?
            WHERE id = ?`;

    await connection.query(updateReservationQuery, [
      fullname,
      tel,
      email,
      reservation_date,
      party_size,
      note,
      total_amount,
      deposit,
      status,
      reservationId,
    ]);

    // Nếu có sản phẩm thì xử lý cập nhật hoặc thêm mới
    if (Array.isArray(products) && products.length > 0) {
      await upsertProducts(reservationId, products);
    }

    res.status(200).json({ message: "Cập nhật thông tin đặt chỗ thành công" });
  } catch (error) {
    console.error("Lỗi khi cập nhật đặt chỗ:", error);
    res.status(500).json({ message: "Có lỗi xảy ra", error: error.message });
  }
});


// *Cập nhật trạng thái theo id bằng phương thức patch
router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const sql = "UPDATE reservations SET ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";

  connection.query(sql, [updates, id], (err, results) => {
    if (err) {
      console.error("Error partially updating reservations:", err);
      return res.status(500).json({ error: "Failed to partially update reservations" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    // Only update table status if status is 0, 2, or 5
    if ([0, 2, 5].includes(updates.status)) {
      const getAndUpdateTableSql = `
        UPDATE tables 
        SET status = 1 
        WHERE id = (SELECT table_id FROM reservations WHERE id = ?)
      `;

      connection.query(getAndUpdateTableSql, [id], (err, tableResults) => {
        if (err) {
          console.error("Error updating table status:", err);
          return res.status(500).json({ error: "Failed to update table status" });
        }
        if (tableResults.affectedRows === 0) {
          return res.status(404).json({ error: "Table not found for the reservation" });
        }
        return res.status(200).json({ message: "Reservations and table status updated successfully" });
      });
    } else {
      res.status(200).json({ message: "Reservations updated successfully" });
    }
  });
});

// *Xóa reservations theo id
router.delete("/:reservationId/:productId", (req, res) => {
  const { reservationId, productId } = req.params;
  const sql =
    "DELETE FROM reservation_details WHERE reservation_id = ? AND product_id = ?";

  connection.query(sql, [reservationId, productId], (err, results) => {
    if (err) {
      console.error("Error deleting product:", err);
      return res
        .status(500)
        .json({ error: "Failed to delete product from reservation" });
    }
    if (results.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Product not found in the reservation" });
    }
    res
      .status(200)
      .json({ message: "Product deleted successfully from reservation" });
  });
});

router.delete("/:reservationId/:productId", (req, res) => {
  const { reservationId, productId } = req.params;
  const sql =
    "DELETE FROM reservation_details WHERE reservation_id = ? AND product_id = ?";

  connection.query(sql, [reservationId, productId], (err, results) => {
    if (err) {
      console.error("Error deleting product:", err);
      return res
        .status(500)
        .json({ error: "Failed to delete product from reservation" });
    }
    if (results.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Product not found in the reservation" });
    }
    res
      .status(200)
      .json({ message: "Product deleted successfully from reservation" });
  });
});
router.get("/existing-reservations", (req, res) => {
  const sql = "SELECT reservation_code FROM reservations"; // Thay đổi tên bảng theo cấu trúc của bạn
  db.query(sql, (error, results) => {
    if (error) {
      console.error("Error fetching existing reservations:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Lấy chỉ các reservation_code
    const existingCodes = results.map((row) => row.reservation_code);
    res.json(existingCodes); // Trả về danh sách mã đã tồn tại
  });
});

router.post("/", (req, res) => {
  const {
    reservation_code,
    fullname,
    email,
    tel,
    reservation_date,
    status,
    deposit,
    partySize,
    notes,
    totalAmount,
    products,
  } = req.body; // Đối tượng chứa thông tin đặt bàn

  console.log(req.body);

  const sqlReservation = `
        INSERT INTO reservations (	reservation_code ,fullname, email, tel, reservation_date, status, deposit, party_size, note, total_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)
    `;

  connection.beginTransaction((err) => {
    if (err) {
      console.error("Lỗi khi bắt đầu giao dịch:", err);
      return res.status(500).json({ message: "Lỗi khi bắt đầu giao dịch" });
    }

    connection.query(
      sqlReservation,
      [
        reservation_code,
        fullname,
        email,
        tel,
        reservation_date,
        status,
        deposit,
        partySize,
        notes,
        totalAmount,
      ],
      (err, results) => {
        if (err) {
          return rollbackTransaction(res, "Không thể tạo đặt bàn", err);
        }

        const reservationId = results.insertId; // Lấy ID của reservation vừa thêm
        if (products && products.length > 0) {
          addProductsToReservation(reservationId, products, res);
        } else {
          commitTransaction(res, "Đặt bàn thành công");
        }
      }
    );
  });
});

// Cập nhật toàn bộ thông tin của một đặt bàn

// Cập nhật từng phần thông tin đặt bàn

const deleteOldProducts = (reservationId, products, res) => {
  const sqlDeleteProducts = `
        DELETE FROM reservation_details WHERE reservation_id = ?
    `;

  connection.query(sqlDeleteProducts, [reservationId], (err) => {
    if (err) {
      return rollbackTransaction(res, "Lỗi khi xóa sản phẩm cũ", err);
    }

    if (products && products.length > 0) {
      addProductsToReservation(reservationId, products, res);
    } else {
      commitTransaction(res, "Cập nhật đặt bàn thành công");
    }
  });
};
const addProductsToReservation = (reservationId, products, res) => {
  const sqlProduct = `
        INSERT INTO reservation_details (reservation_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
    `;

  // Tạo các truy vấn để thêm từng sản phẩm vào bảng reservation_details
  let queries = products.map(
    (product) =>
      new Promise((resolve, reject) => {
        // Truyền thông tin của từng sản phẩm
        connection.query(
          sqlProduct,
          [reservationId, product.product_id, product.quantity, product.price],
          (err) => {
            if (err) {
              console.error("Lỗi khi thêm sản phẩm:", err);
              return reject(err);
            }
            resolve();
          }
        );
      })
  );

  // Chờ tất cả các truy vấn hoàn thành
  Promise.allSettled(queries).then((results) => {
    const errorOccurred = results.some(
      (result) => result.status === "rejected"
    );
    if (errorOccurred) {
      return rollbackTransaction(res, "Không thể thêm một hoặc nhiều sản phẩm");
    }
    commitTransaction(res, "Đặt bàn thành công");
  });
};

const rollbackTransaction = (res, message, error) => {
  connection.rollback(() => {
    console.error(message, error);
    res.status(500).json({ message }); // Chỉ trả về tin nhắn
  });
};

const commitTransaction = (res, message) => {
  connection.commit((err) => {
    if (err) {
      return rollbackTransaction(res, "Lỗi khi commit giao dịch", err);
    }
    res.status(201).json({ message }); // Chỉ trả về tin nhắn
  });
};

module.exports = router;
