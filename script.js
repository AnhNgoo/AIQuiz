// ==================== GLOBAL STATE ====================
let quizState = {
    apiKeys: {
        groq: '',
        gemini: '',
        huggingface: ''
    },
    settings: {
        shuffleQuestions: false,
        aiGenerateQuestions: false
    },
    originalQuestions: [], // Array of {question, answer}
    processedQuestions: [], // Array of {question, answer, originalQuestion}
    currentQuestionIndex: 0,
    userAnswers: [], // Array of {question, userAnswer, correctAnswer, isCorrect, feedback, probingCount}
    isWaitingForResponse: false,
    currentProbingCount: 0,
    maxProbingAttempts: 2, // Số lần tối đa AI có thể hỏi vặn thêm
    editingIndex: null // Index của câu hỏi đang được sửa (null = chế độ thêm mới)
};

// ==================== DOM ELEMENTS ====================
const elements = {
    // API Keys (in modal now)
    groqApiKeyInput: document.getElementById('groqApiKey'),
    geminiApiKeyInput: document.getElementById('geminiApiKey'),
    hfApiKeyInput: document.getElementById('hfApiKey'),
    
    // Settings (in modal now)
    shuffleQuestionsToggle: document.getElementById('shuffleQuestions'),
    aiGenerateQuestionsToggle: document.getElementById('aiGenerateQuestions'),
    
    // Modal
    settingsModal: document.getElementById('settingsModal'),
    openSettingsBtn: document.getElementById('openSettingsBtn'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    
    // Manual Input
    questionInput: document.getElementById('questionInput'),
    answerInput: document.getElementById('answerInput'),
    addQuestionBtn: document.getElementById('addQuestionBtn'),
    questionCount: document.getElementById('questionCount'),
    clearListBtn: document.getElementById('clearListBtn'),
    startQuizBtn: document.getElementById('startQuizBtn'),
    questionListContainer: document.getElementById('questionListContainer'),
    
    // Screens
    welcomeScreen: document.getElementById('welcomeScreen'),
    chatScreen: document.getElementById('chatScreen'),
    resultsScreen: document.getElementById('resultsScreen'),
    
    // Chat
    chatMessages: document.getElementById('chatMessages'),
    chatProgress: document.getElementById('chatProgress'),
    userInput: document.getElementById('userInput'),
    sendBtn: document.getElementById('sendBtn'),
    exitQuizBtn: document.getElementById('exitQuizBtn'),
    
    // Results
    resultsContent: document.getElementById('resultsContent'),
    restartBtn: document.getElementById('restartBtn'),
    
    // Loading
    loadingOverlay: document.getElementById('loadingOverlay')
};

// ==================== INITIALIZATION ====================
function init() {
    // Load saved API keys from localStorage
    loadApiKeys();
    
    // Load saved settings from localStorage
    loadSettings();
    
    // Load saved questions from localStorage
    loadQuestionsFromLocalStorage();
    
    // Event Listeners - Modal
    elements.openSettingsBtn.addEventListener('click', openModal);
    elements.closeSettingsBtn.addEventListener('click', closeModal);
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Close modal when clicking outside
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            closeModal();
        }
    });
    
    // Event Listeners - API Keys (save on input)
    elements.groqApiKeyInput.addEventListener('input', saveApiKey);
    elements.geminiApiKeyInput.addEventListener('input', saveApiKey);
    elements.hfApiKeyInput.addEventListener('input', saveApiKey);
    
    // Event Listeners - Settings
    elements.shuffleQuestionsToggle.addEventListener('change', updateSettings);
    elements.aiGenerateQuestionsToggle.addEventListener('change', updateSettings);
    
    // Event Listeners - Manual Input
    elements.addQuestionBtn.addEventListener('click', addQuestionToList);
    elements.clearListBtn.addEventListener('click', clearQuestionList);
    elements.startQuizBtn.addEventListener('click', startQuiz);
    
    // Auto-resize textareas for input
    elements.questionInput.addEventListener('input', () => autoResizeManualTextarea(elements.questionInput));
    elements.answerInput.addEventListener('input', () => autoResizeManualTextarea(elements.answerInput));
    
    // Event Listeners - Chat
    elements.sendBtn.addEventListener('click', sendUserAnswer);
    elements.exitQuizBtn.addEventListener('click', exitQuiz);
    elements.userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendUserAnswer();
        }
    });
    
    // Auto-resize textarea
    elements.userInput.addEventListener('input', autoResizeTextarea);
    
    // Event Listeners - Results
    elements.restartBtn.addEventListener('click', restartQuiz);
}

// ==================== API KEY MANAGEMENT ====================
function loadApiKeys() {
    const savedKeys = localStorage.getItem('aiQuizApiKeys');
    if (savedKeys) {
        const keys = JSON.parse(savedKeys);
        elements.groqApiKeyInput.value = keys.groq || '';
        elements.geminiApiKeyInput.value = keys.gemini || '';
        elements.hfApiKeyInput.value = keys.huggingface || '';
        
        quizState.apiKeys = keys;
    }
}

function saveApiKey() {
    quizState.apiKeys.groq = elements.groqApiKeyInput.value.trim();
    quizState.apiKeys.gemini = elements.geminiApiKeyInput.value.trim();
    quizState.apiKeys.huggingface = elements.hfApiKeyInput.value.trim();
    
    localStorage.setItem('aiQuizApiKeys', JSON.stringify(quizState.apiKeys));
}

// ==================== QUESTION STORAGE MANAGEMENT ====================
/**
 * Lưu danh sách câu hỏi vào localStorage
 */
function saveQuestionsToLocalStorage() {
    localStorage.setItem('aiQuizQuestions', JSON.stringify(quizState.originalQuestions));
    console.log('💾 Đã lưu danh sách câu hỏi vào localStorage');
}

/**
 * Load danh sách câu hỏi từ localStorage
 */
function loadQuestionsFromLocalStorage() {
    const savedQuestions = localStorage.getItem('aiQuizQuestions');
    if (savedQuestions) {
        try {
            quizState.originalQuestions = JSON.parse(savedQuestions);
            updateQuestionCount();
            renderQuestionList();
            console.log(`📚 Đã tải ${quizState.originalQuestions.length} câu hỏi từ localStorage`);
        } catch (error) {
            console.error('❌ Lỗi khi load câu hỏi:', error);
            quizState.originalQuestions = [];
        }
    }
}

/**
 * Render danh sách câu hỏi lên UI
 */
function renderQuestionList() {
    const container = elements.questionListContainer;
    
    if (quizState.originalQuestions.length === 0) {
        container.innerHTML = '<p class="empty-state">Chưa có câu hỏi nào. Hãy thêm câu hỏi đầu tiên!</p>';
        return;
    }
    
    container.innerHTML = quizState.originalQuestions.map((item, index) => `
        <div class="question-item">
            <div class="item-number">${index + 1}</div>
            <div class="item-content">
                <div class="item-question">${escapeHtml(item.question)}</div>
                <div class="item-answer">Đáp án: ${escapeHtml(item.answer)}</div>
            </div>
            <div class="item-actions">
                <button class="btn-edit" onclick="editQuestion(${index})" title="Sửa câu hỏi">✏️</button>
                <button class="btn-delete" onclick="deleteQuestion(${index})" title="Xóa câu hỏi">❌</button>
            </div>
        </div>
    `).join('');
}

/**
 * Xóa một câu hỏi khỏi danh sách
 */
function deleteQuestion(index) {
    const question = quizState.originalQuestions[index];
    const confirmed = confirm(`Bạn có chắc muốn xóa câu hỏi:\n\n"${question.question}"`);
    
    if (confirmed) {
        quizState.originalQuestions.splice(index, 1);
        saveQuestionsToLocalStorage();
        updateQuestionCount();
        renderQuestionList();
        console.log(`🗑️ Đã xóa câu hỏi số ${index + 1}`);
    }
}

/**
 * Chỉnh sửa một câu hỏi - đưa nội dung lên form
 */
function editQuestion(index) {
    const question = quizState.originalQuestions[index];
    
    // Đổ dữ liệu lên form
    elements.questionInput.value = question.question;
    elements.answerInput.value = question.answer;
    
    // Lưu index đang sửa
    quizState.editingIndex = index;
    
    // Đổi nút thành "Lưu thay đổi"
    elements.addQuestionBtn.innerHTML = `
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
        </svg>
        💾 Lưu thay đổi
    `;
    elements.addQuestionBtn.classList.add('edit-mode');
    
    // Auto-resize textareas
    autoResizeManualTextarea(elements.questionInput);
    autoResizeManualTextarea(elements.answerInput);
    
    // Focus vào textarea đầu tiên
    elements.questionInput.focus();
    elements.questionInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    console.log(`✏️ Đang chỉnh sửa câu hỏi số ${index + 1}`);
}

/**
 * Hủy chế độ edit, đưa form về trạng thái thêm mới
 */
function cancelEditMode() {
    quizState.editingIndex = null;
    elements.addQuestionBtn.innerHTML = `
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
        </svg>
        Thêm vào danh sách
    `;
    elements.addQuestionBtn.classList.remove('edit-mode');
}

/**
 * Escape HTML để tránh XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== SETTINGS MANAGEMENT ====================
/**
 * Load settings từ localStorage
 */
function loadSettings() {
    const savedSettings = localStorage.getItem('aiQuizSettings');
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            quizState.settings = settings;
            
            // Cập nhật UI
            elements.shuffleQuestionsToggle.checked = settings.shuffleQuestions || false;
            elements.aiGenerateQuestionsToggle.checked = settings.aiGenerateQuestions !== false; // Default true
            
            console.log('📥 Đã load settings:', settings);
        } catch (error) {
            console.error('❌ Lỗi khi load settings:', error);
        }
    } else {
        // Default: AI Generate Questions = true
        quizState.settings.aiGenerateQuestions = true;
        elements.aiGenerateQuestionsToggle.checked = true;
    }
}

/**
 * Update settings và lưu vào localStorage
 */
function updateSettings() {
    quizState.settings.shuffleQuestions = elements.shuffleQuestionsToggle.checked;
    quizState.settings.aiGenerateQuestions = elements.aiGenerateQuestionsToggle.checked;
    
    // Lưu vào localStorage
    localStorage.setItem('aiQuizSettings', JSON.stringify(quizState.settings));
    console.log('💾 Đã lưu settings:', quizState.settings);
}

// ==================== MODAL MANAGEMENT ====================
function openModal() {
    elements.settingsModal.classList.add('active');
}

function closeModal() {
    elements.settingsModal.classList.remove('active');
}

function saveSettings() {
    // Save API keys
    saveApiKey();
    // Update settings
    updateSettings();
    // Close modal
    closeModal();
    // Show confirmation (optional)
    console.log('Settings saved successfully');
}

// ==================== API TESTING ====================
/**
 * Test Groq API connection
 */
async function testGroqAPI() {
    const statusEl = document.getElementById('groqStatus');
    if (!statusEl) return;
    
    // Update API key from input first
    saveApiKey();
    
    if (!quizState.apiKeys.groq) {
        statusEl.textContent = '⚠️ Vui lòng nhập API Key';
        statusEl.className = 'api-status error';
        return;
    }
    
    statusEl.textContent = '⏳ Đang kiểm tra...';
    statusEl.className = 'api-status testing';
    
    try {
        // Prompt test thực tế với tiếng Việt
        const testPrompt = 'Xin chào, tôi là hệ thống đang test kết nối. Bạn có hoạt động không?';
        const systemPrompt = 'Trả lời ngắn gọn trong 1 câu bằng tiếng Việt để xác nhận bạn đang hoạt động.';
        
        const response = await callGroqAPI(testPrompt, systemPrompt);
        
        // Validation: Kiểm tra response có nội dung thực tế không
        if (response && response.trim().length > 5) {
            // Cắt ngắn response nếu quá dài (tối đa 80 ký tự)
            const displayResponse = response.trim().length > 80 
                ? response.trim().substring(0, 80) + '...' 
                : response.trim();
            
            statusEl.textContent = `✅ Thành công! AI phản hồi: "${displayResponse}"`;
            statusEl.className = 'api-status success';
        } else {
            statusEl.textContent = '⚠️ API phản hồi không hợp lệ';
            statusEl.className = 'api-status error';
        }
    } catch (error) {
        statusEl.textContent = '❌ ' + error.message;
        statusEl.className = 'api-status error';
    }
}

/**
 * Test Gemini API connection
 */
async function testGeminiAPI() {
    const statusEl = document.getElementById('geminiStatus');
    if (!statusEl) return;
    
    // Update API key from input first
    saveApiKey();
    
    if (!quizState.apiKeys.gemini) {
        statusEl.textContent = '⚠️ Vui lòng nhập API Key';
        statusEl.className = 'api-status error';
        return;
    }
    
    statusEl.textContent = '⏳ Đang kiểm tra...';
    statusEl.className = 'api-status testing';
    
    try {
        // Prompt test thực tế với tiếng Việt
        const testPrompt = 'Xin chào, tôi là hệ thống đang test kết nối. Bạn có hoạt động không?';
        const systemPrompt = 'Trả lời ngắn gọn trong 1 câu bằng tiếng Việt để xác nhận bạn đang hoạt động.';
        
        const response = await callGeminiAPI(testPrompt, systemPrompt);
        
        // Validation: Kiểm tra response có nội dung thực tế không
        if (response && response.trim().length > 5) {
            // Cắt ngắn response nếu quá dài (tối đa 80 ký tự)
            const displayResponse = response.trim().length > 80 
                ? response.trim().substring(0, 80) + '...' 
                : response.trim();
            
            statusEl.textContent = `✅ Thành công (gemini-2.5-flash)! AI: "${displayResponse}"`;
            statusEl.className = 'api-status success';
        } else {
            statusEl.textContent = '⚠️ API phản hồi không hợp lệ';
            statusEl.className = 'api-status error';
        }
    } catch (error) {
        statusEl.textContent = '❌ ' + error.message;
        statusEl.className = 'api-status error';
    }
}

/**
 * Test HuggingFace API connection
 */
async function testHuggingFaceAPI() {
    const statusEl = document.getElementById('hfStatus');
    if (!statusEl) return;
    
    // Update API key from input first
    saveApiKey();
    
    if (!quizState.apiKeys.huggingface) {
        statusEl.textContent = '⚠️ Vui lòng nhập API Key';
        statusEl.className = 'api-status error';
        return;
    }
    
    statusEl.textContent = '⏳ Đang kiểm tra...';
    statusEl.className = 'api-status testing';
    
    try {
        // Prompt test thực tế với tiếng Việt
        const testPrompt = 'Xin chào, tôi là hệ thống đang test kết nối. Bạn có hoạt động không?';
        const systemPrompt = 'Trả lời ngắn gọn trong 1 câu bằng tiếng Việt để xác nhận bạn đang hoạt động.';
        
        const response = await callHuggingFaceAPI(testPrompt, systemPrompt);
        
        // Validation: Kiểm tra response có nội dung thực tế không
        if (response && response.trim().length > 5) {
            // Cắt ngắn response nếu quá dài (tối đa 80 ký tự)
            const displayResponse = response.trim().length > 80 
                ? response.trim().substring(0, 80) + '...' 
                : response.trim();
            
            statusEl.textContent = `✅ Thành công (DeepSeek-V3.2)! AI: "${displayResponse}"`;
            statusEl.className = 'api-status success';
        } else {
            statusEl.textContent = '⚠️ API phản hồi không hợp lệ';
            statusEl.className = 'api-status error';
        }
    } catch (error) {
        statusEl.textContent = '❌ ' + error.message;
        statusEl.className = 'api-status error';
    }
}

/**
 * Test all APIs at once
 */
async function testAllAPIs() {
    if (quizState.apiKeys.groq) {
        await testGroqAPI();
    }
    if (quizState.apiKeys.gemini) {
        await testGeminiAPI();
    }
    if (quizState.apiKeys.huggingface) {
        await testHuggingFaceAPI();
    }
}

// ==================== MANUAL INPUT LOGIC ====================
/**
 * Thêm câu hỏi thủ công vào danh sách
 */
function addQuestionToList() {
    const question = elements.questionInput.value.trim();
    const answer = elements.answerInput.value.trim();
    
    // Validation
    if (!question || !answer) {
        showError('Vui lòng nhập đầy đủ cả Câu hỏi và Đáp án!');
        return;
    }
    
    if (question.length < 5) {
        showError('Câu hỏi quá ngắn! Vui lòng nhập ít nhất 5 ký tự.');
        return;
    }
    
    if (answer.length < 3) {
        showError('Đáp án quá ngắn! Vui lòng nhập ít nhất 3 ký tự.');
        return;
    }
    
    // Kiểm tra chế độ: Edit hay Add
    if (quizState.editingIndex !== null) {
        // Chế độ EDIT - Cập nhật câu hỏi hiện có
        quizState.originalQuestions[quizState.editingIndex] = {
            question: question,
            answer: answer
        };
        console.log(`✏️ Đã cập nhật câu hỏi số ${quizState.editingIndex + 1}`);
        
        // Hủy chế độ edit
        cancelEditMode();
    } else {
        // Chế độ ADD - Thêm câu hỏi mới
        quizState.originalQuestions.push({
            question: question,
            answer: answer
        });
        console.log(`✅ Đã thêm câu hỏi thứ ${quizState.originalQuestions.length}`);
    }
    
    // Lưu vào localStorage
    saveQuestionsToLocalStorage();
    
    // Cập nhật UI
    updateQuestionCount();
    renderQuestionList();
    
    // Reset input fields
    elements.questionInput.value = '';
    elements.answerInput.value = '';
    elements.questionInput.focus();
    
    // Reset textarea heights
    elements.questionInput.style.height = 'auto';
    elements.answerInput.style.height = 'auto';
}

/**
 * Xóa toàn bộ danh sách câu hỏi
 */
function clearQuestionList() {
    if (quizState.originalQuestions.length === 0) return;
    
    const confirmed = confirm(`Bạn có chắc muốn xóa tất cả ${quizState.originalQuestions.length} câu hỏi?`);
    
    if (confirmed) {
        quizState.originalQuestions = [];
        
        // Hủy chế độ edit nếu đang edit
        if (quizState.editingIndex !== null) {
            cancelEditMode();
        }
        
        // Lưu vào localStorage
        saveQuestionsToLocalStorage();
        
        // Cập nhật UI
        updateQuestionCount();
        renderQuestionList();
        
        console.log('🗑️ Đã xóa toàn bộ danh sách câu hỏi');
    }
}

/**
 * Cập nhật số lượng câu hỏi hiển thị trên UI
 */
function updateQuestionCount() {
    const count = quizState.originalQuestions.length;
    elements.questionCount.textContent = `Số câu hỏi hiện tại: ${count} câu`;
    
    // Enable/disable buttons
    elements.startQuizBtn.disabled = count === 0;
    elements.clearListBtn.disabled = count === 0;
}

/**
 * Auto-resize textarea cho manual input
 */
function autoResizeManualTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

// ==================== API CALLS ====================

/**
 * Gọi AI với fallback: Gemini -> Groq -> HuggingFace
 * Thử lần lượt các API cho đến khi có kết quả
 */
async function callAIWithFallback(prompt, systemPrompt = '', preferredAPI = 'gemini') {
    const apis = [];
    
    // Sắp xếp thứ tự ưu tiên
    if (preferredAPI === 'gemini' && quizState.apiKeys.gemini) {
        apis.push({ name: 'Gemini', fn: () => callGeminiAPI(prompt, systemPrompt) });
    }
    if (quizState.apiKeys.groq) {
        apis.push({ name: 'Groq', fn: () => callGroqAPI(prompt, systemPrompt) });
    }
    if (quizState.apiKeys.gemini && preferredAPI !== 'gemini') {
        apis.push({ name: 'Gemini', fn: () => callGeminiAPI(prompt, systemPrompt) });
    }
    if (quizState.apiKeys.huggingface) {
        apis.push({ name: 'HuggingFace', fn: () => callHuggingFaceAPI(prompt, systemPrompt) });
    }
    
    // Nếu không có API nào
    if (apis.length === 0) {
        throw new Error('Không có API Key nào được cấu hình. Vui lòng thêm ít nhất 1 API Key trong Settings!');
    }
    
    let lastError = null;
    
    // Thử từng API theo thứ tự
    for (const api of apis) {
        try {
            console.log(`🔄 Đang thử ${api.name}...`);
            const result = await api.fn();
            console.log(`✅ ${api.name} thành công!`);
            return result;
        } catch (error) {
            console.warn(`⚠️ ${api.name} thất bại:`, error.message);
            lastError = error;
            // Tiếp tục thử API tiếp theo
        }
    }
    
    // Nếu tất cả đều thất bại
    throw new Error(`Tất cả API đều thất bại. Lỗi cuối: ${lastError?.message || 'Unknown'}`);
}

/**
 * Gọi Groq API - Sử dụng cho việc parse document ban đầu (nhanh)
 */
async function callGroqAPI(prompt, systemPrompt = '') {
    if (!quizState.apiKeys.groq) {
        throw new Error('Chưa nhập Groq API Key');
    }
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${quizState.apiKeys.groq}`
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 4000
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Groq API Error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * Gọi Gemini API - Sử dụng cho việc đánh giá và chat (suy luận tốt)
 */
async function callGeminiAPI(prompt, systemPrompt = '') {
    if (!quizState.apiKeys.gemini) {
        throw new Error('Chưa nhập Gemini API Key');
    }
    
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${quizState.apiKeys.gemini}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: fullPrompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2000
            }
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

/**
 * Gọi HuggingFace API - Fallback hoặc tác vụ cụ thể
 */
async function callHuggingFaceAPI(prompt, systemPrompt = '') {
    if (!quizState.apiKeys.huggingface) {
        throw new Error('Chưa nhập HuggingFace API Key');
    }
    
    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${quizState.apiKeys.huggingface}`
        },
        body: JSON.stringify({
            model: 'deepseek-ai/DeepSeek-V3.2:novita',
            messages: [
                ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2000
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HuggingFace API Error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// ==================== QUIZ LOGIC ====================

/**
 * Bắt đầu quiz: Parse document -> Extract Q&A -> Process questions
 */
/**
 * Bắt đầu quiz: Xử lý câu hỏi -> Chuyển sang chat -> Hỏi câu đầu tiên
 */
async function startQuiz() {
    // Kiểm tra có câu hỏi chưa
    if (quizState.originalQuestions.length === 0) {
        showError('Vui lòng thêm ít nhất 1 câu hỏi vào danh sách!');
        return;
    }
    
    // Kiểm tra API key nếu bật tính năng "AI tạo câu hỏi"
    if (quizState.settings.aiGenerateQuestions) {
        if (!quizState.apiKeys.groq && !quizState.apiKeys.gemini && !quizState.apiKeys.huggingface) {
            showError('Tính năng "AI tạo câu hỏi" yêu cầu ít nhất 1 API Key. Vui lòng tắt tính năng hoặc nhập API Key trong Settings!');
            return;
        }
    }
    
    showLoading('Đang chuẩn bị câu hỏi...');
    
    try {
        // Xử lý câu hỏi (shuffle, rephrase)
        await processQuestions();
        
        // Chuyển sang màn hình chat
        hideLoading();
        showChatScreen();
        
        // Bắt đầu hỏi câu đầu tiên
        askNextQuestion();
        
    } catch (error) {
        hideLoading();
        console.error('Error starting quiz:', error);
        showError('Lỗi khi khởi tạo quiz: ' + error.message);
    }
}

/**
 * Xử lý câu hỏi: Shuffle và/hoặc Rephrase với AI
 */
async function processQuestions() {
    let questions = [...quizState.originalQuestions];
    
    // Shuffle nếu được chọn
    if (quizState.settings.shuffleQuestions) {
        questions = shuffleArray(questions);
    }
    
    // Rephrase nếu được chọn
    if (quizState.settings.aiGenerateQuestions) {
        showLoading('Đang tạo câu hỏi với AI...');
        const rephrased = [];
        
        for (const q of questions) {
            try {
                const newQuestion = await rephraseQuestion(q.question);
                rephrased.push({
                    question: newQuestion,
                    answer: q.answer,
                    originalQuestion: q.question
                });
            } catch (error) {
                console.warn('Error rephrasing question, using original:', error);
                rephrased.push({
                    question: q.question,
                    answer: q.answer,
                    originalQuestion: q.question
                });
            }
        }
        
        quizState.processedQuestions = rephrased;
    } else {
        quizState.processedQuestions = questions.map(q => ({
            question: q.question,
            answer: q.answer,
            originalQuestion: q.question
        }));
    }
}

/**
 * Rephrase câu hỏi để tự nhiên hơn sử dụng Gemini
 */
async function rephraseQuestion(question) {
    const prompt = `Hãy viết lại câu hỏi sau cho tự nhiên và thân thiện hơn, nhưng GIỮ NGUYÊN ý nghĩa và yêu cầu:

Câu hỏi gốc: ${question}

Chỉ trả về câu hỏi mới, không giải thích gì thêm.`;

    try {
        const response = await callAIWithFallback(prompt, '', 'gemini');
        return response.trim();
    } catch (error) {
        console.warn('❌ Không thể rephrase câu hỏi, dùng câu gốc:', error.message);
        return question;
    }
}

/**
 * Hỏi câu hỏi tiếp theo
 */
function askNextQuestion() {
    if (quizState.currentQuestionIndex >= quizState.processedQuestions.length) {
        // Hết câu hỏi -> Hiển thị kết quả
        showResults();
        return;
    }
    
    const currentQ = quizState.processedQuestions[quizState.currentQuestionIndex];
    const questionNumber = quizState.currentQuestionIndex + 1;
    const totalQuestions = quizState.processedQuestions.length;
    
    // Cập nhật progress trong header
    if (elements.chatProgress) {
        elements.chatProgress.textContent = `Câu ${questionNumber}/${totalQuestions}`;
    }
    
    addMessage(
        'ai',
        `📝 **Câu ${questionNumber}/${totalQuestions}**\n\n${currentQ.question}`
    );
    
    // Reset probing count cho câu mới
    quizState.currentProbingCount = 0;
    quizState.isWaitingForResponse = false;
}

/**
 * Gửi câu trả lời của user
 */
async function sendUserAnswer() {
    const userAnswer = elements.userInput.value.trim();
    
    if (!userAnswer || quizState.isWaitingForResponse) {
        return;
    }
    
    // Hiển thị câu trả lời của user
    addMessage('user', userAnswer);
    elements.userInput.value = '';
    autoResizeTextarea();
    
    // Disable input trong khi xử lý
    quizState.isWaitingForResponse = true;
    elements.userInput.disabled = true;
    elements.sendBtn.disabled = true;
    
    // Hiển thị typing indicator
    const typingId = addTypingIndicator();
    
    try {
        // Đánh giá câu trả lời
        await evaluateAnswer(userAnswer);
    } catch (error) {
        console.error('Error evaluating answer:', error);
        removeTypingIndicator(typingId);
        addMessage('ai', '❌ Xin lỗi, đã có lỗi xảy ra khi đánh giá câu trả lời. Vui lòng thử lại.');
        quizState.isWaitingForResponse = false;
        elements.userInput.disabled = false;
        elements.sendBtn.disabled = false;
    }
}

/**
 * Đánh giá câu trả lời của user với AI Fallback và hệ thống chấm điểm 0-100
 */
async function evaluateAnswer(userAnswer) {
    const currentQ = quizState.processedQuestions[quizState.currentQuestionIndex];
    
    const systemPrompt = `Bạn là một giáo viên chuyên nghiệp, công bằng và khắt khe. Đánh giá câu trả lời theo thang điểm 100.

Quy tắc chấm điểm:
- 90-100: Trả lời đúng, đầy đủ, chi tiết
- 70-89: Trả lời đúng nhưng thiếu chi tiết -> HỎI VẶN để học sinh bổ sung
- 50-69: Trả lời đúng một phần, còn nhiều thiếu sót
- 30-49: Trả lời sai nhưng có hiểu biết cơ bản
- 0-29: Trả lời sai hoàn toàn hoặc không biết

Quy tắc hỏi vặn:
- Nếu điểm 70-89 và chưa hỏi vặn quá 2 lần -> đặt câu hỏi đào sâu
- Nếu điểm >= 90 hoặc <= 69 -> KHÔNG hỏi vặn, chuyển câu tiếp

Format JSON trả về:
{
    "score": 0-100,
    "feedback": "Phản hồi ngắn gọn với emoji",
    "shouldProbe": true/false,
    "probingQuestion": "Câu hỏi đào sâu (nếu cần)"
}`;

    const prompt = `Câu hỏi: ${currentQ.question}

Đáp án chuẩn: ${currentQ.answer}

Câu trả lời của học sinh: ${userAnswer}

Số lần đã hỏi vặn: ${quizState.currentProbingCount}/${quizState.maxProbingAttempts}

Hãy đánh giá và trả về JSON theo format trên.`;

    try {
        const response = await callAIWithFallback(prompt, systemPrompt, 'gemini');
        
        // Parse JSON từ response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Không thể parse JSON từ response');
        }
        
        const evaluation = JSON.parse(jsonMatch[0]);
        
        const typingId = document.querySelector('.typing-indicator')?.id;
        if (typingId) {
            removeTypingIndicator(typingId);
        }
        
        const score = evaluation.score || 0;
        
        // Xử lý kết quả đánh giá theo điểm số
        if (score >= 90) {
            // Điểm cao (90-100) -> Đúng và đầy đủ
            addMessage('ai', `${evaluation.feedback}\n\n🎯 **Điểm: ${score}/100**`);
            
            // Lưu kết quả
            quizState.userAnswers.push({
                question: currentQ.question,
                userAnswer: userAnswer,
                correctAnswer: currentQ.answer,
                score: score,
                feedback: evaluation.feedback,
                probingCount: quizState.currentProbingCount
            });
            
            // Chuyển sang câu tiếp theo
            setTimeout(() => {
                quizState.currentQuestionIndex++;
                askNextQuestion();
                elements.userInput.disabled = false;
                elements.sendBtn.disabled = false;
                quizState.isWaitingForResponse = false;
            }, 1500);
            
        } else if (score >= 70 && evaluation.shouldProbe && quizState.currentProbingCount < quizState.maxProbingAttempts) {
            // Điểm 70-89 và chưa hỏi vặn đủ -> Hỏi vặn
            quizState.currentProbingCount++;
            
            const probingMessage = evaluation.probingQuestion || evaluation.feedback;
            addMessage('ai', `🤔 ${probingMessage}\n\n📊 Điểm hiện tại: ${score}/100`);
            
            // Cho phép trả lời tiếp
            quizState.isWaitingForResponse = false;
            elements.userInput.disabled = false;
            elements.sendBtn.disabled = false;
            
        } else {
            // Điểm < 70 hoặc đã hỏi vặn đủ -> Chuyển câu tiếp
            addMessage('ai', `${evaluation.feedback}\n\n📊 **Điểm: ${score}/100**`);
            
            // Hiển thị đáp án đúng nếu điểm thấp
            if (score < 70) {
                setTimeout(() => {
                    addMessage('ai', `📚 **Đáp án chuẩn:**\n\n${currentQ.answer}`);
                }, 500);
            }
            
            // Lưu kết quả
            quizState.userAnswers.push({
                question: currentQ.question,
                userAnswer: userAnswer,
                correctAnswer: currentQ.answer,
                score: score,
                feedback: evaluation.feedback,
                probingCount: quizState.currentProbingCount
            });
            
            // Chuyển sang câu tiếp theo
            setTimeout(() => {
                quizState.currentQuestionIndex++;
                askNextQuestion();
                elements.userInput.disabled = false;
                elements.sendBtn.disabled = false;
                quizState.isWaitingForResponse = false;
            }, 2000);
        }
        
    } catch (error) {
        console.error('❌ Lỗi đánh giá:', error);
        
        // Remove typing indicator
        const typingId = document.querySelector('.typing-indicator')?.id;
        if (typingId) {
            removeTypingIndicator(typingId);
        }
        
        // Fallback: Cho điểm 0 và chuyển câu tiếp
        addMessage('ai', `❌ Xin lỗi, hệ thống đang gặp sự cố: ${error.message}\n\nĐang tự động chuyển sang câu tiếp theo...`);
        
        setTimeout(() => {
            addMessage('ai', `📚 **Đáp án chuẩn:**\n\n${currentQ.answer}`);
        }, 500);
        
        quizState.userAnswers.push({
            question: currentQ.question,
            userAnswer: userAnswer,
            correctAnswer: currentQ.answer,
            score: 0,
            feedback: 'Lỗi hệ thống',
            probingCount: quizState.currentProbingCount
        });
        
        setTimeout(() => {
            quizState.currentQuestionIndex++;
            askNextQuestion();
            elements.userInput.disabled = false;
            elements.sendBtn.disabled = false;
            quizState.isWaitingForResponse = false;
        }, 2500);
    }
}

// ==================== RESULTS ====================

/**
 * Hiển thị kết quả cuối cùng
 */
async function showResults() {
    elements.userInput.disabled = true;
    elements.sendBtn.disabled = true;
    
    // Tính điểm trung bình từ tất cả câu hỏi
    const totalScore = quizState.userAnswers.reduce((sum, a) => sum + (a.score || 0), 0);
    const totalQuestions = quizState.userAnswers.length;
    const averageScore = Math.round(totalScore / totalQuestions);
    const passedQuestions = quizState.userAnswers.filter(a => a.score >= 70).length;
    
    // Hiển thị tin nhắn tổng kết
    addMessage('ai', `🎊 **Chúc mừng bạn đã hoàn thành bài quiz!**\n\n📊 Điểm trung bình: **${averageScore}/100**\n✅ Đạt yêu cầu: ${passedQuestions}/${totalQuestions} câu\n\nĐang tạo báo cáo chi tiết...`);
    
    setTimeout(() => {
        showResultsScreen();
        generateResultsReport(passedQuestions, totalQuestions, averageScore);
    }, 1500);
}

function generateResultsReport(passedQuestions, totalQuestions, averageScore) {
    let html = `
        <div class="score-summary">
            <div class="score-number">${averageScore}/100</div>
            <div class="score-label">Điểm trung bình | ${passedQuestions}/${totalQuestions} câu đạt yêu cầu (≥70 điểm)</div>
        </div>
        
        <div class="results-details">
            <h3 style="margin-bottom: 16px; color: var(--text-primary);">📊 Chi tiết từng câu:</h3>
    `;
    
    quizState.userAnswers.forEach((answer, index) => {
        const score = answer.score || 0;
        const statusClass = score >= 70 ? 'correct' : 'incorrect';
        const statusIcon = score >= 90 ? '🌟' : score >= 70 ? '✅' : score >= 50 ? '⚠️' : '❌';
        
        html += `
            <div class="result-item ${statusClass}">
                <div class="result-question">
                    ${statusIcon} <strong>Câu ${index + 1}:</strong> ${answer.question}
                    <span style="float: right; font-size: 1.1rem; font-weight: bold; color: ${score >= 70 ? 'var(--primary)' : 'var(--danger)'};">📊 ${score}/100</span>
                </div>
                <div class="result-answer">
                    <span class="result-label">Câu trả lời của bạn:</span>
                    ${answer.userAnswer}
                </div>
                <div class="result-answer">
                    <span class="result-label">Đáp án chuẩn:</span>
                    ${answer.correctAnswer}
                </div>
                ${answer.probingCount > 0 ? `
                    <div style="margin-top: 8px; font-size: 0.85rem; color: var(--text-secondary);">
                        💭 Đã hỏi vặn: ${answer.probingCount} lần
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    
    // Thêm lời khuyên
    let advice = '';
    if (averageScore >= 90) {
        advice = '🌟 Xuất sắc! Bạn đã nắm vững kiến thức!';
    } else if (averageScore >= 70) {
        advice = '👍 Tốt lắm! Còn một số điểm cần cải thiện.';
    } else if (averageScore >= 50) {
        advice = '📖 Khá! Hãy ôn lại các câu sai để nắm vững hơn.';
    } else {
        advice = '💪 Cần cố gắng thêm! Hãy đọc lại tài liệu và thử lại nhé.';
    }
    
    html += `
        <div style="text-align: center; padding: 20px; font-size: 1.2rem; color: var(--primary-color); font-weight: 600;">
            ${advice}
        </div>
    `;
    
    elements.resultsContent.innerHTML = html;
}

// ==================== UI HELPERS ====================

function showChatScreen() {
    elements.welcomeScreen.style.opacity = '0';
    setTimeout(() => {
        elements.welcomeScreen.style.display = 'none';
        elements.chatScreen.classList.add('active');
    }, 300);
}

function showResultsScreen() {
    elements.welcomeScreen.style.display = 'none';
    elements.chatScreen.classList.remove('active');
    elements.resultsScreen.style.display = 'flex';
}

function showWelcomeScreen() {
    elements.welcomeScreen.style.display = 'flex';
    elements.welcomeScreen.style.opacity = '1';
    elements.chatScreen.classList.remove('active');
    elements.resultsScreen.style.display = 'none';
}

function addMessage(sender, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = sender === 'ai' ? '🤖' : '👤';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Convert markdown-style bold to HTML
    const formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    contentDiv.innerHTML = formattedContent.replace(/\n/g, '<br>');
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    
    elements.chatMessages.appendChild(messageDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function addTypingIndicator() {
    const id = 'typing-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai typing-message';
    messageDiv.id = id;
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = '🤖';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content thinking';
    contentDiv.innerHTML = `
        <div class="typing-indicator">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        </div>
    `;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    
    elements.chatMessages.appendChild(messageDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    
    return id;
}

function removeTypingIndicator(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

function showLoading(text = 'Đang xử lý...') {
    elements.loadingOverlay.style.display = 'flex';
    elements.loadingOverlay.querySelector('.loading-text').textContent = text;
}

function hideLoading() {
    elements.loadingOverlay.style.display = 'none';
}

function showError(message) {
    alert('❌ ' + message);
}

function autoResizeTextarea() {
    elements.userInput.style.height = 'auto';
    const newHeight = elements.userInput.scrollHeight < 120 ? elements.userInput.scrollHeight : 120;
    elements.userInput.style.height = newHeight + 'px';
}

function restartQuiz() {
    // Reset state
    quizState.originalQuestions = [];
    quizState.processedQuestions = [];
    quizState.currentQuestionIndex = 0;
    quizState.userAnswers = [];
    quizState.isWaitingForResponse = false;
    quizState.currentProbingCount = 0;
    
    // Reset manual input fields
    elements.questionInput.value = '';
    elements.answerInput.value = '';
    elements.questionInput.style.height = 'auto';
    elements.answerInput.style.height = 'auto';
    updateQuestionCount();
    elements.startQuizBtn.disabled = true;
    
    // Reset chat UI
    elements.chatMessages.innerHTML = '';
    elements.userInput.value = '';
    elements.userInput.style.height = 'auto';
    elements.userInput.disabled = false;
    elements.sendBtn.disabled = false;
    
    // Show welcome screen
    showWelcomeScreen();
}

/**
 * Thoát quiz - Quay về màn hình welcome nhưng giữ nguyên danh sách câu hỏi
 */
function exitQuiz() {
    const confirmed = confirm('Bạn có chắc muốn thoát quiz? Tiến trình hiện tại sẽ không được lưu.');
    
    if (!confirmed) return;
    
    // Reset quiz state (nhưng giữ originalQuestions)
    quizState.processedQuestions = [];
    quizState.currentQuestionIndex = 0;
    quizState.userAnswers = [];
    quizState.isWaitingForResponse = false;
    quizState.currentProbingCount = 0;
    
    // Reset chat UI
    elements.chatMessages.innerHTML = '';
    elements.userInput.value = '';
    elements.userInput.style.height = 'auto';
    elements.userInput.disabled = false;
    elements.sendBtn.disabled = false;
    
    // Quay về màn hình welcome
    showWelcomeScreen();
    
    console.log('🚪 Đã thoát quiz');
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ==================== START APPLICATION ====================
document.addEventListener('DOMContentLoaded', init);

// Expose test functions to global scope for inline onclick handlers
window.testGroqAPI = testGroqAPI;
window.testGeminiAPI = testGeminiAPI;
window.testHuggingFaceAPI = testHuggingFaceAPI;
window.testAllAPIs = testAllAPIs;
