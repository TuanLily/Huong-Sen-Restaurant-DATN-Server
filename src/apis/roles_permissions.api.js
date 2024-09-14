const express = require('express');
const router = express.Router();
const connection = require('../../index');

// Lấy tất cả danh sách tài khoản khách hàng với phân trang
router.get('/', (req, res) => {
    const { role_id } = req.query;

    // SQL truy vấn để lấy tất cả các bản ghi quyền liên quan đến role_id cụ thể
    const sql = `
        SELECT rp.role_id, p.id AS permission_id, p.title, p.name, p.label, p.created_at, p.updated_at
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ?;
    `;

    // Thực hiện truy vấn để lấy tất cả các bản ghi
    connection.query(sql, [role_id], (err, results) => {
        if (err) {
            console.error('Error fetching role_permissions:', err);
            return res.status(500).json({ error: 'Failed to fetch role_permissions' });
        }

        // Trả về kết quả
        res.status(200).json({
            message: 'Show list role successfully',
            results
        });
    });
});




// *Lấy thông tin vai trò theo id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM role_permissions WHERE role_id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Lỗi khi lấy thông tin vai trò:', err);
            return res.status(500).json({ error: 'Không thể lấy thông tin vai trò' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy vai trò' });
        }
        res.status(200).json(results[0]);
    });
});

// *Thêm vai trò mới
router.post('/', (req, res) => {
    const permissions = req.body; // Mảng chứa các đối tượng { role_id, permission_id }
  
   
  
    // Thực hiện chèn từng đối tượng vào cơ sở dữ liệu
    const sql = 'INSERT INTO role_permissions (role_id, permission_id) VALUES ?';
    const values = permissions.map(p => [p.role_id, p.permission_id]);
  
    connection.query(sql, [values], (err, results) => {
      if (err) {
        console.error('Lỗi khi tạo thêm quyền hạn vào vai trò:', err);
        return res.status(500).json({ error: 'Không thể tạo quyền hạn vào vai trò' });
      }
      res.status(201).json({ message: "Thêm quyền hạn vào vai trò thành công", affectedRows: results.affectedRows });
    });
  });
  

  
  
// *Cập nhật vai trò theo id bằng phương thức put
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    if(!name){
        return res.status(404).json({ error: 'Name is required' });
    }

    const sql = 'UPDATE role_permissions SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [name, description, id], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Vai trò đã tồn tại' });
            }
            console.error('Lỗi khi cập nhật vai trò:', err);
            return res.status(500).json({ error: 'Không thể cập nhật vai trò' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy vai trò' });
        }
        res.status(200).json({ message: "Cập nhật vai trò thành công" });
    });
});

// *Cập nhật vai trò theo id bằng phương thức patch
router.patch('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    if(!updates.name){
        return res.status(404).json({ error: 'Name is required' });
    }

    // Kiểm tra xem vai trò có phải là "Chưa phân loại" hay không
    const checkSql = 'SELECT name FROM role_permissions WHERE id = ?';
    connection.query(checkSql, [id], (checkErr, checkResults) => {
        if (checkErr) {
            console.error('Lỗi khi kiểm tra vai trò:', checkErr);
            return res.status(500).json({ error: 'Không thể kiểm tra vai trò' });
        }

        if (checkResults.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy vai trò' });
        }

        const roleName = checkResults[0].name;

        if (roleName === 'Chưa phân loại') {
            return res.status(403).json({ error: 'Không thể chỉnh sửa vai trò "Chưa phân loại"' });
        }

    const sql = 'UPDATE role_permissions SET ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [updates, id], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Vai trò đã tồn tại' });
            }
            console.error('Lỗi khi cập nhật một phần vai trò:', err);
            return res.status(500).json({ error: 'Không thể cập nhật một phần vai trò' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy vai trò' });
        }
        res.status(200).json({ message: "Cập nhật một phần vai trò thành công" });
        });
    });
});

// *Xóa vai trò theo id
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    // Xóa vai trò trực tiếp
    const deleteSql = 'DELETE FROM role_permissions WHERE role_id = ?';
    connection.query(deleteSql, [id], (deleteErr, deleteResults) => {
        if (deleteErr) {
            console.error('Lỗi khi xóa vai trò:', deleteErr);
            return res.status(500).json({ error: 'Không thể xóa vai trò' });
        }

        if (deleteResults.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy vai trò' });
        }

        res.status(200).json({ message: 'Xóa vai trò thành công' });
    });
});


module.exports = router;
