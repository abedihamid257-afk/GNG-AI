var API_URL = '/api/chat';
var messagesDiv = document.getElementById('messages');
var userInput = document.getElementById('userInput');
var sendBtn = document.getElementById('sendBtn');
var typingEl = document.getElementById('typing');
var emptyState = document.getElementById('emptyState');
var clearBtn = document.getElementById('clearBtn');

// ===== MENU =====
var menuBtn = document.getElementById('menuBtn');
var menuPanel = document.getElementById('menuPanel');
var menuOverlay = document.getElementById('menuOverlay');
var menuClose = document.getElementById('menuClose');

menuBtn.addEventListener('click', function() {
    menuPanel.classList.add('show');
    menuOverlay.classList.add('show');
});
menuClose.addEventListener('click', function() {
    menuPanel.classList.remove('show');
    menuOverlay.classList.remove('show');
});
menuOverlay.addEventListener('click', function() {
    menuPanel.classList.remove('show');
    menuOverlay.classList.remove('show');
});

// ===== CHAT =====
function addMessage(role, text) {
    emptyState.style.display = 'none';
    var div = document.createElement('div');
    div.className = 'msg ' + (role === 'user' ? 'user' : 'ai');
    var time = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    var copyBtn = role === 'ai' ? '<button class="msg-copy" onclick="copyText(this)">📋 کپی</button>' : '';
    div.innerHTML = '<div class="msg-avatar">' + (role === 'user' ? '👤' : '🤖') + '</div><div><div class="msg-content">' + text + '</div><div style="display:flex;align-items:center;gap:5px;margin-top:3px"><span class="msg-time">' + time + '</span>' + copyBtn + '</div></div>';
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function copyText(btn) {
    var t = btn.parentElement.parentElement.querySelector('.msg-content').textContent;
    navigator.clipboard.writeText(t).then(function() { btn.textContent = '✅'; setTimeout(function() { btn.textContent = '📋 کپی'; }, 1500); });
}

async function sendMessage() {
    var text = userInput.value.trim();
    if (!text) return;
    
    addMessage('user', text);
    userInput.value = '';
    sendBtn.disabled = true;
    typingEl.classList.add('show');

    try {
        var resp = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        typingEl.classList.remove('show');
        var data = await resp.json();
        addMessage('ai', data.reply || '✅ دریافت شد');
    } catch (e) {
        typingEl.classList.remove('show');
        addMessage('ai', '⚠️ خطا در ارتباط');
    }
    
    sendBtn.disabled = false;
    userInput.focus();
}

function clearHistory() {
    messagesDiv.innerHTML = '<div class="empty-state" id="emptyState"><div><span class="empty-icon">🤖</span><p>گفتگوی جدید</p><p class="empty-hint">سوال جدید بپرس!</p></div></div><div class="typing" id="typing">🤖 GNG AI در حال نوشتن...</div>';
    typingEl = document.getElementById('typing');
    emptyState = document.getElementById('emptyState');
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') sendMessage(); });
clearBtn.addEventListener('click', clearHistory);
userInput.focus();
