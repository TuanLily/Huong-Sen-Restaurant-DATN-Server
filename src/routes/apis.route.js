const express = require('express');
const router = express.Router();
const productCategoriessApi = require('../apis/product_categories.api');


router.use('/product_categories', productCategoriessApi);


module.exports = router;
