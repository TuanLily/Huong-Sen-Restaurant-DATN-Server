const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
// API endpoint cho chatbot
const express = require('express');
const router = express.Router();

function vietnameseTokenizer(text) {
    // Tách các từ bằng khoảng trắng và giữ nguyên dấu
    return text.split(/\s+/).filter(word => word.length > 0);
}

function normalizeVietnamese(str) {
    return str.normalize('NFC').toLowerCase();
}


const chatbotPatterns = [
    {
        keywords: ['xin chào', 'chào', 'hi', 'hello', 'hey', 'alo', 'chào bạn', 'cho hỏi', 'cho mình hỏi', 'cho tôi hỏi'],
        response: "Xin chào! Rất vui được gặp bạn. Tôi có thể giúp gì cho bạn hôm nay?",
        endConversation: false
    },
    {
        keywords: ['địa chỉ', 'ở đâu', 'chỗ nào', 'đường nào', 'quận nào', 'khu nào', 'vị trí', 'địa điểm', 'tới', 'đến', 'tìm đường'],
        response: "Địa chỉ nhà hàng Hương Sen nằm ở số 82, đường Lê Bình, Quận Ninh Kiều, TP.Cần Thơ.",
        endConversation: false
    },
    {
        keywords: ['giờ hoạt động', 'giờ mở cửa', 'mở cửa', 'đóng cửa', 'mấy giờ', 'khi nào', 'thời gian', 'còn mở không', 'còn phục vụ không'],
        response: "Nhà hàng chúng tôi mở cửa từ 8h-22h từ thứ 2 đến thứ 6 & từ 10h-23h thứ 7 và chủ nhật, mở cả trong các ngày lễ, Tết.",
        endConversation: false
    },
    {
        keywords: ['liên hệ', 'số điện thoại', 'sđt', 'phone', 'email', 'gọi', 'hotline', 'zalo', 'facebook'],
        response: "Bạn có thể liên hệ với chúng tôi qua:\n- Số điện thoại: 078.546.8567\n- Email: contact.huongsen@gmail.com\n- Facebook: facebook.com/huongsen\n- Zalo: 078.546.8567",
        endConversation: false
    },
    {
        keywords: ['menu', 'thực đơn', 'món ăn', 'đồ ăn', 'có món gì', 'món nào', 'các món', 'món đặc trưng', 'món đặc sản', 'specialties'],
        response: "Nhà hàng chúng tôi chuyên về ẩm thực Việt Nam, đặc biệt là các món đặc sản miền Tây. Một số món tiêu biểu:\n- Cá lóc nướng trui\n- Lẩu mắm\n- Cơm cháy kho quẹt\n- Canh chua cá bông lau\n\nBạn có thể xem menu đầy đủ tại website: http://localhost:3001/menu",
        endConversation: false
    },
    {
        keywords: ['giá', 'bảng giá', 'chi phí', 'giá cả', 'giá tiền', 'bao nhiêu tiền', 'cost', 'price'],
        response: "Giá các món ăn của chúng tôi:\n- Món khai vị: 45.000đ - 120.000đ\n- Món chính: 89.000đ - 350.000đ\n- Lẩu: 250.000đ - 450.000đ\n- Set menu nhóm (4-6 người): 500.000đ - 1.200.000đ",
        endConversation: false
    },
    {
        keywords: ['đặt bàn', 'book bàn', 'reservation', 'đặt chỗ', 'giữ chỗ', 'đặt trước', 'book', 'còn bàn'],
        response: "Để đặt bàn, bạn vui lòng cung cấp các thông tin:\n- Ngày giờ dự kiến\n- Số lượng khách\n- Số điện thoại liên hệ\n\nHoặc gọi trực tiếp số 078.546.8567 để được hỗ trợ nhanh nhất.",
        endConversation: false
    },
    {
        keywords: ['parking', 'đậu xe', 'gửi xe', 'bãi xe', 'để xe', 'chỗ để xe'],
        response: "Nhà hàng có bãi đậu xe rộng rãi, miễn phí cho cả xe máy và ô tô ngay tại tầng hầm của tòa nhà.",
        endConversation: false
    },
    {
        keywords: ['thanh toán', 'payment', 'trả tiền', 'card', 'thẻ', 'tiền mặt', 'chuyển khoản'],
        response: "Nhà hàng chấp nhận các hình thức thanh toán:\n- Tiền mặt\n- Thẻ ngân hàng (Visa, Master, JCB)\n- Ví điện tử (Momo, ZaloPay, VNPay)\n- Chuyển khoản ngân hàng",
        endConversation: false
    },
    {
        keywords: ['tiệc', 'tổ chức tiệc', 'đặt tiệc', 'sinh nhật', 'liên hoan', 'party', 'sự kiện', 'event'],
        response: "Nhà hàng nhận đặt tiệc:\n- Sức chứa: 10-200 khách\n- Loại tiệc: Sinh nhật, Liên hoan, Công ty, Gia đình\n- Có menu và không gian riêng cho tiệc\n- Ưu đãi đặc biệt cho nhóm trên 50 khách\n\nVui lòng liên hệ trước 2-3 ngày để được tư vấn và sắp xếp.",
        endConversation: false
    },
    {
        keywords: ['wifi', 'internet', 'mạng', 'wifi password', 'pass wifi'],
        response: "Nhà hàng có wifi miễn phí cho khách hàng. Bạn có thể hỏi nhân viên để được cung cấp mật khẩu wifi.",
        endConversation: false
    },
    {
        keywords: ['khuyến mãi', 'ưu đãi', 'giảm giá', 'voucher', 'promotion', 'discount'],
        response: "Các chương trình khuyến mãi hiện tại:\n- Giảm 10% tổng hóa đơn cho khách hàng mới\n- Giảm 15% cho nhóm trên 10 người\n- Tặng món tráng miệng cho khách đặt tiệc\n\nTheo dõi Facebook của nhà hàng để cập nhật khuyến mãi mới nhất.",
        endConversation: false
    },
    {
        keywords: ['gặp nhân viên', 'tư vấn', 'hỗ trợ', 'gặp nhân viên tư vấn', 'gặp tư vấn viên'],
        response: "Để gặp nhân viên tư vấn, vui lòng để lại số điện thoại. Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.",
        endConversation: true
    },
    {
        keywords: ['tạm biệt', 'cảm ơn', 'bye', 'goodbye', 'gặp lại', 'hẹn gặp lại'],
        response: "Cảm ơn bạn đã liên hệ. Chúc bạn một ngày tốt lành!",
        endConversation: true
    }
];

function processChatbotMessage(message) {
    const normalizedMessage = normalizeVietnamese(message);
    const tokens = vietnameseTokenizer(normalizedMessage);

    let bestMatch = {
        pattern: null,
        score: 0
    };

    for (const pattern of chatbotPatterns) {
        const score = pattern.keywords.reduce((acc, keyword) => {
            const normalizedKeyword = normalizeVietnamese(keyword);
            const keywordTokens = vietnameseTokenizer(normalizedKeyword);
            // Kiểm tra xem tất cả các token của từ khóa có trong message không
            const isMatch = keywordTokens.every(token => tokens.includes(token));
            return acc + (isMatch ? 1 : 0);
        }, 0);

        if (score > bestMatch.score) {
            bestMatch = { pattern, score };
        }
    }

    if (bestMatch.score > 0) {
        return {
            response: bestMatch.pattern.response,
            endConversation: bestMatch.pattern.endConversation || false
        };
    }

    return {
        response: `Xin lỗi, tôi chỉ là chatbot hỗ trợ những vấn đề cơ bản như hỏi thông tin địa chỉ cửa hàng,...Nếu bạn cần được tư vấn kĩ hơn vui lòng nhập đúng từ khóa "gặp nhân viên" để được hỗ trợ`,
        endConversation: false
    };
}

router.post('/', (req, res) => {
    try {
        const { message } = req.body;
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Invalid message format' });
        }
        const response = processChatbotMessage(message);
        res.json({ response });
    } catch (error) {
        console.error('Error processing chatbot message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;