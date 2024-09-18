const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const connection = require('../../index');

router.post('/', (req, res) => {
    const { name, email, subject, message } = req.body;

    console.log("Dữ liệu email từ client gởi về: ", email);

    // Kiểm tra thông tin
    if (!name || !email || !subject || !message) {
        return res.status(400).send('Thiếu thông tin cần thiết.');
    }

    // Thiết lập transporter cho nodemailer
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USERNAME, // Đảm bảo biến môi trường này được thiết lập
            pass: process.env.EMAIL_PASSWORD // Đảm bảo biến môi trường này được thiết lập
        }
    });

    // Thiết lập nội dung email
    const mailOptions = {
        from: email,
        to: 'sutten2004@gmail.com', 
        subject: `Mail liên hệ từ khách ${name} với chủ đề "${subject}"`,
        html: `
            <div style="max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
                <h1 style="text-align: center; color: #333;">Thông tin liên hệ từ khách hàng</h1>
                <div style="border: 1px solid #ccc; border-radius: 8px; padding: 15px; background-color: #fff;">
                    <p style="margin: 0; font-size: 16px;"><strong>Tên:</strong> ${name}</p>
                    <p style="margin: 0; font-size: 16px;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 0; font-size: 16px;"><strong>Chủ đề:</strong> ${subject}</p>
                    <p style="margin: 0; font-size: 16px;"><strong>Nội dung:</strong></p>
                    <p style="margin: 0; font-size: 16px;">${message}</p>
                </div>
            </div>
        `,
        replyTo: email 
    };


    // Gửi email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send(error.toString());
        }
        res.status(200).send('Email sent: ' + info.response);
    });
});

module.exports = router;
