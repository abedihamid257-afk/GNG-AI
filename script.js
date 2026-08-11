var API_URL = 'https://api-free.ir/api/chat.php';
var messagesDiv = document.getElementById('messages');
var userInput = document.getElementById('userInput');
var sendBtn = document.getElementById('sendBtn');
var typingEl = document.getElementById('typing');
var emptyState = document.getElementById('emptyState');
var clearBtn = document.getElementById('clearBtn');
var history = JSON.parse(localStorage.getItem('gng_ai_history') || '[]');

function saveHistory() { localStorage.setItem('gng_ai_history', JSON.stringify(history)); }

function loadHistory() {
    if (history.length > 0) {
        emptyState.style.display = 'none';
        history.forEach(function(msg) { addMessage(msg.role, msg.text, false); });
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

function addMessage(role, text, save) {
    if (save === undefined) save = true;
    emptyState.style.display = 'none';
    var div = document.createElement('div');
    div.className = 'msg ' + (role === 'user' ? 'user' : 'ai');
    var time = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    var copyBtn = role === 'ai' ? '<button class="msg-copy" onclick="copyText(this)">📋 کپی</button>' : '';
    div.innerHTML = '<div class="msg-avatar">' + (role === 'user' ? '👤' : '🤖') + '</div><div><div class="msg-content">' + text.replace(/\n/g, '<br>') + '</div><div style="display:flex;align-items:center;gap:5px;margin-top:3px"><span class="msg-time">' + time + '</span>' + copyBtn + '</div></div>';
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    if (save) { history.push({ role: role, text: text, time: Date.now() }); if (history.length > 100) history = history.slice(-100); saveHistory(); }
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
        if (resp.ok) {
            var data = await resp.json();
            var reply = data.response || data.reply || data.message || data.result || data.text || '✅ پاسخ دریافت شد';
            addMessage('ai', reply);
        } else {
            var resp2 = await fetch(API_URL + '?text=' + encodeURIComponent(text));
            if (resp2.ok) {
                var data2 = await resp2.json();
                addMessage('ai', data2.response || data2.reply || JSON.stringify(data2));
            } else {
                addMessage('ai', '⚠️ خطا در دریافت پاسخ');
            }
        }
    } catch (e) {
        typingEl.classList.remove('show');
        addMessage('ai', '⚠️ خطا در ارتباط. دوباره تلاش کنید.');
    }
    sendBtn.disabled = false;
    userInput.focus();
}

function clearHistory() {
    if (confirm('از پاک کردن تمام تاریخچه مطمئن هستید؟')) {
        history = [];
        saveHistory();
        messagesDiv.innerHTML = '<div class="empty-state"><div><span class="empty-icon">🤖</span><p>تاریخچه پاک شد</p></div></div>';
    }
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') sendMessage(); });
clearBtn.addEventListener('click', clearHistory);
loadHistory();
userInput.focus();
