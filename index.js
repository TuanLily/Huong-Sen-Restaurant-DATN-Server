const express = require('express');
const cors = require('cors');
const path = require("path");
const mysql = require('mysql');
require('dotenv').config();
const bodyParser = require('body-parser');

const port = process.env.DB_POST || 3200;

const server = express();

// Sử dụng body-parser
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(cors());

server.use(express.static(path.join(__dirname, "src")))

// Kết nối tới cơ sở dữ liệu MySQL
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database');
});

server.on('close', () => {
    connection.end();
    console.log('Connection to database closed');
});

module.exports = connection;

// TODO - Cấu hình Router API
server.use("/api", require("./src/routes/apis.route"));


server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});