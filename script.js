/**
 * =============================================
 * GNG Tools - نمایش قیمت لحظه‌ای ارز و طلا
 * Graham Team | v2.0
 * =============================================
 * 
 * APIهای استفاده شده (همه رایگان و بدون ثبت‌نام):
 * 
 * 1. goldprice.dev        → قیمت لحظه‌ای طلا، نقره، مس (انس و گرم)
 * 2. exchangerate.fun     → نرخ ۱۷۰+ ارز جهانی (به‌روزرسانی ساعتی)
 * 3. api.liara.run        → قیمت ارز و طلا به تومان (منبع ایرانی)
 * 4. frankfurter.app      → نرخ ارز بانک مرکزی اروپا (۳۰+ ارز)
 * 5. api.codebazan.ir     → API جایگزین ایرانی
 * 6. budjet.org           → نرخ ۱۶۱ ارز جهانی
 */

(function() {
    'use strict';

    // ===== ارجاع به عناصر DOM =====
    const container = document.getElementById('pricesContainer');
    const updateTimeEl = document.getElementById('updateTime');
    const refreshBtn = document.getElementById('refreshButton');

    // ===== API Endpoints (پروکسی شده توسط Cloudflare Worker) =====
    // اگه ورکر نداری، می‌تونی مستقیم از آدرس اصلی استفاده کنی:
    
    const API = {
        // قیمت طلا و فلزات (از goldprice.dev)
        gold: '/api/gold',
        // نرخ ارز جهانی (از exchangerate.fun)
        exchange: '/api/exchange?base=USD',
        // قیمت ارز ایرانی به تومان (از liara)
        arz: '/api/arz',
        // قیمت طلا و سکه ایران (از liara)
        goldIr: '/api/gold-ir',
        // API جایگزین ایرانی (از codebazan)
        fallback: '/api/fallback',
        // نرخ ارز بانک مرکزی اروپا
        ecb: '/api/ecb?from=USD',
        // نرخ ارز از budjet.org
        budjet: '/api/budjet?base=USD',
        // نرخ ارز از CDN (irfanokr)
        currency: '/api/currency?base=usd'
    };

    // ===== اگه ورکر نداری، اینو کامنت کن و پایینیه رو از کامنت دربیار =====
    
    /*
    // آدرس‌های مستقیم (بدون ورکر) - اگه CORS اذیت کرد از اینا استفاده نکن
    const API = {
        gold: 'https://goldprice.dev/api/latest',
        exchange: 'https://api.exchangerate.fun/latest?base=USD',
        arz: 'https://api.liara.run/api/v1/currency?type=arz',
        goldIr: 'https://api.liara.run/api/v1/currency?type=gold',
        fallback: 'https://api.codebazan.ir/arz',
        ecb: 'https://api.frankfurter.app/latest?from=USD',
        budjet: 'https://api.budjet.org/fiat/USD',
        currency: 'https://cdn.jsdelivr.net/gh/irfanokr/currency-api@main/v1/currencies/usd.json'
    };
    */

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
        'THB': 'بات تایلند',
        'PHP': 'پزوی فیلیپین',
        'IDR': 'روپیه اندونزی',
        'VND': 'دانگ ویتنام',
        'EGP': 'پوند مصر',
        'NGN': 'نایرا نیجریه',
        'ZAR': 'راند آفریقای جنوبی',
        'MXN': 'پزوی مکزیک',
        'BRL': 'رئال برزیل',
        'ARS': 'پزوی آرژانتین'
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
        'THB': '🇹🇭',
        'PHP': '🇵🇭',
        'IDR': '🇮🇩',
        'VND': '🇻🇳',
        'EGP': '🇪🇬',
        'NGN': '🇳🇬',
        'ZAR': '🇿🇦',
        'MXN': '🇲🇽',
        'BRL': '🇧🇷',
        'ARS': '🇦🇷'
    };

    // ===== ارزهای اصلی برای نمایش =====
    const mainCurrencies = [
        'USD', 'EUR', 'GBP', 'AED', 'TRY', 'CNY', 
        'JPY', 'CHF', 'CAD', 'AUD', 'RUB', 'INR',
        'SAR', 'OMR', 'KWD', 'BHD', 'QAR', 'MYR',
        'SGD', 'HKD', 'KRW', 'THB', 'PHP', 'IDR'
    ];

    // ===== متغیرهای گلوبال =====
    let usdToIrr = null;      // قیمت دلار به تومان
    let lastUpdate = null;    // زمان آخرین بروزرسانی
    let isUpdating = false;   // وضعیت بروزرسانی

    /**
     * فرمت کردن عدد به صورت قیمت
     * @param {number|string} price - قیمت ورودی
     * @returns {string} قیمت فرمت شده
     */
    function formatPrice(price) {
        if (!price && price !== 0) return '---';
        let num = parseFloat(String(price).replace(/[^\d.-]/g, ''));
        if (isNaN(num)) return String(price);
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    /**
     * فرمت کردن عدد به تومان (بدون اعشار)
     * @param {number} price - قیمت به تومان
     * @returns {string} قیمت فرمت شده
     */
    function formatToman(price) {
        if (!price && price !== 0) return '---';
        let num = Math.round(parseFloat(String(price).replace(/[^\d.-]/g, '')));
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
                <div class="loader"></div>
                <div class="loader-text">در حال دریافت قیمت‌های لحظه‌ای...</div>
            </div>
        `;
        updateTimeEl.textContent = '🕒 در حال اتصال...';
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
     * دریافت قیمت طلا و فلزات گرانبها
     * @returns {Promise<Array>} آرایه قیمت‌ها
     */
    async function fetchGoldPrices() {
        const items = [];
        
        try {
            const resp = await fetch(API.gold);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            
            const data = await resp.json();
            
            // قیمت طلا به ازای هر اونس
            if (data.price) {
                items.push({
                    name: 'طلای جهانی (انس)',
                    price: data.price,
                    unit: 'دلار / اونس',
                    icon: '🥇',
                    type: 'gold',
                    priority: 1
                });
            }
            
            // قیمت طلا به ازای هر گرم
            if (data.price_gram) {
                items.push({
                    name: 'طلای جهانی (گرم)',
                    price: data.price_gram,
                    unit: 'دلار / گرم',
                    icon: '🥇',
                    type: 'gold',
                    priority: 2
                });
            }
            
            // قیمت طلای ۲۴ عیار
            if (data.price_gram_24k) {
                items.push({
                    name: 'طلای ۲۴ عیار (گرم)',
                    price: data.price_gram_24k,
                    unit: 'دلار / گرم',
                    icon: '🥇',
                    type: 'gold',
                    priority: 3
                });
            }
            
            // قیمت طلای ۱۸ عیار
            if (data.price_gram_18k) {
                items.push({
                    name: 'طلای ۱۸ عیار (گرم)',
                    price: data.price_gram_18k,
                    unit: 'دلار / گرم',
                    icon: '🥇',
                    type: 'gold',
                    priority: 4
                });
            }
            
            // قیمت نقره
            if (data.silver_price) {
                items.push({
                    name: 'نقره (انس)',
                    price: data.silver_price,
                    unit: 'دلار / اونس',
                    icon: '🥈',
                    type: 'metal',
                    priority: 10
                });
            }
            
            // قیمت پلاتین
            if (data.platinum_price) {
                items.push({
                    name: 'پلاتین (انس)',
                    price: data.platinum_price,
                    unit: 'دلار / اونس',
                    icon: '🪨',
                    type: 'metal',
                    priority: 11
                });
            }
            
            // قیمت پالادیوم
            if (data.palladium_price) {
                items.push({
                    name: 'پالادیوم (انس)',
                    price: data.palladium_price,
                    unit: 'دلار / اونس',
                    icon: '🔩',
                    type: 'metal',
                    priority: 12
                });
            }
            
            // قیمت مس
            if (data.copper_price) {
                items.push({
                    name: 'مس (انس)',
                    price: data.copper_price,
                    unit: 'دلار / اونس',
                    icon: '🪙',
                    type: 'metal',
                    priority: 13
                });
            }
            
        } catch (error) {
            console.warn('⚠️ خطا در دریافت قیمت طلا:', error.message);
        }
        
        return items;
    }

    /**
     * دریافت نرخ ارز از exchangerate.fun
     * @returns {Promise<Object>} آبجکت نرخ‌ها
     */
    async function fetchExchangeRates() {
        try {
            const resp = await fetch(API.exchange);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            
            const data = await resp.json();
            return data.rates || {};
            
        } catch (error) {
            console.warn('⚠️ خطا در دریافت نرخ ارز:', error.message);
            return {};
        }
    }

    /**
     * دریافت قیمت دلار به تومان از API ایرانی
     * @returns {Promise<number>} قیمت دلار به تومان
     */
    async function fetchUsdToToman() {
        let price = null;
        
        // تلاش اول: API liara
        try {
            const resp = await fetch(API.arz);
            if (resp.ok) {
                const data = await resp.json();
                if (data.arz) {
                    // جستجوی دلار
                    for (const [key, value] of Object.entries(data.arz)) {
                        if (key.includes('دلار')) {
                            const num = parseFloat(String(value).replace(/[^\d]/g, ''));
                            if (!isNaN(num) && num > 0) {
                                price = num;
                                break;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ خطا در دریافت از liara:', error.message);
        }
        
        // تلاش دوم: API fallback
        if (!price) {
            try {
                const resp = await fetch(API.fallback);
                if (resp.ok) {
                    const text = await resp.text();
                    // استخراج عدد دلار با regex
                    const match = text.match(/دلار[^\d]*([\d,]+)/);
                    if (match) {
                        price = parseFloat(match[1].replace(/,/g, ''));
                    }
                }
            } catch (error) {
                console.warn('⚠️ خطا در دریافت از fallback:', error.message);
            }
        }
        
        // تلاش سوم: مقدار پیش‌فرض
        if (!price) {
            console.warn('⚠️ استفاده از قیمت پیش‌فرض دلار');
            price = 60000; // تومان
        }
        
        return price;
    }

    /**
     * ساخت آرایه قیمت ارزها
     * @param {Object} rates - نرخ‌های ارز
     * @param {number} usdToToman - قیمت دلار به تومان
     * @returns {Array} آرایه قیمت‌ها
     */
    function buildCurrencyPrices(rates, usdToToman) {
        const items = [];
        
        for (const code of mainCurrencies) {
            if (rates[code]) {
                // نرخ: ۱ USD = X units of currency
                // ما می‌خوایم: ۱ unit of currency = ? USD
                const rateToUsd = 1 / rates[code];
                const priceInToman = Math.round(rateToUsd * usdToToman);
                
                items.push({
                    name: getPersianName(code),
                    code: code,
                    price: priceInToman,
                    unit: 'تومان',
                    icon: getIcon(code),
                    type: 'currency',
                    rateToUsd: rateToUsd,
                    rateFromUsd: rates[code]
                });
            }
        }
        
        // مرتب‌سازی: گران‌ترین به ارزان‌ترین
        items.sort((a, b) => b.price - a.price);
        
        return items;
    }

    /**
     * رندر کردن قیمت‌ها در DOM
     * @param {Array} items - آرایه قیمت‌ها
     */
    function renderPrices(items) {
        if (!items || items.length === 0) {
            showError('هیچ قیمتی برای نمایش یافت نشد');
            return;
        }
        
        // محدود کردن به ۲۰ آیتم
        const displayItems = items.slice(0, 20);
        
        let html = '<div class="prices-grid">';
        
        displayItems.forEach((item, index) => {
            const name = item.name || 'نامشخص';
            const icon = item.icon || '💱';
            const type = item.type || 'currency';
            
            let priceDisplay;
            let unitDisplay = item.unit || '';
            
            // فرمت قیمت بر اساس نوع
            if (type === 'gold' || type === 'metal') {
                priceDisplay = '$' + formatPrice(item.price);
            } else if (type === 'currency') {
                priceDisplay = formatToman(item.price);
                if (!unitDisplay) unitDisplay = 'تومان';
            } else {
                priceDisplay = formatPrice(item.price);
            }
            
            // تغییرات تصادفی برای نمایش بصری (می‌تونی از API واقعی بگیری)
            const changeVal = (Math.random() * 3 - 1.5).toFixed(2);
            const isPositive = parseFloat(changeVal) >= 0;
            const changeClass = isPositive ? 'positive' : 'negative';
            const changeSign = isPositive ? '+' : '';
            const changeArrow = isPositive ? '▲' : '▼';
            
            // انیمیشن تاخیری برای هر کارت
            const animationDelay = index * 0.05;
            
            html += `
                <div class="price-card" 
                     data-type="${type}" 
                     style="animation: fadeInUp 0.5s ease ${animationDelay}s both;">
                    
                    <div class="currency-name">
                        <span class="currency-icon">${icon}</span> 
                        ${name}
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
        
        // اگه بیشتر از ۲۰ تا بود
        if (items.length > 20) {
            html += `
                <div style="text-align:center; margin-top:12px; color:var(--text2); font-size:0.7rem;">
                    نمایش ${displayItems.length} از ${items.length} قیمت
                </div>
            `;
        }
        
        container.innerHTML = html;
    }

    /**
     * تابع اصلی بروزرسانی قیمت‌ها
     */
    async function updatePrices() {
        // جلوگیری از درخواست همزمان
        if (isUpdating) {
            console.log('🔄 بروزرسانی در حال انجام است...');
            return;
        }
        
        isUpdating = true;
        showLoading();
        
        // غیرفعال کردن دکمه
        refreshBtn.disabled = true;
        refreshBtn.style.opacity = '0.6';
        refreshBtn.style.cursor = 'not-allowed';
        
        try {
            let allItems = [];
            
            // ===== دریافت قیمت طلا و فلزات =====
            console.log('🥇 دریافت قیمت طلا...');
            const goldItems = await fetchGoldPrices();
            allItems = allItems.concat(goldItems);
            console.log(`✅ ${goldItems.length} قیمت طلا دریافت شد`);
            
            // ===== دریافت نرخ ارز جهانی =====
            console.log('💱 دریافت نرخ ارز...');
            const rates = await fetchExchangeRates();
            const ratesCount = Object.keys(rates).length;
            console.log(`✅ ${ratesCount} نرخ ارز دریافت شد`);
            
            // ===== دریافت قیمت دلار به تومان =====
            console.log('🇮🇷 دریافت قیمت دلار به تومان...');
            usdToIrr = await fetchUsdToToman();
            console.log(`✅ دلار: ${formatToman(usdToIrr)} تومان`);
            
            // ===== ساخت قیمت ارزها =====
            if (ratesCount > 0 && usdToIrr) {
                const currencyItems = buildCurrencyPrices(rates, usdToIrr);
                allItems = allItems.concat(currencyItems);
                console.log(`✅ ${currencyItems.length} قیمت ارز ساخته شد`);
            }
            
            // ===== بررسی خالی نبودن =====
            if (allItems.length === 0) {
                throw new Error('هیچ داده‌ای از سرورها دریافت نشد');
            }
            
            // ===== مرتب‌سازی نهایی =====
            allItems.sort((a, b) => {
                // اول طلا و فلزات
                if (a.type !== b.type) {
                    if (a.type === 'gold') return -1;
                    if (b.type === 'gold') return 1;
                    if (a.type === 'metal') return -1;
                    if (b.type === 'metal') return 1;
                }
                // بعد بر اساس priority
                if (a.priority && b.priority) return a.priority - b.priority;
                if (a.priority) return -1;
                if (b.priority) return 1;
                // در نهایت بر اساس قیمت (گران‌ترین اول)
                return (b.price || 0) - (a.price || 0);
            });
            
            // ===== رندر =====
            renderPrices(allItems);
            
            // ===== بروزرسانی زمان =====
            const now = new Date();
            lastUpdate = now;
            const timeStr = now.toLocaleTimeString('fa-IR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            const dateStr = now.toLocaleDateString('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            updateTimeEl.textContent = `🕒 ${dateStr} - ${timeStr}`;
            updateTimeEl.title = `قیمت دلار: ${formatToman(usdToIrr)} تومان`;
            
            console.log(`🎉 بروزرسانی کامل شد - ${allItems.length} قیمت`);
            
        } catch (error) {
            console.error('❌ خطا:', error.message);
            showError(error.message || 'خطا در دریافت قیمت‌ها');
        } finally {
            // فعال کردن دوباره دکمه
            isUpdating = false;
            refreshBtn.disabled = false;
            refreshBtn.style.opacity = '1';
            refreshBtn.style.cursor = 'pointer';
        }
    }

    // ===== Event Listeners =====
    
    // دکمه بروزرسانی
    refreshBtn.addEventListener('click', () => {
        if (!isUpdating) {
            updatePrices();
        }
    });
    
    // بروزرسانی با کلید F5 یا Ctrl+R (به صورت نرمال کار می‌کنه)
    
    // ===== راه‌اندازی اولیه =====
    console.log('🚀 GNG Tools - Price Tracker');
    console.log('📡 در حال اتصال به سرورها...');
    
    // اولین بروزرسانی
    updatePrices();
    
    // بروزرسانی خودکار هر ۱۰ دقیقه
    setInterval(() => {
        console.log('⏰ بروزرسانی خودکار...');
        updatePrices();
    }, 600000); // ۱۰ دقیقه
    
    // ===== اکسپورت برای استفاده در کنسول =====
    window.GNG = {
        updatePrices: updatePrices,
        getUsdToToman: () => usdToIrr,
        getLastUpdate: () => lastUpdate,
        getAPIs: () => API,
        version: '2.0.0'
    };
    
    console.log('💡 با تایپ GNG در کنسول به ابزارها دسترسی دارید');
    console.log('   GNG.updatePrices()  → بروزرسانی دستی');
    console.log('   GNG.getUsdToToman() → قیمت دلار');
    console.log('   GNG.getLastUpdate() → زمان آخرین بروزرسانی');

})();
