const express = require('express');
const router = express.Router();


const productCategoriessApi = require('../apis/product_categories.api');
const CustomerApi = require('../apis/customers.api');


router.use('/product_categories', productCategoriessApi);
router.use('/customer', CustomerApi);


module.exports = router;
