const express = require('express');
const router = express.Router();
const connection = require('../../index');


router.get('/', (req, res) => {
    const sql = 'SELECT * FROM product_categories';

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return res.status(500).json({ error: 'Failed to fetch categories' });
        }

        res.status(201).json(results);
    });
});

module.exports = router;