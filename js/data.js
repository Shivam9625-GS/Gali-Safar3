// ==========================================
// 🗄️ GLOBAL STATE VARIABLES (CART & MODES)
// ==========================================
let cartMode = 'normal';
let realMultiCart = []; 
let scheduleCarts = { Daily: [], Monthly: [] }; 
let activeSubType = ""; 
let activeScheduleVendor = null;
let scheduleDuration = { Daily: 7, Monthly: 3 };

// ==========================================
// 👤 USER DATABASE & PROFILE STATE (GALI-SAFAR)
// ==========================================
let currentUser = { 
    phone: "8700431787",
    name: "Shivam", 
    address: "Delhi, 110035",
    photo: null,
    khataStatus: "unlinked",
    khataPending: 0,
    khataBalances: { "Sharma Store": 0 }, // 🚀 SYNC: Sharma Store ka default khata active hai
    khataRequests: {}, 
    khataHistory: [],
    orderHistory: [],
    coins: 112,
    lifetimeCoins: 136,
    totalOrdersPlaced: 5,
    blockWins: 0,
    scratchCards: [], 
    isGali50Used: false,
    vipPassActive: false,
    activeOrder: null,
    lastOrderShop: null,
    consecutiveOrders: 0,
    referralCode: "GS_SHIVAM20", // 🚀 SYNC: Rebranded to Gali-Safar (GS)
    savedVendors: ['s1'], 
    savedItems: ['s1', 'r2'], 
    weeklySpend: 0 
};

// ==========================================
// 💾 DATA PERSISTENCE (SMART LOCAL STORAGE)
// ==========================================
function saveState() {
    // 🚀 SYNC: Fully migrated to Gali-Safar keys
    localStorage.setItem('galiSafarUser', JSON.stringify(currentUser));
    localStorage.setItem('galiSafarCart', JSON.stringify(realMultiCart));
    localStorage.setItem('galiSafarCartMode', cartMode);
    localStorage.setItem('galiSafarSchedules', JSON.stringify(scheduleCarts));
}

function loadState() {
    // Load from Gali-Safar first, fallback to old Gali-Mart keys if updating
    let savedUser = localStorage.getItem('galiSafarUser') || localStorage.getItem('galiMartUser');
    if(savedUser) currentUser = JSON.parse(savedUser);

    let savedCart = localStorage.getItem('galiSafarCart') || localStorage.getItem('galiMartCart');
    if(savedCart) realMultiCart = JSON.parse(savedCart);

    let savedMode = localStorage.getItem('galiSafarCartMode') || localStorage.getItem('galiMartCartMode');
    if(savedMode) cartMode = savedMode;

    let savedSchedules = localStorage.getItem('galiSafarSchedules') || localStorage.getItem('galiMartSchedules');
    if(savedSchedules) scheduleCarts = JSON.parse(savedSchedules);

    if(!currentUser.khataRequests) currentUser.khataRequests = {};
    if(typeof currentUser.blockWins === 'undefined') currentUser.blockWins = 0;
    if(!currentUser.savedVendors) currentUser.savedVendors = [];
    if(!currentUser.savedItems) currentUser.savedItems = [];
    if(typeof currentUser.vipPassActive === 'undefined') currentUser.vipPassActive = false;
    if(typeof currentUser.weeklySpend === 'undefined') currentUser.weeklySpend = 0;
    
    // Auto-update old referral codes to new Gali-Safar format
    if(currentUser.referralCode && currentUser.referralCode.startsWith("GM_")) {
        currentUser.referralCode = currentUser.referralCode.replace("GM_", "GS_");
    }
}

// ==========================================
// 🎁 DYNAMIC PROMO BANNERS
// ==========================================
const promoBanners = [
    {
        id: 'b1',
        title: "FLAT ₹50 OFF",
        sub: "On your first order! Don't miss out.",
        code: "GALI50",
        type: "code",
        bg: "linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)",
        text: "#b91c1c",
        emoji: "🎉"
    },
    {
        id: 'b2',
        title: "3 FREE DELIVERIES",
        sub: "First 3 orders (< 500m shops)",
        code: "Auto-Applied ✅",
        type: "auto",
        bg: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
        text: "#1e3a8a",
        emoji: "🛵"
    }
];

// ==========================================
// 🏪 SHOPS DATA (MOCK VENDORS) - 🚀 LOCAL IMAGES
// ==========================================
const shopsData = [
    { id: 's1', name: "Sharma Store", ownerName: "Ramesh Sharma", img: "images/shop1.jpg", rating: "4.8", dist: "200", delivery: true, pickup: true, looseItems: true, offset: 0, minOrder: 149, delCharge: 20, isOpen: true, openTime: "06:00", closeTime: "19:00" },
    { id: 's2', name: "Gupta Kirana Mart", ownerName: "Vikas Gupta", img: "images/shop2.jpg", rating: "4.5", dist: "450", delivery: false, pickup: true, looseItems: false, offset: -2, minOrder: 99, delCharge: 10, isOpen: true, openTime: "09:00", closeTime: "23:00" },
    { id: 's3', name: "Aggarwal Mart", ownerName: "Suresh Aggarwal", img: "images/shop3.jpg", rating: "4.2", dist: "800", delivery: true, pickup: true, looseItems: false, offset: 5, minOrder: 200, delCharge: 30, isOpen: false, openTime: "08:00", closeTime: "22:00" },
    { id: 's4', name: "Delhi Dairy", ownerName: "Rahul Dairy Wale", img: "images/shop4.jpg", rating: "4.9", dist: "100", delivery: true, pickup: true, looseItems: false, offset: 0, minOrder: 50, delCharge: 15, isOpen: true, openTime: "05:00", closeTime: "23:00" }
];

function resolveImageUrl(src, fallbackLabel = '🛒') {
    if (!src || typeof src !== 'string') return safeImagePlaceholder(fallbackLabel);
    if (src.startsWith('data:') || src.startsWith('blob:')) return src;
    if (/^https?:\/\//i.test(src)) return src;
    if (src.startsWith('images/') || src.includes('/images/') || src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.png') || src.endsWith('.webp')) {
        const label = (fallbackLabel || '🛒').trim() || '🛒';
        return safeImagePlaceholder(label);
    }
    return src;
}

function normalizeImagesInCollection(collection, fallbackKey = 'name') {
    if (!Array.isArray(collection)) return collection;
    collection.forEach((entry) => {
        if (!entry || typeof entry !== 'object') return;
        const fallbackLabel = entry[fallbackKey] || entry.name || entry.id || '🛒';
        if (entry.img) entry.img = resolveImageUrl(entry.img, fallbackLabel);
    });
    return collection;
}

// Generates some extra dummy shops
for(let i=5; i<=15; i++) {
    shopsData.push({
        id: 's'+i,
        name: `Local Store ${i}`,
        ownerName: `Owner ${i}`,
        img: `images/shop_generic.jpg`, 
        rating: (Math.random() * (5 - 3) + 3).toFixed(1),
        dist: (Math.floor(Math.random() * 2000) + 100).toString(),
        delivery: true,
        pickup: true,
        looseItems: i%2===0,
        offset: Math.floor(Math.random()*10),
        minOrder: 100,
        delCharge: 15,
        isOpen: i%5!==0,
        openTime: "08:00",
        closeTime: "22:00"
    });
}

normalizeImagesInCollection(shopsData, 'name');

// ==========================================
// 📦 MASTER INVENTORY (PRODUCTS) - 🚀 LOCAL IMAGES
// ==========================================
const masterInventory = [
    { id: 'egg_01', cat: 'fresh', name: "Farm Fresh Eggs", keywords: ["egg", "anda", "aanda"], basePrice: 60, rating: "4.8", loose: true, isPieceBased: true, img: "images/eggs.jpg" },
    { id: 'ban_01', cat: 'fresh', name: "Banana (Kela)", keywords: ["banana", "kela", "fruit"], basePrice: 40, rating: "4.5", loose: true, isPieceBased: true, img: "images/banana.jpg" },
    { id: 'lem_01', cat: 'fresh', name: "Fresh Lemon (Nimbu)", keywords: ["lemon", "nimbu", "fresh"], basePrice: 30, rating: "4.6", loose: true, isPieceBased: true, img: "images/lemon.jpg" },
    { id: 'l1', cat: 'ration', name: "Khula Aata (Loose 1kg)", keywords: ["ata", "aata", "atta", "khula", "loose"], basePrice: 35, rating: "4.5", loose: true, img: "images/loose_atta.jpg" },
    { id: 'l2', cat: 'ration', name: "Khuli Maida (1kg)", keywords: ["maida", "khula", "loose", "momos"], basePrice: 40, rating: "4.6", loose: true, img: "images/loose_maida.jpg" },
    { id: 'l3', cat: 'ration', name: "Khuli Chini (Sugar 1kg)", keywords: ["chini", "sugar", "cheeni", "khula", "loose"], basePrice: 42, rating: "4.7", loose: true, img: "images/loose_sugar.jpg" },
    { id: 'l4', cat: 'ration', name: "Safed Chhole (Loose 1kg)", keywords: ["chhole", "chana", "kabuli", "khula", "loose"], basePrice: 130, rating: "4.8", loose: true, img: "images/loose_chhole.jpg" },
    { id: 'l5', cat: 'ration', name: "Loose Refined Oil (1L)", keywords: ["oil", "tel", "refined", "khula", "loose"], basePrice: 110, rating: "4.5", loose: true, img: "images/loose_oil.jpg" },
    { id: 'r1', cat: 'ration', name: "Aashirvaad Atta (5kg)", keywords: ["ata", "aata", "atta"], basePrice: 220, rating: "4.8", loose: false, img: "images/aashirvaad_atta.jpg" },
    { id: 'r2', cat: 'ration', name: "Tata Toor Daal (1kg)", keywords: ["dal", "daal"], basePrice: 160, rating: "4.9", loose: false, img: "images/tata_dal.jpg" },
    { id: 'r4', cat: 'ration', name: "Fortune Sunflower Oil (5L)", keywords: ["oil", "tel", "fortune", "5l"], basePrice: 720, rating: "4.6", loose: false, img: "images/fortune_oil.jpg" },
    { id: 'd1', cat: 'dairy', name: "Amul Full Cream (1L)", keywords: ["milk", "dudh", "doodh"], basePrice: 68, rating: "4.9", loose: false, img: "images/amul_milk.jpg" },
    { id: 's1', cat: 'snacks', name: "Maggi Noodles", keywords: ["maggi"], basePrice: 14, rating: "4.8", loose: false, img: "images/maggi.jpg" },
    { id: 'f1', cat: 'fresh', name: "Aloo (Potato) 1kg", keywords: ["aloo", "potato", "sabzi"], basePrice: 30, rating: "4.5", loose: true, img: "images/aloo.jpg" },
    { id: 'f2', cat: 'fresh', name: "Pyaaz (Onion) 1kg", keywords: ["pyaaz", "onion", "sabzi"], basePrice: 40, rating: "4.6", loose: true, img: "images/onion.jpg" }
];

const preMadeKits = {
    basicFamily: [
        { id: 'r1', name: "Aashirvaad Atta (5kg)", basePrice: 220, unit: "Kg" },
        { id: 'l3', name: "Khuli Chini (Sugar 1kg)", basePrice: 42, unit: "Kg" },
        { id: 'r2', name: "Tata Toor Daal (1kg)", basePrice: 160, unit: "Kg" },
        { id: 'r4', name: "Fortune Sunflower Oil (5L)", basePrice: 720, unit: "L" }
    ]
};

// Generates some extra dummy items for testing
const categoriesList = ['ration', 'dairy', 'snacks', 'spices', 'cleaning'];
const randomNames = ["Patanjali Atta", "Lipton Corn Flakes", "Britannia Good Day", "Lays Blue", "Amul Butter", "Mother Dairy Paneer", "Haldiram Bhujia", "Surf Excel", "Colgate", "MDH Garam Masala", "Catch Jeera Powder", "Everest Red Chilli", "Premium Toor Dal", "Unpolished Chana Dal", "Saffola Gold Oil"];

for(let i = 11; i <= 60; i++) {
    masterInventory.push({
        id: 'gen' + i,
        cat: categoriesList[i % 5],
        name: randomNames[i % randomNames.length] + " " + i,
        keywords: ["item", "special"],
        basePrice: Math.floor(Math.random() * 200) + 10,
        rating: "4." + (Math.floor(Math.random() * 5) + 3),
        loose: i % 3 === 0,
        img: `images/item_generic.jpg` 
    });
}

normalizeImagesInCollection(masterInventory, 'name');

// INSTAMART STYLE HIERARCHY DATA - 🚀 LOCAL IMAGES
const genericCategories = {
    fresh: [
        { name: "Fresh Vegetables", term: "Veg", img: "images/cat_veg.jpg" },
        { name: "Fresh Fruits", term: "Fruit", img: "images/cat_fruits.jpg" },
        { name: "Dairy & Milk", term: "Milk", img: "images/cat_dairy.jpg" },
        { name: "Farm Eggs", term: "Egg", img: "images/cat_eggs.jpg" }
    ],
    grocery: [
        { name: "Atta, Rice & Dal", term: "Atta", img: "images/cat_atta.jpg" },
        { name: "Masalas & Spices", term: "Masala", img: "images/cat_spices.jpg" },
        { name: "Oils & Ghee", term: "Oil", img: "images/cat_oil.jpg" },
        { name: "Cereals & Breakfast", term: "Cereal", img: "images/cat_cereal.jpg" }
    ],
    snacks: [
        { name: "Cold Drinks", term: "Drink", img: "images/cat_drinks.jpg" },
        { name: "Ice Cream", term: "Ice cream", img: "images/cat_icecream.jpg" },
        { name: "Chips & Namkeen", term: "Chips", img: "images/cat_chips.jpg" },
        { name: "Chocolates", term: "Chocolate", img: "images/cat_choco.jpg" },
        { name: "Biscuits & Cakes", term: "Biscuit", img: "images/cat_biscuit.jpg" },
        { name: "Tea & Coffee", term: "Tea", img: "images/cat_tea.jpg" },
        { name: "Noodles & Pasta", term: "Noodles", img: "images/cat_noodles.jpg" },
        { name: "Dry Fruits", term: "Dry Fruit", img: "images/cat_dryfruits.jpg" }
    ],
    beauty: [
        { name: "Hair Care", term: "Hair", img: "images/cat_hair.jpg" },
        { name: "Skin Care", term: "Skin", img: "images/cat_skin.jpg" },
        { name: "Makeup", term: "Makeup", img: "images/cat_makeup.jpg" },
        { name: "Baby Care", term: "Baby", img: "images/cat_baby.jpg" }
    ],
    lifestyle: [
        { name: "Cleaners", term: "Clean", img: "images/cat_clean.jpg" },
        { name: "Soaps & Wash", term: "Soap", img: "images/cat_soap.jpg" },
        { name: "Stationery", term: "Pen", img: "images/cat_pen.jpg" },
        { name: "Sports", term: "Sport", img: "images/cat_sport.jpg" }
    ]
};

Object.values(genericCategories).forEach((items) => normalizeImagesInCollection(items, 'name'));

// ==========================================
// 🪙 UI HELPERS (COIN & PROFILE SYNC)
// ==========================================
function updateCoinsUI() {
    let balEl = document.getElementById('top-coin-balance');
    let kBalEl = document.getElementById('khata-coin-balance');
    let availEl = document.getElementById('coins-available');
    let rupeeEl = document.getElementById('coins-rupee-value');
    let lifeEl = document.getElementById('coins-lifetime');
    
    // 🚀 SYNC: Profile Page Elements synced here directly
    let profileCoinEl = document.getElementById('profile-coin-val');
    let scratchedCountEl = document.getElementById('coins-scratched-count');
    
    if(balEl) balEl.innerText = currentUser.coins;
    if(kBalEl) kBalEl.innerText = currentUser.coins;
    if(availEl) availEl.innerText = currentUser.coins;
    if(rupeeEl) rupeeEl.innerText = currentUser.coins;
    if(lifeEl) lifeEl.innerText = currentUser.lifetimeCoins;
    
    if(profileCoinEl) profileCoinEl.innerHTML = `🪙 ${currentUser.coins}`;
    
    if(scratchedCountEl && currentUser.scratchCards) {
        scratchedCountEl.innerText = currentUser.scratchCards.filter(c => c.status === 'scratched').length;
    }
}

// Ensure state is loaded instantly when this file executes
loadState();

function safeImagePlaceholder(label = '🛒') {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
            <defs>
                <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stop-color="#fff7ed"/>
                    <stop offset="100%" stop-color="#fed7aa"/>
                </linearGradient>
            </defs>
            <rect width="120" height="120" rx="18" fill="url(#g)"/>
            <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-size="42" fill="#c2410c">${label}</text>
        </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function bindImageFallbacks(root = document) {
    const images = root.querySelectorAll ? root.querySelectorAll('img') : [];
    images.forEach((img) => {
        if (!img || img.dataset.fallbackBound === 'true') return;
        img.dataset.fallbackBound = 'true';

        const src = img.getAttribute('src');
        const fallbackLabel = img.getAttribute('alt') || img.dataset.fallbackLabel || '🛒';
        if (!src || src.startsWith('data:')) return;

        img.onerror = function() {
            this.onerror = null;
            this.src = safeImagePlaceholder(fallbackLabel);
            this.style.objectFit = 'contain';
        };
    });
}

document.addEventListener('error', function(event) {
    const target = event.target;
    if (!target || target.tagName !== 'IMG' || target.dataset.fallbackApplied === 'true') return;

    target.dataset.fallbackApplied = 'true';
    const fallbackLabel = target.getAttribute('alt') || target.dataset.fallbackLabel || '🛒';
    target.src = safeImagePlaceholder(fallbackLabel);
    target.style.objectFit = 'contain';
}, true);

window.addEventListener('load', function() {
    bindImageFallbacks();
});
