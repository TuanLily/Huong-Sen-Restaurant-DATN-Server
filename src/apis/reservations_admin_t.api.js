const express = require("express");
const router = express.Router();
const connection = require("../../index");

router.post("/changedishes", (req, res) => { 
  const reservation_id = req.body.selecteReservation_id;
  const dishesArray = Array.isArray(req.body.selectedChangedishes) ? req.body.selectedChangedishes : JSON.parse(req.body.selectedChangedishes || '[]');
  const totalPayable = dishesArray.length > 0 ? dishesArray[0].total_amount : 0;

  // Bắt đầu transaction
  connection.beginTransaction((err) => {
      if (err) {
          return res.status(500).json({ message: "Transaction error", error: err });
      }

      // Cập nhật total_amount trong bảng reservations
      connection.query(
          "UPDATE reservations SET total_amount = ?, number_change = ? WHERE id = ?",
          [totalPayable, 2, reservation_id],
          (error, results) => {
              if (error) {
                  return connection.rollback(() => {
                      res.status(500).json({ message: "Error updating total_amount", error });
                  });
              }

              // Xóa các dòng trong bảng reservation_details
              connection.query(
                  "DELETE FROM reservation_details WHERE reservation_id = ?",
                  [reservation_id],
                  (deleteError) => {
                      if (deleteError) {
                          return connection.rollback(() => {
                              res.status(500).json({ message: "Error deleting reservation_details", error: deleteError });
                          });
                      }

                      // Thêm các dòng mới vào bảng reservation_details
                      const insertQueries = dishesArray.map(dish => {
                          return new Promise((resolve, reject) => {
                              connection.query(
                                  "INSERT INTO reservation_details (reservation_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
                                  [reservation_id, dish.product_id, dish.quantity, dish.price],
                                  (insertError, insertResults) => {
                                      if (insertError) {
                                          return reject(insertError);
                                      }
                                      resolve(insertResults);
                                  }
                              );
                          });
                      });

                      // Chờ tất cả các insert hoàn thành
                      Promise.all(insertQueries)
                          .then(() => {
                              connection.commit((commitError) => {
                                  if (commitError) {
                                      return connection.rollback(() => {
                                          res.status(500).json({ message: "Transaction commit error", error: commitError });
                                      });
                                  }
                                  res.status(200).json({ message: "Changed dishes updated successfully" });
                              });
                          })
                          .catch((insertError) => {
                              connection.rollback(() => {
                                  res.status(500).json({ message: "Error inserting into reservation_details", error: insertError });
                              });
                          });
                  }
              );
          }
      );
  });
});

router.patch("/notChange", (req, res) => { 
  const reservation_id = req.body.selecteReservation_id;

  // Kiểm tra xem reservation_id có được cung cấp không
  if (!reservation_id) {
      return res.status(400).json({ message: "reservation_id is required." });
  }

  // Câu lệnh SQL để cập nhật number_change
  const sql = "UPDATE reservations SET number_change = ? WHERE id = ?";
  const values = [2, reservation_id];

  connection.query(sql, values, (error, results) => {
      if (error) {
          console.error("Error updating reservation:", error);
          return res.status(500).json({ message: "Internal server error." });
      }

      // Kiểm tra xem có bản ghi nào được cập nhật không
      if (results.affectedRows === 0) {
          return res.status(404).json({ message: "Reservation not found." });
      }

      return res.status(200).json({ message: "Reservation updated successfully." });
  });
});

// Ghép bàn cho đơn đang xử lý
router.post("/addTable", (req, res) => { 
  const { reservationID } = req.body; 

  // Lấy thông tin đơn đặt bàn đang xử lý
  const getReservationQuery = `SELECT * FROM reservations WHERE id = ?`;
  connection.query(getReservationQuery, [reservationID], (err, reservationResults) => {
    if (err) return res.status(500).json({ error: err.message });
    if (reservationResults.length === 0) return res.status(404).json({ message: "Đặt bàn không tồn tại hoặc không hợp lệ." });

    const reservation = reservationResults[0];
    const partySize = reservation.party_size;

    // Lấy danh sách tất cả các bàn phù hợp với sức chứa
    const getAvailableTablesQuery = `SELECT * FROM tables 
    WHERE (capacity = 2 AND ? = 1) OR
          (capacity = 2 AND ? = 2) OR
          (capacity = 4 AND ? = 3) OR
          (capacity = 4 AND ? = 4) OR
          (capacity = 6 AND ? = 5) OR
          (capacity = 6 AND ? = 6) OR
          (capacity = 8 AND ? = 7) OR
          (capacity = 8 AND ? = 8)`;
    connection.query(getAvailableTablesQuery, [partySize, partySize, partySize, partySize, partySize, partySize, partySize, partySize], (err, tableResults) => {
      if (err) return res.status(500).json({ error: err.message });

      let suitableTableId = null;

      // Kiểm tra từng bàn
      const checkTableReservationsPromises = tableResults.map(table => {
        return new Promise((resolve) => {
          const getTableReservationsQuery = `
            SELECT status FROM reservations 
            WHERE table_id = ? AND DATE(reservation_date) = DATE(?)`;
          
          connection.query(getTableReservationsQuery, [table.id, reservation.reservation_date], (err, tableReservationResults) => {
            if (err) {
              resolve(null); // Nếu có lỗi, trả về null
            } else {
              // Kiểm tra trạng thái của các đơn đặt bàn
              const invalidStatuses = [3, 4];
              const hasInvalidReservations = tableReservationResults.some(res => invalidStatuses.includes(res.status));

              // Nếu không có đơn đặt bàn nào có trạng thái 3 hoặc 4, lưu ID bàn
              if (!hasInvalidReservations) {
                suitableTableId = table.id; // Lưu ID của bàn thỏa mãn điều kiện
              }
              resolve(suitableTableId); // Trả về ID bàn thỏa mãn hoặc null
            }
          });
        });
      });

      // Chờ tất cả các kiểm tra bàn hoàn thành
      Promise.all(checkTableReservationsPromises).then((results) => {
        // Lọc ra bàn phù hợp
        suitableTableId = results.find(id => id !== null);
        
        if (suitableTableId) {
          // Cập nhật table_id của đơn đặt bàn
          const updateReservationTableQuery = `UPDATE reservations SET table_id = ? WHERE id = ?`;
          connection.query(updateReservationTableQuery, [suitableTableId, reservationID], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            return res.status(200).json({ message: "Ghép bàn thành công!", table_id: suitableTableId });
          });
        } else {
          return res.status(400).json({ message: "Không có bàn phù hợp để ghép." });
        }
      });
    });
  });
});

// Lấy tất cả đặt bàn
router.get("/", (req, res) => {
  const {
    searchName = "",
    searchPhone = "",
    searchEmail = "",
    status = "",
    reservation_code = "",
    page = 1,
    limit = 10,
  } = req.query;

  // Chuyển đổi giá trị limit thành số nguyên, mặc định là 10 nếu không có
  const limitNumber = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10; // Kiểm tra limit có phải là số nguyên dương không, nếu không thì dùng 10

  // Đảm bảo page và pageSize là số nguyên
  const pageNumber = parseInt(page, 10);
  const offset = (pageNumber - 1) * limitNumber; // Tính toán offset
  const seaName = `%${searchName}%`; // Thêm dấu % cho tìm kiếm
  const seaPhone = `%${searchPhone}%`; // Thêm dấu % cho tìm kiếm
  const seaEmail = `%${searchEmail}%`; // Thêm dấu % cho tìm kiếm
  const seaStatus = `%${status}%`; // Thêm dấu % cho tìm kiếm
  const seaCode = `%${reservation_code}%`; // Thêm dấu % cho tìm kiếm

  // SQL truy vấn để lấy tổng số bản ghi
  const sqlCount =
    "SELECT COUNT(*) as total FROM reservations WHERE fullname LIKE ? AND tel LIKE ? AND email LIKE ? AND status LIKE ? AND reservation_code LIKE ?";

  // SQL truy vấn để lấy danh sách reservations phân trang
  // let sql = `
  //   SELECT r.*, t.number AS tableName, p.discount 
  //   FROM reservations r
  //   LEFT JOIN tables t ON r.table_id = t.id
  //   LEFT JOIN promotions p ON r.promotion_id = p.id
  //   WHERE r.fullname LIKE ? 
  //   AND r.tel LIKE ? 
  //   AND r.email LIKE ? 
  //   AND r.status LIKE ? 
  //   AND r.reservation_code LIKE ? 
  //   ORDER BY r.id DESC 
  // `;

  let sql = `
  SELECT 
    r.*, 
    t.number AS tableName, 
    p.discount,
    IFNULL(
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'product_id', cd.product_id,
          'quantity', cd.quantity,
          'price', cd.price,
          'total_amount', cd.total_amount,
          'productName', cd.productName,
          'productImage', cd.productImage,
          'taxMoney', cd.taxMoney,
          'reducedMoney', cd.reducedMoney
        )
      ), 
      JSON_ARRAY()
    ) AS changedishes
  FROM reservations r
  LEFT JOIN tables t ON r.table_id = t.id
  LEFT JOIN promotions p ON r.promotion_id = p.id
  LEFT JOIN changedishes cd ON r.id = cd.reservation_id
  WHERE r.fullname LIKE ? 
  AND r.tel LIKE ? 
  AND r.email LIKE ? 
  AND r.status LIKE ? 
  AND r.reservation_code LIKE ? 
  GROUP BY r.id
  ORDER BY r.id DESC
`;

  // Nếu có phân trang, thêm LIMIT và OFFSET
  const queryParams = [seaName, seaPhone, seaEmail, seaStatus, seaCode];
  if (page && limit) {
      sql += ' LIMIT ? OFFSET ?';
      queryParams.push(limitNumber, offset);
  }

  // Đếm tổng số bản ghi khớp với tìm kiếm
  connection.query(
    sqlCount,
    [
      seaName,
      seaPhone,
      seaEmail,
      seaStatus,
      seaCode,
    ],
    (err, countResults) => {
      if (err) {
        console.error("Error counting reservations:", err);
        return res.status(500).json({ error: "Failed to count reservations" });
      }

      const totalCount = countResults[0].total;
      const totalPages = Math.ceil(totalCount / limitNumber); // Tính tổng số trang


      // Lấy danh sách reservations cho trang hiện tại
      connection.query(
        sql,
        queryParams,
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
            limit: limitNumber,
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
        SELECT r.*, t.number AS tableName, p.discount 
        FROM reservations r
        LEFT JOIN tables t ON r.table_id = t.id
        LEFT JOIN promotions p ON r.promotion_id = p.id
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
    status,
    products,
  } = req.body;

  try {
    // Cập nhật thông tin đặt chỗ
    const updateReservationQuery = `
      UPDATE reservations
      SET fullname = ?, tel = ?, email = ?, reservation_date = ?,
          party_size = ?, note = ?, total_amount = ?, status = ?
      WHERE id = ?`;

    await connection.query(updateReservationQuery, [
      fullname,
      tel,
      email,
      reservation_date,
      party_size,
      note,
      total_amount,
      status,
      reservationId,
    ]);

    // Nếu có sản phẩm thì xử lý cập nhật hoặc thêm mới
    if (Array.isArray(products) && products.length > 0) {
      await upsertProducts(reservationId, products);
    }

    // Xác định trạng thái bàn ăn: 0 là có khách, 1 là không có khách
    const tableStatus = [3, 4].includes(status) ? 0 : 1; // Ví dụ: Status 3, 4 đại diện cho trạng thái bàn "có khách"

    // Lấy table_id từ bảng reservations
    const getTableIdQuery = `SELECT table_id FROM reservations WHERE id = ?`;
    const tableResults = await connection.query(getTableIdQuery, [reservationId]);

    if (!tableResults.length) {
      return res.status(404).json({ message: "Không tìm thấy thông tin bàn cho đặt chỗ này" });
    }

    const tableId = tableResults[0].table_id;

    // Cập nhật trạng thái bàn ăn
    const updateTableStatusQuery = `UPDATE tables SET status = ? WHERE id = ?`;
    await connection.query(updateTableStatusQuery, [tableStatus, tableId]);

    // Phản hồi thành công
    res.status(200).json({ message: "Cập nhật thông tin đặt chỗ và trạng thái bàn thành công" });
  } catch (error) {
    console.error("Lỗi khi cập nhật đặt chỗ:", error);
    res.status(500).json({ message: "Có lỗi xảy ra", error: error.message });
  }
});

// *Cập nhật trạng thái theo id bằng phương thức patch
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const sql = 'UPDATE reservations SET ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  connection.query(sql, [updates, id], (err, results) => {
      if (err) {
          console.error('Error partially updating reservations:', err);
          return res.status(500).json({ error: 'Failed to partially update reservations' });
      }
      if (results.affectedRows === 0) {
          return res.status(404).json({ error: 'Reservations not found' });
      }
      if (updates.status === 3) {
        const getTableIdSql = 'SELECT table_id FROM reservations WHERE id = ?';
        connection.query(getTableIdSql, [id], (err, tableResults) => {
          if (err) {
            console.error('Error fetching table ID:', err);
            return res.status(500).json({ error: 'Failed to fetch table ID' });
          }
  
          const table_id = tableResults[0]?.table_id;
          if (table_id) {
            const updateTableSql = 'UPDATE tables SET status = 0 WHERE id = ?';
            connection.query(updateTableSql, [table_id], (err, updateResults) => {
              if (err) {
                console.error('Error updating table status:', err);
                return res.status(500).json({ error: 'Failed to update table status' });
              }
              return res.status(200).json({ message: "Reservation and table status updated successfully" });
            });
          } else {
            return res.status(404).json({ error: 'Table ID not found' });
          }
        });
      }
      // Xử lý các status khác: 0, 1, 2, hoặc 5
      else if ([0, 1, 2, 5].includes(updates.status)) {
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
        return res.status(200).json({ message: "Reservations updated successfully" });
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

const findAvailableTable = (reservationDate, partySize, callback) => {
  const getAvailableTablesQuery = `
  SELECT * FROM tables 
  WHERE (? = 1 AND capacity = 2) OR
        (? = 2 AND capacity = 2) OR
        (? = 3 AND capacity = 4) OR
        (? = 4 AND capacity = 4) OR
        (? = 5 AND capacity = 6) OR
        (? = 6 AND capacity = 6) OR
        (? = 7 AND capacity = 8) OR
        (? = 8 AND capacity = 8)`;

  connection.query(getAvailableTablesQuery, 
    [partySize, partySize, partySize, partySize, partySize, partySize, partySize, partySize], 
    (err, tableResults) => {
      if (err) return callback(err, null);

      let suitableTableId = null;

      // Kiểm tra từng bàn
      const checkTableReservationsPromises = tableResults.map(table => {
        return new Promise((resolve) => {
          const getTableReservationsQuery = `
            SELECT status FROM reservations 
            WHERE table_id = ? AND DATE(reservation_date) = DATE(?)`;

          connection.query(getTableReservationsQuery, [table.id, reservationDate], (err, tableReservationResults) => {
            if (err) {
              resolve(null);
            } else {
              const invalidStatuses = [3, 4];
              const hasInvalidReservations = tableReservationResults.some(res => invalidStatuses.includes(res.status));

              if (!hasInvalidReservations) {
                suitableTableId = table.id;
              }
              resolve(suitableTableId);
            }
          });
        });
      });

      Promise.all(checkTableReservationsPromises).then((results) => {
        suitableTableId = results.find(id => id !== null);
        callback(null, suitableTableId);
      });
    });
};

router.post("/", (req, res) => {
  const {
    reservation_code,
    fullname,
    email,
    tel,
    reservation_date,
    status,
    partySize,
    notes,
    totalAmount,
    products,
  } = req.body;

  const deposit = req.body.deposit ? req.body.deposit : 0;

  console.log ('thay doi là:' , deposit);

  // Thực hiện giao dịch
  connection.beginTransaction((err) => {
    if (err) {
      console.error("Lỗi khi bắt đầu giao dịch:", err);
      return res.status(500).json({ message: "Lỗi khi bắt đầu giao dịch" });
    }

    // Gọi hàm để tìm bàn
    findAvailableTable(reservation_date, partySize, (err, suitableTableId) => {
      if (err) {
        return rollbackTransaction(res, "Lỗi khi tìm bàn", err);
      }

      // Kiểm tra xem có bàn phù hợp không
      if (!suitableTableId) {
        return rollbackTransaction(res, "Không có bàn trống", null);
      }

      // Chỉ thêm đơn đặt bàn
      const sqlReservation = `
        INSERT INTO reservations (reservation_code, fullname, email, tel, reservation_date, status, deposit, party_size, note, total_amount, table_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

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
          suitableTableId, // Sử dụng ID bàn tìm được
        ],
        (err, results) => {
          if (err) {
            return rollbackTransaction(res, "Không thể tạo đặt bàn", err);
          }

          const reservationId = results.insertId;

          // Thêm sản phẩm nếu có
          if (products && products.length > 0) {
            addProductsToReservation(reservationId, products, res);
          } else {
            commitTransaction(res, "Đặt bàn thành công", { reservationId });
          }
        }
      );
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
