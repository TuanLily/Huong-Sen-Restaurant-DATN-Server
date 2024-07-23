const express = require('express');
const router = express.Router();


const productCategoriessApi = require('../apis/product_categories.api');
const CustomerApi = require('../apis/customers.api');
const AuthApi = require('../apis/auth.api');
const productCategoriessApi = require('../apis/product_categories.api');
const employeesApi = require('../apis/employees.api');
const rolesApi = require('../apis/roles.api');
const category_blogsApi = require('../apis/category_blogs.api');

router.use('/product_categories', productCategoriessApi);
router.use('/customer', CustomerApi);
router.use('/auth', AuthApi);
router.use('/employees', employeesApi);
router.use('/roles', rolesApi);
router.use('/category_blogs', category_blogsApi);


module.exports = router;
