const express = require("express");
const router = express.Router();

const productCategoriessApi = require("../apis/product_categories.api");
const CustomerApi = require("../apis/customers.api");
const AuthApi = require("../apis/auth.api");
const employeesApi = require("../apis/employees.api");
const rolesApi = require("../apis/roles.api");
const categoryBlogsApi = require("../apis/category_blogs.api");
const blogsApi = require("../apis/blogs.api");
const reservationsApi = require("../apis/reservations.api");
const productsApi = require("../apis/products.api");
const permissionsApi = require("../apis/permissions.api");
const promotionsApi = require("../apis/promotions.api");
const tablesBlogsApi = require("../apis/tables.api");
const autAdminApi = require("../apis/auth_admin");
const commentBlogApi = require("../apis/comment_blog.api");
const usersAPI = require("../apis/users.api");
const role_permissionsApi = require("../apis/roles_permissions.api")
const contactApi = require("../apis/contact.api")
const reservations_t_admin = require("../apis/reservations_admin_t.api")
const statistical = require("../apis/statistical.api")
const reservation_detail = require("../apis/reservation_detail.api")

const chatbotApi = require("../apis/ChatBot/chatbot_api");

const authenticateToken = require("../apis/authMiddleware");

// Privated Routes
router.use("/customer",  CustomerApi);
router.use("/employee", authenticateToken, employeesApi);
router.use("/blogs", authenticateToken, blogsApi);
router.use("/reservations", authenticateToken, reservationsApi);
router.use("/category-product", authenticateToken, productCategoriessApi);
router.use("/product", authenticateToken, productsApi);
router.use("/permissions", authenticateToken, permissionsApi);
router.use("/role", authenticateToken, rolesApi);
router.use("/roles_permissions", authenticateToken, role_permissionsApi);
router.use("/category-blog", authenticateToken, categoryBlogsApi);
router.use("/promotions", authenticateToken, promotionsApi);
router.use("/tables", authenticateToken, tablesBlogsApi);
router.use("/comment-blog", authenticateToken, commentBlogApi);
router.use("/reservations_t_admin", authenticateToken, reservations_t_admin);
router.use("/statistical", authenticateToken, statistical);

// Public Routes
router.use("/public/category-product", productCategoriessApi);
router.use("/public/product", productsApi);
router.use("/public/blogs", blogsApi);
router.use("/public/promotion", promotionsApi);
router.use("/public/reservations", reservationsApi);
router.use("/public/reservation_detail", reservation_detail)

// Normal Routes
router.use("/chatbot", chatbotApi);
router.use("/auth", AuthApi);
router.use("/auth_admin", autAdminApi);
router.use("/users", usersAPI);
router.use("/contact", contactApi);

module.exports = router;
