const express = require('express');
const router = express.Router();


const productCategoriessApi = require('../apis/product_categories.api');
const CustomerApi = require('../apis/customers.api');
const AuthApi = require('../apis/auth.api');
const employeesApi = require('../apis/employees.api');
const rolesApi = require('../apis/roles.api');
const categoryBlogsApi = require('../apis/category_blogs.api');
const blogsApi = require('../apis/blogs.api');
const reservationsApi = require('../apis/reservations.api');
const productsApi = require('../apis/products.api');
const permissionsApi = require("../apis/permissions.api")
const promotionsApi = require('../apis/promotions.api')
const tablesBlogsApi = require("../apis/tables.api")

router.use('/customer', CustomerApi);
router.use('/auth', AuthApi);
router.use('/employee', employeesApi);
router.use('/blogs', blogsApi);
router.use('/reservations', reservationsApi);
router.use('/category-product', productCategoriessApi);
router.use('/product', productsApi);
router.use("/permissions", permissionsApi)
router.use("/role", rolesApi);
router.use("/category-blog", categoryBlogsApi);
router.use("/promotions", promotionsApi);
router.use("/tables", tablesBlogsApi);

module.exports = router;
