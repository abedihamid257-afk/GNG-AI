// ===== GNG AI - Main Script =====
var API_URL = 'https://api-free.ir/api/chat.php';
var messagesDiv = document.getElementById('messages');
var userInput = document.getElementById('userInput');
var sendBtn = document.getElementById('sendBtn');
var typingEl = document.getElementById('typing');
var emptyState = document.getElementById('emptyState');
var clearBtn = document.getElementById('clearBtn');

// ===== تاریخچه =====
var history = JSON.parse(localStorage.getItem('gng_ai_history') || '[]');

function saveHistory() {
    localStorage.setItem('gng_ai_history', JSON.stringify(history));
}

function loadHistory() {
    if (history.length > 0) {
        emptyState.style.display = 'none';
        history.forEach(function(msg) {
            addMessage(msg.role, msg.text, false);
        });
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

// ===== اضافه کردن پیام =====
function addMessage(role, text, save) {
    if (save === undefined) save = true;
    emptyState.style.display = 'none';

    var msgDiv = document.createElement('div');
    msgDiv.className = 'msg ' + (role === 'user' ? 'user' : 'ai');
    
    var time = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    
    var copyBtn = '';
    if (role === 'ai') {
        copyBtn = '<button class="msg-copy" onclick="copyText(this)">📋 کپی</button>';
    }
    
    msgDiv.innerHTML = '<div class="msg-avatar">' + (role === 'user' ? '👤' : '🤖') + '</div>' +
        '<div>' +
            '<div class="msg-content">' + formatText(text) + '</div>' +
            '<div style="display:flex;align-items:center;gap:5px;margin-top:3px">' +
                '<span class="msg-time">' + time + '</span>' +
                copyBtn +
            '</div>' +
        '</div>';
    
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    if (save) {
        history.push({ role: role, text: text, time: Date.now() });
        if (history.length > 100) history = history.slice(-100);
        saveHistory();
    }
}

// ===== فرمت متن =====
function formatText(text) {
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/`(.*?)`/g, '<code style="background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px;font-size:0.85em">$1</code>');
    text = text.replace(/\n/g, '<br>');
    return text;
}

// ===== کپی متن =====
function copyText(btn) {
    var text = btn.parentElement.parentElement.querySelector('.msg-content').textContent;
    navigator.clipboard.writeText(text).then(function() {
        btn.textContent = '✅ کپی شد';
        setTimeout(function() { btn.textContent = '📋 کپی'; }, 1500);
    });
}

// ===== ارسال پیام =====
function sendMessage() {
    var text = userInput.value.trim();
    if (!text) return;

    addMessage('user', text);
    userInput.value = '';
    sendBtn.disabled = true;
    typingEl.classList.add('show');

    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        typingEl.classList.remove('show');
        var reply = 'متأسفم، خطایی رخ داد. دوباره تلاش کنید.';
        
        if (data && data.response) reply = data.response;
        else if (data && data.reply) reply = data.reply;
        else if (data && data.message) reply = data.message;
        else if (data && data.result) reply = data.result;
        else if (data && data.text) reply = data.text;
        else if (typeof data === 'string') reply = data;
        
        addMessage('ai', reply);
        sendBtn.disabled = false;
        userInput.focus();
    })
    .catch(function() {
        typingEl.classList.remove('show');
        addMessage('ai', '⚠️ خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
        sendBtn.disabled = false;
        userInput.focus();
    });
}

// ===== پاک کردن تاریخچه =====
function clearHistory() {
    if (confirm('از پاک کردن تمام تاریخچه مطمئن هستید؟')) {
        history = [];
        saveHistory();
        messagesDiv.innerHTML = '<div class="empty-state" id="emptyState"><div class="empty-icon">🤖</div><p>تاریخچه پاک شد</p></div>';
    }
}

// ===== Event Listeners =====
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') sendMessage(); });
clearBtn.addEventListener('click', clearHistory);

// ===== Init =====
loadHistory();
userInput.focus();
