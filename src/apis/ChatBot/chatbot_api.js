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
        response: "Địa chỉ của chúng tôi là: 123 Đường ABC, Quận XYZ, Thành phố HCM.",
        endConversation: false

    },
    {
        keywords: ['liên hệ', 'số điện thoại', 'email', 'gọi'],
        response: "Bạn có thể liên hệ với chúng tôi qua số điện thoại 0123456789 hoặc email info@example.com.",
        endConversation: false

    },
    {
        keywords: ['gặp nhân viên', 'tư vấn', 'hỗ trợ'],
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
        response: "Đây là trả lời tự động. Xin lỗi, tôi không hiểu rõ ý của bạn. Bạn có thể hỏi về địa chỉ, thông tin liên hệ hoặc yêu cầu gặp nhân viên tư vấn.",
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