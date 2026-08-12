(function() {
    'use strict';

    const container = document.getElementById('pricesContainer');
    const updateTimeEl = document.getElementById('updateTime');
    const refreshBtn = document.getElementById('refreshButton');

    function showLoading() {
        container.innerHTML = `
            <div class="loading-state">
                <div class="loader"></div>
                <p>در حال دریافت قیمت‌های لحظه‌ای...</p>
            </div>`;
        updateTimeEl.textContent = '🕒 در حال اتصال...';
    }

    function showError(msg) {
        container.innerHTML = `
            <div class="error-message">
                ⚠️ ${msg || 'خطا در دریافت قیمت‌ها'}
                <br><small>لطفاً دکمه بروزرسانی را بزنید</small>
            </div>`;
        updateTimeEl.textContent = '🕒 خطا';
    }

    function formatPrice(price, isToman) {
        if (!price) return '---';
        let num = parseFloat(price);
        if (isNaN(num)) return String(price);
        
        if (isToman) {
            return Math.round(num).toLocaleString('fa-IR');
        } else {
            return '$' + num.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
    }

    // ==========================================
    // تابع کمکی: تلاش برای fetch با timeout
    // ==========================================
    async function tryFetch(url, timeout = 5000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const resp = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!resp.ok) throw new Error('Status: ' + resp.status);
            return resp;
        } catch(e) {
            clearTimeout(timeoutId);
            throw e;
        }
    }

    // ==========================================
    // دریافت قیمت طلا و نقره جهانی
    // ==========================================
    async function fetchGlobalMetals() {
        const apis = [
            'https://api.metals.live/v1/spot',
            'https://api.gold-api.com/price',
            'https://api.metals.dev/v1/latest?api_key=demo'
        ];

        for (let api of apis) {
            try {
                const resp = await tryFetch(api);
                const data = await resp.json();
                
                let items = [];
                
                // metals.live format
                if (Array.isArray(data)) {
                    const gold = data.find(m => m.currency === 'XAU');
                    const silver = data.find(m => m.currency === 'XAG');
                    
                    if (gold) items.push({
                        name: 'طلای جهانی', price: gold.price,
                        unit: 'دلار / انس', icon: '🥇', type: 'gold'
                    });
                    if (silver) items.push({
                        name: 'نقره جهانی', price: silver.price,
                        unit: 'دلار / انس', icon: '🥈', type: 'metal'
                    });
                }
                
                // gold-api.com format
                if (data.price) {
                    items.push({
                        name: 'طلای جهانی', price: data.price,
                        unit: 'دلار / انس', icon: '🥇', type: 'gold'
                    });
                }
                
                if (items.length > 0) {
                    console.log('✅ فلزات از:', api);
                    return items;
                }
            } catch(e) {
                console.log('❌', api, e.message);
            }
        }
        
        return [];
    }

    // ==========================================
    // دریافت قیمت دلار ایران
    // ==========================================
    async function fetchUsdPrice() {
        const apis = [
            {
                url: 'https://api.arzjet.com/api/v1/currencies',
                parser: (data) => {
                    if (data && data.data) {
                        for (let item of data.data) {
                            if (item.code === 'USD' || item.name.includes('دلار')) {
                                return parseInt(item.price);
                            }
                        }
                    }
                    return null;
                }
            },
            {
                url: 'https://api.tetherland.com/api/v1/currencies',
                parser: (data) => {
                    if (Array.isArray(data)) {
                        const usd = data.find(c => c.symbol === 'USD' || c.code === 'USD');
                        if (usd && usd.price) return parseInt(usd.price);
                    }
                    return null;
                }
            },
            {
                url: 'https://api.callook.info/arz.json',
                parser: (data) => {
                    if (data.USD) return parseInt(data.USD);
                    if (data.arz && data.arz.USD) return parseInt(data.arz.USD);
                    return null;
                }
            },
            {
                url: 'https://api.navasan.net/v1/latest',
                parser: (data) => {
                    if (data && data.usd) return parseInt(data.usd);
                    return null;
                }
            },
            {
                url: 'https://raw.githubusercontent.com/arzdigital/arzdigital-api/main/data.json',
                parser: (data) => {
                    if (data && data.currencies) {
                        const usd = data.currencies.find(c => c.slug === 'usd' || c.code === 'USD');
                        if (usd && usd.price) return parseInt(usd.price);
                    }
                    return null;
                }
            },
            {
                url: 'https://api.exchange.ir/v1/currencies',
                parser: (data) => {
                    if (data && data.data) {
                        const usd = data.data.find(c => c.code === 'USD');
                        if (usd && usd.price) return parseInt(usd.price);
                    }
                    return null;
                }
            },
            {
                url: 'https://bonbast.com/api/latest',
                parser: (data) => {
                    if (data && data.USD) return parseInt(data.USD);
                    return null;
                }
            },
            {
                url: 'https://tgju.org/api/v1/market/indicator/summary/price_dollar_rl',
                parser: (data) => {
                    if (data && data.price) return parseInt(data.price);
                    return null;
                }
            }
        ];

        for (let api of apis) {
            try {
                const resp = await tryFetch(api.url);
                const data = await resp.json();
                const price = api.parser(data);
                
                if (price && price > 50000) {
                    console.log('✅ دلار از:', api.url, '→', price);
                    return price;
                }
            } catch(e) {
                console.log('❌', api.url, e.message);
            }
        }
        
        return null;
    }

    // ==========================================
    // دریافت قیمت طلا و سکه ایران
    // ==========================================
    async function fetchIranGold() {
        const apis = [
            {
                url: 'https://api.arzjet.com/api/v1/gold',
                parser: (data) => {
                    if (data && data.data) {
                        return data.data.slice(0, 8).map(item => ({
                            name: item.name || 'طلا',
                            price: parseInt(item.price),
                            unit: 'تومان',
                            icon: '🪙',
                            type: 'iran-gold'
                        }));
                    }
                    return [];
                }
            },
            {
                url: 'https://api.callook.info/gold.json',
                parser: (data) => {
                    let items = [];
                    if (data) {
                        for (let [key, value] of Object.entries(data)) {
                            items.push({
                                name: key,
                                price: parseInt(value),
                                unit: 'تومان',
                                icon: '🪙',
                                type: 'iran-gold'
                            });
                        }
                    }
                    return items.slice(0, 8);
                }
            },
            {
                url: 'https://api.navasan.net/v1/gold',
                parser: (data) => {
                    if (data && Array.isArray(data)) {
                        return data.slice(0, 8).map(item => ({
                            name: item.name || 'طلا',
                            price: parseInt(item.price),
                            unit: 'تومان',
                            icon: '🪙',
                            type: 'iran-gold'
                        }));
                    }
                    return [];
                }
            },
            {
                url: 'https://tgju.org/api/v1/market/indicator/summary/price_gold_18',
                parser: (data) => {
                    if (data && data.price) {
                        return [{
                            name: 'طلای ۱۸ عیار',
                            price: parseInt(data.price),
                            unit: 'تومان',
                            icon: '🥇',
                            type: 'iran-gold'
                        }];
                    }
                    return [];
                }
            }
        ];

        for (let api of apis) {
            try {
                const resp = await tryFetch(api.url);
                const data = await resp.json();
                const items = api.parser(data);
                
                if (items.length > 0) {
                    console.log('✅ طلای ایران از:', api.url);
                    return items;
                }
            } catch(e) {
                console.log('❌', api.url, e.message);
            }
        }
        
        return [];
    }

    // ==========================================
    // تابع اصلی
    // ==========================================
    async function updatePrices() {
        showLoading();
        let allPrices = [];

        // 1. طلا و نقره جهانی
        const metals = await fetchGlobalMetals();
        allPrices = allPrices.concat(metals);

        // 2. قیمت دلار
        const usdPrice = await fetchUsdPrice();

        // 3. طلا و سکه ایران
        const iranGold = await fetchIranGold();
        allPrices = allPrices.concat(iranGold);

        // 4. ارزهای مهم (اگه قیمت دلار رو داریم)
        if (usdPrice) {
            const currencies = [
                { name: 'دلار آمریکا', price: usdPrice, icon: '🇺🇸', rate: 1 },
                { name: 'یورو', price: Math.round(usdPrice * 1.08), icon: '🇪🇺', rate: 1.08 },
                { name: 'پوند انگلیس', price: Math.round(usdPrice * 1.26), icon: '🇬🇧', rate: 1.26 },
                { name: 'درهم امارات', price: Math.round(usdPrice * 0.27), icon: '🇦🇪', rate: 0.27 },
                { name: 'لیر ترکیه', price: Math.round(usdPrice * 0.031), icon: '🇹🇷', rate: 0.031 },
                { name: 'یوان چین', price: Math.round(usdPrice * 0.14), icon: '🇨🇳', rate: 0.14 },
                { name: 'ین ژاپن', price: Math.round(usdPrice * 0.0067), icon: '🇯🇵', rate: 0.0067 },
                { name: 'روبل روسیه', price: Math.round(usdPrice * 0.011), icon: '🇷🇺', rate: 0.011 }
            ];

            for (let curr of currencies) {
                allPrices.push({
                    name: curr.name,
                    price: curr.price,
                    unit: 'تومان',
                    icon: curr.icon,
                    type: 'currency'
                });
            }
        }

        // ==========================================
        // نمایش
        // ==========================================
        if (allPrices.length === 0) {
            showError('هیچ APIی جواب نداد. لطفاً دوباره تلاش کنید.');
            return;
        }

        let html = '<div class="prices-grid">';
        
        for (let item of allPrices) {
            let priceDisplay;
            
            if (item.type === 'gold' || item.type === 'metal') {
                priceDisplay = formatPrice(item.price, false);
            } else {
                priceDisplay = formatPrice(item.price, true);
            }

            html += `
                <div class="price-card" data-type="${item.type}">
                    <div class="currency-name">
                        <span class="currency-icon">${item.icon}</span>
                        ${item.name}
                    </div>
                    <div class="price-value">${priceDisplay}</div>
                    <div class="unit-text">${item.unit || ''}</div>
                </div>`;
        }
        
        html += '</div>';
        container.innerHTML = html;

        const now = new Date();
        updateTimeEl.textContent = '🕒 ' + now.toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        console.log(`✅ ${allPrices.length} قیمت نمایش داده شد`);
    }

    refreshBtn.addEventListener('click', updatePrices);
    updatePrices();
    setInterval(updatePrices, 300000);
})();
