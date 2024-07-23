const express = require('express');
const router = express.Router();


const productCategoriessApi = require('../apis/product_categories.api');
const CustomerApi = require('../apis/customers.api');
const AuthApi = require('../apis/auth.api');
const productCategoriessApi = require('../apis/product_categories.api');
const employeesApi = require('../apis/employees.api');


router.use('/product_categories', productCategoriessApi);
router.use('/customer', CustomerApi);
router.use('/auth', AuthApi);

router.use('/employees', employeesApi);


module.exports = router;
