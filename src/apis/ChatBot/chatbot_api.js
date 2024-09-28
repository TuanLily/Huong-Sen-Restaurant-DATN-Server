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
        keywords: ['xin chào', 'chào', 'hi', 'hello'],
        response: "Xin chào! Rất vui được gặp bạn. Tôi có thể giúp gì cho bạn hôm nay?",
        endConversation: false

    },
    {
        keywords: ['địa chỉ', 'ở đâu', 'chỗ nào'],
        response: "Địa chỉ nhà hàng Hương Sen nằm ở số 82, đường Lê Bình, Quận Ninh Kiều, TP.Cần Thơ.",
        endConversation: false

    },
    {
        keywords: ['giờ hoạt động', 'nhà hàng mở khi nào', 'nhà hàng còn mở cửa không'],
        response: "Nhà hàng chúng tôi mở cửa từ 8h-22h từ thứ 2 đến thứ 6 & từ 10h-23h thứ 7 và chủ nhật, mở cả trong các ngày lễ, Tết.",
        endConversation: false

    },
    {
        keywords: ['liên hệ', 'số điện thoại', 'email', 'gọi'],
        response: "Bạn có thể liên hệ với chúng tôi qua số điện thoại 078.546.8567 hoặc email contact.huongsen@gmail.com.",
        endConversation: false

    },
    {
        keywords: ['gặp nhân viên', 'tư vấn', 'hỗ trợ', 'gặp nhân viên tư vấn', 'gặp tư vấn viên'],
        response: "Để gặp nhân viên tư vấn, vui lòng để lại số điện thoại. Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.",
        endConversation: true

    },
    {
        keywords: ['tạm biệt', 'cảm ơn', 'bye', 'gặp lại'],
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