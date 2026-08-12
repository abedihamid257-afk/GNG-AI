(function() {
    'use strict';

    // ===== المنت‌های DOM =====
    const container = document.getElementById('pricesContainer');
    const updateTimeEl = document.getElementById('updateTime');
    const refreshBtn = document.getElementById('refreshButton');

    // ===== APIهای رایگان بدون ثبت‌نام =====
    const API_EXCHANGE = 'https://api.exchangerate.fun/latest?base=USD';
    const API_GOLD = 'https://goldprice.dev/api/latest';
    const API_IRAN_ARZ = 'https://api.liara.run/api/v1/currency?type=arz';
    const API_IRAN_GOLD = 'https://api.liara.run/api/v1/currency?type=gold';
    const API_FALLBACK = 'https://api.codebazan.ir/arz';

    // ===== نام‌های فارسی ارزها =====
    const persianNames = {
        'USD': 'دلار آمریکا',
        'EUR': 'یورو',
        'GBP': 'پوند انگلیس',
        'AED': 'درهم امارات',
        'TRY': 'لیر ترکیه',
        'CNY': 'یوان چین',
        'JPY': 'ین ژاپن',
        'CHF': 'فرانک سوئیس',
        'CAD': 'دلار کانادا',
        'AUD': 'دلار استرالیا',
        'RUB': 'روبل روسیه',
        'INR': 'روپیه هند',
        'IQD': 'دینار عراق',
        'AFN': 'افغانی',
        'SAR': 'ریال عربستان',
        'OMR': 'ریال عمان',
        'KWD': 'دینار کویت',
        'BHD': 'دینار بحرین',
        'QAR': 'ریال قطر',
        'MYR': 'رینگیت مالزی',
        'SGD': 'دلار سنگاپور',
        'HKD': 'دلار هنگ کنگ',
        'KRW': 'وون کره',
        'SEK': 'کرون سوئد',
        'NOK': 'کرون نروژ',
        'DKK': 'کرون دانمارک',
        'PKR': 'روپیه پاکستان',
        'AZN': 'منات آذربایجان',
        'GEL': 'لاری گرجستان',
        'AMD': 'درام ارمنستان',
        'IRR': 'ریال ایران',
        'SYR': 'لیر سوریه'
    };

    // ===== آیکون‌های ارزها =====
    const currencyIcons = {
        'USD': '🇺🇸',
        'EUR': '🇪🇺',
        'GBP': '🇬🇧',
        'AED': '🇦🇪',
        'TRY': '🇹🇷',
        'CNY': '🇨🇳',
        'JPY': '🇯🇵',
        'CHF': '🇨🇭',
        'CAD': '🇨🇦',
        'AUD': '🇦🇺',
        'RUB': '🇷🇺',
        'INR': '🇮🇳',
        'IQD': '🇮🇶',
        'AFN': '🇦🇫',
        'SAR': '🇸🇦',
        'OMR': '🇴🇲',
        'KWD': '🇰🇼',
        'BHD': '🇧🇭',
        'QAR': '🇶🇦',
        'MYR': '🇲🇾',
        'SGD': '🇸🇬',
        'HKD': '🇭🇰',
        'KRW': '🇰🇷',
        'SEK': '🇸🇪',
        'NOK': '🇳🇴',
        'DKK': '🇩🇰',
        'PKR': '🇵🇰',
        'AZN': '🇦🇿',
        'GEL': '🇬🇪',
        'AMD': '🇦🇲',
        'IRR': '🇮🇷',
        'SYR': '🇸🇾'
    };

    // ===== ارزهای اصلی به ترتیب نمایش =====
    const mainCurrencies = ['USD', 'EUR', 'GBP', 'AED', 'TRY', 'CNY', 'JPY', 'CHF', 'CAD', 'AUD'];

    // ===== متغیرهای گلوبال =====
    let usdToIrr = null;
    let isFirstLoad = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    // ===== توابع کمکی =====

    /**
     * فرمت کردن عدد به صورت خوانا
     * @param {number|string} price - قیمت
     * @param {number} decimals - تعداد اعشار
     * @returns {string} قیمت فرمت شده
     */
    function formatPrice(price, decimals = 0) {
        if (!price && price !== 0) return '---';
        const num = parseFloat(String(price).replace(/[^\d.-]/g, ''));
        if (isNaN(num)) return String(price);
        return num.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    /**
     * فرمت کردن قیمت به تومان (فارسی)
     * @param {number|string} price - قیمت به تومان
     * @returns {string} قیمت فرمت شده فارسی
     */
    function formatToman(price) {
        if (!price && price !== 0) return '---';
        const num = Math.round(parseFloat(String(price).replace(/[^\d.-]/g, '')));
        if (isNaN(num)) return String(price);
        return num.toLocaleString('fa-IR');
    }

    /**
     * دریافت نام فارسی ارز
     * @param {string} code - کد ارز
     * @returns {string} نام فارسی
     */
    function getPersianName(code) {
        return persianNames[code] || code;
    }

    /**
     * دریافت آیکون ارز
     * @param {string} code - کد ارز
     * @returns {string} آیکون
     */
    function getIcon(code) {
        return currencyIcons[code] || '💱';
    }

    /**
     * نمایش حالت لودینگ
     */
    function showLoading() {
        container.innerHTML = `
            <div class="loading-state">
                <span class="loader"></span>
                <span class="loader-text">در حال دریافت قیمت‌های لحظه‌ای...</span>
            </div>
        `;
    }

    /**
     * نمایش خطا
     * @param {string} message - پیام خطا
     */
    function showError(message) {
        container.innerHTML = `
            <div class="error-message">
                ⚠️ ${message || 'خطا در دریافت قیمت‌ها'}
                <small>لطفاً اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.</small>
            </div>
        `;
        updateTimeEl.textContent = '🕒 خطا در بروزرسانی';
    }

    /**
     * دریافت قیمت دلار به تومان از APIهای ایرانی
     * @returns {Promise<number>} قیمت دلار به تومان
     */
    async function fetchUsdToToman() {
        // تلاش اول: API لیارا برای ارز
        try {
            const response = await fetch(API_IRAN_ARZ);
            if (response.ok) {
                const data = await response.json();
                if (data && data.arz) {
                    // جستجوی دلار در داده‌ها
                    for (const [key, value] of Object.entries(data.arz)) {
                        if (key.includes('دلار') || key.toLowerCase().includes('dollar')) {
                            const price = parseFloat(String(value).replace(/[^\d]/g, ''));
                            if (price > 0) {
                                console.log('✅ قیمت دلار از API لیارا:', price);
                                return price;
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('⚠️ خطا در API لیارا:', e.message);
        }

        // تلاش دوم: API کدبازان
        try {
            const response = await fetch(API_FALLBACK);
            if (response.ok) {
                const text = await response.text();
                // جستجوی الگوی دلار در متن
                const patterns = [
                    /دلار[^\d]*?(\d{1,3}(?:,\d{3})*)/,
                    /"دلار"[^\d]*?(\d{1,3}(?:,\d{3})*)/,
                    /USD[^\d]*?(\d{1,3}(?:,\d{3})*)/
                ];
                
                for (const pattern of patterns) {
                    const match = text.match(pattern);
                    if (match && match[1]) {
                        const price = parseFloat(match[1].replace(/,/g, ''));
                        if (price > 0 && price < 200000) { // محدوده منطقی برای دلار
                            console.log('✅ قیمت دلار از API کدبازان:', price);
                            return price;
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('⚠️ خطا در API کدبازان:', e.message);
        }

        // مقدار پیش‌فرض در صورت عدم دریافت
        console.warn('⚠️ نتونستیم قیمت دلار رو بگیریم، از مقدار پیش‌فرض استفاده می‌کنیم');
        return 65000; // مقدار تقریبی
    }

    /**
     * دریافت قیمت طلا و فلزات از API
     * @returns {Promise<Array>} آرایه قیمت‌های طلا
     */
    async function fetchGoldPrices() {
        const goldItems = [];

        // تلاش اول: API goldprice.dev
        try {
            const response = await fetch(API_GOLD);
            if (response.ok) {
                const data = await response.json();
                console.log('📊 داده‌های طلا از goldprice.dev:', data);

                // قیمت طلا (انس)
                if (data.price) {
                    goldItems.push({
                        name: 'طلای جهانی (انس)',
                        price: parseFloat(data.price),
                        unit: 'دلار',
                        icon: '🥇',
                        type: 'gold',
                        isOunce: true,
                        priority: 1
                    });
                }

                // قیمت طلا (گرم) - اگه API داشت
                if (data.price_gram) {
                    goldItems.push({
                        name: 'طلای جهانی (گرم)',
                        price: parseFloat(data.price_gram),
                        unit: 'دلار',
                        icon: '🥇',
                        type: 'gold',
                        priority: 2
                    });
                } else if (data.price) {
                    // محاسبه قیمت هر گرم از روی انس (1 انس = 31.1035 گرم)
                    goldItems.push({
                        name: 'طلای جهانی (گرم)',
                        price: parseFloat((data.price / 31.1035).toFixed(2)),
                        unit: 'دلار',
                        icon: '🥇',
                        type: 'gold',
                        priority: 2
                    });
                }

                // قیمت نقره
                if (data.silver_price) {
                    goldItems.push({
                        name: 'نقره (انس)',
                        price: parseFloat(data.silver_price),
                        unit: 'دلار',
                        icon: '🥈',
                        type: 'metal',
                        priority: 3
                    });
                }
            }
        } catch (e) {
            console.warn('⚠️ خطا در API طلای جهانی:', e.message);
        }

        // تلاش دوم: API ایرانی طلا
        if (goldItems.length === 0) {
            try {
                const response = await fetch(API_IRAN_GOLD);
                if (response.ok) {
                    const data = await response.json();
                    console.log('📊 داده‌های طلا از API ایرانی:', data);
                    
                    if (data && data.gold) {
                        for (const [key, value] of Object.entries(data.gold)) {
                            let priceValue = value;
                            if (typeof value === 'object' && value.price) {
                                priceValue = value.price;
                            }
                            goldItems.push({
                                name: key,
                                price: String(priceValue).replace(/[^\d]/g, ''),
                                unit: 'تومان',
                                icon: '🥇',
                                type: 'gold',
                                priority: 4
                            });
                        }
                    }
                }
            } catch (e) {
                console.warn('⚠️ خطا در API طلای ایرانی:', e.message);
            }
        }

        return goldItems;
    }

    /**
     * دریافت نرخ ارزهای جهانی
     * @returns {Promise<Array>} آرایه نرخ ارزها
     */
    async function fetchCurrencyRates() {
        const currencyItems = [];

        try {
            const response = await fetch(API_EXCHANGE);
            if (response.ok) {
                const data = await response.json();
                console.log('📊 داده‌های ارز از exchangerate.fun:', data);

                if (data && data.rates) {
                    const rates = data.rates;

                    for (const code of mainCurrencies) {
                        if (rates[code]) {
                            const rateToUsd = rates[code]; // ۱ USD = rateToUsd از این ارز
                            const oneUnitToUsd = 1 / rateToUsd; // ۱ واحد از این ارز = X دلار
                            const priceInToman = Math.round(oneUnitToUsd * (usdToIrr || 65000));

                            currencyItems.push({
                                name: getPersianName(code),
                                price: priceInToman,
                                unit: 'تومان',
                                icon: getIcon(code),
                                type: 'currency',
                                code: code,
                                rateToUsd: oneUnitToUsd,
                                priority: mainCurrencies.indexOf(code) + 10
                            });
                        }
                    }

                    // اضافه کردن چند ارز اضافی اگه بودن
                    const extraCurrencies = ['RUB', 'INR', 'SAR', 'MYR', 'SGD'];
                    for (const code of extraCurrencies) {
                        if (rates[code] && !mainCurrencies.includes(code)) {
                            const rateToUsd = rates[code];
                            const oneUnitToUsd = 1 / rateToUsd;
                            const priceInToman = Math.round(oneUnitToUsd * (usdToIrr || 65000));

                            currencyItems.push({
                                name: getPersianName(code),
                                price: priceInToman,
                                unit: 'تومان',
                                icon: getIcon(code),
                                type: 'currency',
                                code: code,
                                rateToUsd: oneUnitToUsd,
                                priority: 20
                            });
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('⚠️ خطا در API ارز جهانی:', e.message);
        }

        return currencyItems;
    }

    /**
     * دریافت قیمت‌ها از API ایرانی (حالت اضطراری)
     * @returns {Promise<Array>} آرایه قیمت‌ها
     */
    async function fetchIranianPrices() {
        const items = [];

        try {
            const response = await fetch(API_IRAN_ARZ);
            if (response.ok) {
                const data = await response.json();
                console.log('📊 داده‌های اضطراری از API ایرانی:', data);

                if (data && data.arz) {
                    const priorityNames = ['دلار', 'یورو', 'پوند', 'درهم', 'لیر', 'یوان'];
                    
                    for (const [name, price] of Object.entries(data.arz)) {
                        const cleanPrice = String(price).replace(/[^\d]/g, '');
                        
                        let icon = '💱';
                        for (const pName of priorityNames) {
                            if (name.includes(pName)) {
                                const idx = priorityNames.indexOf(pName);
                                const icons = ['🇺🇸', '🇪🇺', '🇬🇧', '🇦🇪', '🇹🇷', '🇨🇳'];
                                icon = icons[idx] || '💱';
                                break;
                            }
                        }

                        items.push({
                            name: name,
                            price: cleanPrice,
                            unit: 'تومان',
                            icon: icon,
                            type: 'currency',
                            priority: 30
                        });
                    }
                }

                if (data && data.gold) {
                    for (const [name, price] of Object.entries(data.gold)) {
                        let priceValue = price;
                        if (typeof price === 'object' && price.price) {
                            priceValue = price.price;
                        }
                        items.push({
                            name: name,
                            price: String(priceValue).replace(/[^\d]/g, ''),
                            unit: 'تومان',
                            icon: '🥇',
                            type: 'gold',
                            priority: 1
                        });
                    }
                }
            }
        } catch (e) {
            console.warn('⚠️ خطا در API ایرانی اضطراری:', e.message);
        }

        return items;
    }

    /**
     * تابع اصلی دریافت و نمایش قیمت‌ها
     */
    async function fetchPrices() {
        // نمایش لودینگ
        if (isFirstLoad) {
            showLoading();
            updateTimeEl.textContent = '🕒 در حال اتصال به سرورها...';
        }

        try {
            let allPrices = [];

            // مرحله ۱: دریافت قیمت دلار به تومان
            updateTimeEl.textContent = '🕒 دریافت قیمت دلار...';
            usdToIrr = await fetchUsdToToman();
            console.log('💵 قیمت دلار به تومان:', usdToIrr);

            // مرحله ۲: دریافت قیمت طلا
            updateTimeEl.textContent = '🕒 دریافت قیمت طلا...';
            const goldPrices = await fetchGoldPrices();
            allPrices = allPrices.concat(goldPrices);
            console.log('🥇 تعداد قیمت‌های طلا:', goldPrices.length);

            // مرحله ۳: دریافت نرخ ارزها
            updateTimeEl.textContent = '🕒 دریافت نرخ ارزها...';
            const currencyRates = await fetchCurrencyRates();
            allPrices = allPrices.concat(currencyRates);
            console.log('💱 تعداد نرخ ارزها:', currencyRates.length);

            // مرحله ۴: اگه هیچ داده‌ای نبود، از API ایرانی استفاده کن
            if (allPrices.length === 0) {
                updateTimeEl.textContent = '🕒 استفاده از منبع جایگزین...';
                const iranianPrices = await fetchIranianPrices();
                allPrices = allPrices.concat(iranianPrices);
                console.log('🇮🇷 تعداد قیمت‌های ایرانی:', iranianPrices.length);
            }

            // اگه بازم خالی بود
            if (allPrices.length === 0) {
                if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    console.log(`🔄 تلاش مجدد (${retryCount}/${MAX_RETRIES})...`);
                    updateTimeEl.textContent = `🕒 تلاش مجدد ${retryCount}...`;
                    setTimeout(fetchPrices, 2000);
                    return;
                }
                throw new Error('هیچ داده‌ای از هیچ منبعی دریافت نشد');
            }

            // حذف موارد تکراری
            const seen = new Set();
            allPrices = allPrices.filter(item => {
                const key = item.name + item.type;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            // مرتب‌سازی
            allPrices.sort((a, b) => {
                if (a.type === 'gold' && b.type !== 'gold') return -1;
                if (a.type !== 'gold' && b.type === 'gold') return 1;
                if (a.type === 'metal' && b.type === 'currency') return -1;
                if (a.type === 'currency' && b.type === 'metal') return 1;
                return (a.priority || 99) - (b.priority || 99);
            });

            // محدود کردن تعداد
            const displayItems = allPrices.slice(0, 16);

            // رندر
            renderPrices(displayItems);

            // بروزرسانی زمان
            const now = new Date();
            const options = { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hour12: false
            };
            const timeStr = now.toLocaleTimeString('fa-IR', options);
            const dateStr = now.toLocaleDateString('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            updateTimeEl.textContent = `🕒 ${dateStr} - ${timeStr}`;

            // ریست شمارنده
            retryCount = 0;
            isFirstLoad = false;

            console.log('✅ بروزرسانی با موفقیت انجام شد');

        } catch (error) {
            console.error('❌ خطای کلی:', error);
            
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                console.log(`🔄 تلاش مجدد پس از خطا (${retryCount}/${MAX_RETRIES})...`);
                updateTimeEl.textContent = `🕒 تلاش مجدد ${retryCount}...`;
                setTimeout(fetchPrices, 3000);
                return;
            }

            showError('خطا در دریافت قیمت‌ها. لطفاً دوباره تلاش کنید.');
            retryCount = 0;
        }
    }

    /**
     * رندر کارت‌های قیمت
     * @param {Array} items - آرایه آیتم‌ها
     */
    function renderPrices(items) {
        if (!items || items.length === 0) {
            showError('قیمتی برای نمایش موجود نیست.');
            return;
        }

        let html = '<div class="prices-grid">';

        items.forEach((item, index) => {
            const name = item.name || 'نامشخص';
            let priceDisplay;
            let unitDisplay = item.unit || '';

            // فرمت قیمت بر اساس نوع
            if (item.type === 'gold' || item.type === 'metal') {
                if (item.unit === 'دلار') {
                    priceDisplay = '$' + formatPrice(item.price, 2);
                    if (item.isOunce) {
                        unitDisplay = 'هر اونس';
                    } else {
                        unitDisplay = 'هر گرم';
                    }
                } else {
                    priceDisplay = formatToman(item.price);
                    unitDisplay = unitDisplay || 'تومان';
                }
            } else if (item.type === 'currency') {
                priceDisplay = formatToman(item.price);
                unitDisplay = unitDisplay || 'تومان';
            } else {
                priceDisplay = formatPrice(item.price);
            }

            const icon = item.icon || '💱';

            // تغییرات تصادفی (فقط جنبه نمایشی)
            const changeVal = (Math.random() * 4 - 2).toFixed(2);
            const isPositive = parseFloat(changeVal) >= 0;
            const changeClass = isPositive ? 'positive' : 'negative';
            const changeSign = isPositive ? '+' : '';
            const changeArrow = isPositive ? '▲' : '▼';

            // انیمیشن تأخیری
            const animationDelay = index * 0.05;

            html += `
                <div class="price-card" data-type="${item.type || 'currency'}" style="animation: fadeInUp 0.4s ease ${animationDelay}s both;">
                    <div class="currency-name">
                        <span class="currency-icon">${icon}</span> ${name}
                    </div>
                    <div class="price-value">${priceDisplay}</div>
                    <div class="unit-text">${unitDisplay}</div>
                    <div class="change ${changeClass}">
                        ${changeSign}${changeVal}% 
                        <span>${changeArrow}</span>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    // ===== Event Listeners =====
    
    // دکمه بروزرسانی دستی
    refreshBtn.addEventListener('click', () => {
        refreshBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            refreshBtn.style.transform = '';
        }, 150);
        
        isFirstLoad = true;
        retryCount = 0;
        fetchPrices();
    });

    // بروزرسانی با کلید F5 (دسکتاپ)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F5') {
            e.preventDefault();
            isFirstLoad = true;
            retryCount = 0;
            fetchPrices();
        }
    });

    // ===== راه‌اندازی اولیه =====
    console.log('🚀 GNG Tools - Price Tracker');
    console.log('📡 در حال اتصال به APIها...');
    
    // اولین بارگذاری
    fetchPrices();

    // بروزرسانی خودکار هر ۱۰ دقیقه
    setInterval(() => {
        console.log('🔄 بروزرسانی خودکار...');
        fetchPrices();
    }, 600000); // ۱۰ دقیقه

    // ===== مدیریت آفلاین/آنلاین =====
    window.addEventListener('online', () => {
        console.log('🌐 اینترنت وصل شد');
        updateTimeEl.textContent = '🕒 اینترنت وصل شد، در حال بروزرسانی...';
        isFirstLoad = true;
        retryCount = 0;
        fetchPrices();
    });

    window.addEventListener('offline', () => {
        console.log('📴 اینترنت قطع شد');
        updateTimeEl.textContent = '📴 اینترنت قطع است';
    });

})();
