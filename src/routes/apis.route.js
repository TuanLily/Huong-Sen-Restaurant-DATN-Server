const express = require('express');
const router = express.Router();


const productCategoriessApi = require('../apis/product_categories.api');
const CustomerApi = require('../apis/customers.api');
const AuthApi = require('../apis/auth.api');


router.use('/product_categories', productCategoriessApi);
router.use('/customer', CustomerApi);
router.use('/auth', AuthApi);


module.exports = router;
