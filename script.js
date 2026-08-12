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

// ===== قیمت ارز =====
async function loadArz() {
    try {
        var html = '';
        
        // ارزها
        var r1 = await fetch('https://api.codebazan.ir/arz/?type=arz');
        var d1 = await r1.json();
        if (d1 && typeof d1 === 'object') {
            Object.keys(d1).slice(0, 12).forEach(function(k) {
                html += '<div class="price-item"><div class="price-name">' + k + '</div><div class="price-value">' + d1[k] + '</div></div>';
            });
        }
        
        // طلا
        var r2 = await fetch('https://api.codebazan.ir/arz/?type=gold');
        var d2 = await r2.json();
        if (d2 && typeof d2 === 'object') {
            Object.keys(d2).slice(0, 4).forEach(function(k) {
                var v = typeof d2[k] === 'object' ? (d2[k].price || JSON.stringify(d2[k])) : d2[k];
                html += '<div class="price-item"><div class="price-name">' + k + '</div><div class="price-value">' + v + '</div></div>';
            });
        }
        
        document.getElementById('arzPrices').innerHTML = html || '<div class="loading">داده‌ای یافت نشد</div>';
    } catch(e) {
        document.getElementById('arzPrices').innerHTML = '<div class="loading">خطا در دریافت</div>';
    }
}
loadArz();

// ===== ابزارها =====
var currentTool = '';

function showTool(tool) {
    currentTool = tool;
    var box = document.getElementById('toolResult');
    var inp = document.getElementById('toolInput');
    box.classList.remove('show');
    inp.style.display = 'none';
    inp.innerHTML = '';
    
    if (tool === 'weather') {
        inp.style.display = 'flex';
        inp.innerHTML = '<input type="text" id="toolParam" placeholder="نام شهر..."><button onclick="runTool()">🔍</button>';
    } else if (tool === 'tts') {
        inp.style.display = 'flex';
        inp.innerHTML = '<input type="text" id="toolParam" placeholder="متن..."><button onclick="runTool()">🔊</button>';
    } else if (tool === 'qr') {
        inp.style.display = 'flex';
        inp.innerHTML = '<input type="text" id="toolParam" placeholder="متن یا لینک..."><button onclick="runTool()">📱</button>';
    } else if (tool === 'shorten') {
        inp.style.display = 'flex';
        inp.innerHTML = '<input type="text" id="toolParam" placeholder="لینک بلند..."><button onclick="runTool()">🔗</button>';
    } else {
        runTool();
    }
}

async function runTool() {
    var box = document.getElementById('toolResult');
    var param = document.getElementById('toolParam');
    var val = param ? param.value.trim() : '';
    box.classList.add('show');
    box.innerHTML = '<div class="loading">در حال دریافت</div>';
    
    try {
        var resp, data, html = '';
        
        switch(currentTool) {
            case 'weather':
                resp = await fetch('https://api.codebazan.ir/weather/?city=' + encodeURIComponent(val || 'تهران'));
                data = await resp.text();
                html = '<strong>🌤️ ' + (val || 'تهران') + '</strong><br>' + data;
                break;
            case 'tts':
                if (!val) { html = 'لطفاً متن را وارد کنید'; break; }
                html = '<audio controls src="https://api.codebazan.ir/tts/?text=' + encodeURIComponent(val) + '&gender=1" style="width:100%"></audio>';
                break;
            case 'date':
                resp = await fetch('https://api.parssource.ir/date/');
                data = await resp.json();
                html = '<strong>📅 ' + JSON.stringify(data) + '</strong>';
                break;
            case 'bio':
                resp = await fetch('https://api.codebazan.ir/bio');
                data = await resp.text();
                html = data;
                break;
            case 'angizeshi':
                resp = await fetch('http://haji-api.ir/angizeshi');
                data = await resp.text();
                html = '💬 ' + data;
                break;
            case 'qr':
                if (!val) { html = 'لطفاً متن را وارد کنید'; break; }
                html = '<img src="https://api.qrserver.com/v1/create-qr-code/?data=' + encodeURIComponent(val) + '&size=200x200" style="max-width:100%">';
                break;
            case 'shorten':
                if (!val) { html = 'لطفاً لینک را وارد کنید'; break; }
                resp = await fetch('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(val));
                data = await resp.text();
                html = '<strong>لینک کوتاه:</strong> <a href="' + data + '" target="_blank" style="color:#06B6D4">' + data + '</a>';
                break;
            case 'news':
                resp = await fetch('https://api-free.ir/api2/news.php?token=f9b4a870986af3276d4806b4962799fe');
                data = await resp.text();
                html = data;
                break;
        }
        box.innerHTML = html || 'نتیجه‌ای یافت نشد';
    } catch(e) {
        box.innerHTML = '⚠️ خطا در دریافت اطلاعات';
    }
}
