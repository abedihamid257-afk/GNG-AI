var API_URL = 'https://api-free.ir/api/chat.php';
var messagesDiv = document.getElementById('messages');
var userInput = document.getElementById('userInput');
var sendBtn = document.getElementById('sendBtn');
var typingEl = document.getElementById('typing');
var emptyState = document.getElementById('emptyState');
var clearBtn = document.getElementById('clearBtn');

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

function addMessage(role, text, save) {
    if (save === undefined) save = true;
    emptyState.style.display = 'none';

    var msgDiv = document.createElement('div');
    msgDiv.className = 'msg ' + (role === 'user' ? 'user' : 'ai');
    
    var time = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    var copyBtn = role === 'ai' ? '<button class="msg-copy" onclick="copyText(this)">📋 کپی</button>' : '';
    
    msgDiv.innerHTML = '<div class="msg-avatar">' + (role === 'user' ? '👤' : '🤖') + '</div>' +
        '<div><div class="msg-content">' + formatText(text) + '</div>' +
        '<div style="display:flex;align-items:center;gap:5px;margin-top:3px">' +
        '<span class="msg-time">' + time + '</span>' + copyBtn + '</div></div>';
    
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    if (save) {
        history.push({ role: role, text: text, time: Date.now() });
        if (history.length > 100) history = history.slice(-100);
        saveHistory();
    }
}

function formatText(text) {
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/`(.*?)`/g, '<code>$1</code>');
    text = text.replace(/\n/g, '<br>');
    return text;
}

function copyText(btn) {
    var text = btn.parentElement.parentElement.querySelector('.msg-content').textContent;
    navigator.clipboard.writeText(text).then(function() {
        btn.textContent = '✅';
        setTimeout(function() { btn.textContent = '📋 کپی'; }, 1500);
    });
}

async function sendMessage() {
    var text = userInput.value.trim();
    if (!text) return;

    addMessage('user', text);
    userInput.value = '';
    sendBtn.disabled = true;
    typingEl.classList.add('show');

    try {
        // ===== روش‌های مختلف ارسال =====
        var response;
        
        // روش ۱: POST
        try {
            response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, prompt: text, text: text })
            });
        } catch(e) {}
        
        // روش ۲: GET
        if (!response || !response.ok) {
            try {
                response = await fetch(API_URL + '?message=' + encodeURIComponent(text));
            } catch(e) {}
        }
        
        typingEl.classList.remove('show');
        
        var reply = '⚠️ خطا در دریافت پاسخ. لطفاً دوباره تلاش کنید.';
        
        if (response && response.ok) {
            var data = await response.json();
            reply = data.response || data.reply || data.message || data.result || data.text || data.output || data.answer || JSON.stringify(data);
        }
        
        addMessage('ai', reply);
    } catch (error) {
        typingEl.classList.remove('show');
        addMessage('ai', '⚠️ خطا در ارتباط با سرور API. دوباره تلاش کنید.');
    }

    sendBtn.disabled = false;
    userInput.focus();
}

function clearHistory() {
    if (confirm('از پاک کردن تمام تاریخچه مطمئن هستید؟')) {
        history = [];
        saveHistory();
        messagesDiv.innerHTML = '<div class="empty-state"><div class="empty-icon">🤖</div><p>تاریخچه پاک شد</p></div>';
    }
}

// ===== Event Listeners =====
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') sendMessage(); });
clearBtn.addEventListener('click', clearHistory);

// ===== Init =====
loadHistory();
userInput.focus();
