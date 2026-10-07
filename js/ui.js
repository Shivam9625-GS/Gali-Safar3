// ==========================================
// 🧭 1. SMART NAVIGATION & GLOBAL UTILS
// ==========================================
let navHistory = ['screen-home'];
let currentOpenShopId = null;

function vibe() { if (navigator.vibrate) navigator.vibrate(40); }

function showToast(msg) {
    let toast = document.getElementById("toast");
    if(!toast) return;
    toast.innerText = msg;
    toast.classList.add("show");
    setTimeout(() => { toast.classList.remove("show"); }, 2000);
}

function updateGreeting() {
    let msgEl = document.getElementById('welcome-msg');
    let nameEl = document.getElementById('display-name');
    let phoneEl = document.getElementById('display-phone');
    
    if(msgEl && currentUser.name) msgEl.innerText = `Hello, ${currentUser.name.split(' ')[0]} 👋`;
    if(nameEl) nameEl.innerText = currentUser.name || "Your Account";
    if(phoneEl) phoneEl.innerText = currentUser.phone;
}

// ==========================================
// 🔒 2. PROFILE UI & SETTINGS
// ==========================================
function logoutUser() {
    vibe();
    if(confirm("Are you sure you want to log out?")) {
        localStorage.clear();
        location.reload();
    }
}

function goBackToPhoneInput() {
    vibe();
    document.getElementById('login-step-2').style.display = 'none';
    document.getElementById('login-step-1').style.display = 'block';
}

function openEditProfileModal() {
    vibe();
    let modal = document.getElementById('modal-edit-profile');
    if(modal) {
        modal.style.display = 'flex';
        document.getElementById('edit-name').value = currentUser.name;
        document.getElementById('edit-phone').value = currentUser.phone;
        document.getElementById('edit-address').value = currentUser.address;
    }
}

function saveProfileChanges() {
    vibe();
    let name = document.getElementById('edit-name').value.trim();
    let address = document.getElementById('edit-address').value.trim();

    if(name === "" || address === "") return alert("Naam aur Address khali nahi chhod sakte!");

    currentUser.name = name;
    currentUser.address = address;
    saveState();
    updateGreeting();

    let locHeader = document.getElementById('header-loc');
    if(locHeader) locHeader.innerHTML = `📍 ${address.substring(0, 15)}... ✏️`;

    document.getElementById('modal-edit-profile').style.display = 'none';
    showToast("Profile Updated! ✅");
}

function toggleAppTheme() {
    vibe();
    let cb = document.getElementById('theme-checkbox');
    let statusText = document.getElementById('theme-status-text');
    if(cb.checked) {
        document.body.classList.add('dark-mode');
        if(statusText) statusText.innerText = "DARK";
        localStorage.setItem('galiSafarTheme', 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        if(statusText) statusText.innerText = "LIGHT";
        localStorage.setItem('galiSafarTheme', 'light');
    }
}

function updateProfilePicDirectly(event) {
    let file = event.target.files[0];
    if(!file) return;
    let reader = new FileReader();
    reader.onload = function(e) {
        currentUser.photo = e.target.result;
        saveState();
        initProfilePic();
        showToast("Profile Picture Updated! 📸");
    };
    reader.readAsDataURL(file);
}

function initProfilePic() {
    if(currentUser && currentUser.photo) {
        let img = document.getElementById('profile-avatar-img');
        let icon = document.getElementById('profile-avatar-icon');
        let homeImg = document.getElementById('home-profile-pic');
        if(img) { img.src = currentUser.photo; img.style.display = 'block'; }
        if(icon) icon.style.display = 'none';
        if(homeImg) {
            homeImg.innerHTML = `<img src="${currentUser.photo}" style="width:100%; height:100%; object-fit:cover;">`;
        }
    }
}

(function initTheme() {
    let savedTheme = localStorage.getItem('galiSafarTheme') || localStorage.getItem('galiMartTheme');
    let cb = document.getElementById('theme-checkbox');
    let statusText = document.getElementById('theme-status-text');
    if(savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if(cb) cb.checked = true;
        if(statusText) statusText.innerText = "DARK";
    }
})();

// ==========================================
// 📱 3. SCREEN ROUTING & HASH ENGINE
// ==========================================
window.addEventListener('hashchange', handleHashRouting);

function handleHashRouting() {
    let hash = window.location.hash.replace('#', '');
    let id = 'screen-' + hash;

    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = '';
    });

    let targetScreen = document.getElementById(id);
    if(targetScreen) {
        targetScreen.classList.add('active');
        targetScreen.style.display = 'block';
        targetScreen.scrollTop = 0;
    } else {
        let home = document.getElementById('screen-home');
        if(home) {
            home.classList.add('active');
            home.style.display = 'block';
        }
        id = 'screen-home';
        hash = 'home';
    }

    let floatCart = document.getElementById('floating-cart');
    let hideFloatScreens = ['screen-cart', 'screen-single-pay', 'screen-multi-pay', 'screen-success', 'screen-shop-menu', 'screen-category-split', 'screen-coins'];
    if(floatCart) {
        if(hideFloatScreens.includes(id)) floatCart.style.display = 'none';
        else if(typeof updateBadge === 'function') updateBadge();
    }

    let hideNavScreens = ['screen-login', 'screen-register', 'screen-single-pay', 'screen-cart', 'screen-daily-setup', 'screen-monthly-setup', 'screen-category-split', 'screen-all-shops', 'screen-parchi-verify', 'screen-parchi-route', 'screen-saved-items', 'screen-saved-vendors'];
    if(hideNavScreens.includes(id)) {
        let navBar = document.getElementById('nav-bar');
        if(navBar) navBar.style.display = 'none';
    } else {
        let navBar = document.getElementById('nav-bar');
        if(navBar) navBar.style.display = 'flex';
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        let navEl = document.getElementById('nav-' + hash);
        if(navEl) navEl.classList.add('active');
    }

    if(id === 'screen-home') renderHome();
    if(id === 'screen-all-shops') renderAllShops(shopsData);
    if(id === 'screen-cart' && typeof renderCart === 'function') renderCart();
    if(id === 'screen-search' && typeof renderTrending === 'function') renderTrending();
    if(id === 'screen-orders') {
        renderActiveOrder(); 
        if(typeof renderOrdersScreen === 'function') renderOrdersScreen('All');
    }
    if(id === 'screen-coins' && typeof renderCoinsScreen === 'function') renderCoinsScreen();
    if(id === 'screen-khata' && typeof updateKhataUI === 'function') updateKhataUI();
    if(id === 'screen-saved-items' && typeof renderSavedItemsScreen === 'function') renderSavedItemsScreen();
    if(id === 'screen-saved-vendors' && typeof renderSavedVendorsScreen === 'function') renderSavedVendorsScreen();
    
    if(id === 'screen-profile') {
        if(typeof updateCoinsUI === 'function') updateCoinsUI();
        if(typeof updateProfileBadges === 'function') updateProfileBadges();
        if(typeof updateProfileKhataUI === 'function') updateProfileKhataUI();
        
        let profileCoinEl = document.getElementById('profile-coin-val');
        if(profileCoinEl && typeof currentUser !== 'undefined') {
            profileCoinEl.innerHTML = `🪙 ${currentUser.coins}`;
        }
    }
}

function switchNav(id, el, isBack = false) {
    vibe();
    let hashName = id.replace('screen-', '');
    window.location.hash = '#' + hashName;
}

function goBack() {
    vibe();
    let openModals = document.querySelectorAll('.modal-overlay[style*="display: flex"]');
    if (openModals.length > 0) {
        openModals.forEach(m => m.style.display = 'none');
        return;
    }
    window.history.back();
}

function backFromSetup(type) {
    vibe();
    switchNav(type === 'Daily' ? 'screen-daily-dash' : 'screen-monthly-dash');
}

function renderActiveOrder() {
    let activeContainer = document.getElementById('active-order-tracking');
    if(!activeContainer) return;
    
    if(currentUser.activeOrder && currentUser.activeOrder.status !== 'Cancelled' && currentUser.activeOrder.status !== 'Delivered') {
        activeContainer.style.display = 'block';
        document.getElementById('active-order-shop').innerText = currentUser.activeOrder.shop;
        document.getElementById('active-order-total').innerText = '₹' + currentUser.activeOrder.total;
        document.getElementById('active-order-pay-type').innerText = currentUser.activeOrder.method;
        
        let itemsHtml = currentUser.activeOrder.items.map(i => `${i.qty}x ${i.name}`).join('<br>');
        document.getElementById('active-order-items').innerHTML = itemsHtml;
    } else {
        activeContainer.style.display = 'none';
    }
}

// ==========================================
// 🏠 4. HOME PAGE RENDERING & INFINITE SCROLL
// ==========================================
function updateBannerDots() {
    let container = document.getElementById('promo-banners-container');
    let dots = document.querySelectorAll('#banner-dots .dot');
    if(!container || dots.length === 0) return;

    let scrollPos = container.scrollLeft;
    let card = container.querySelector('.promo-card');
    if(!card) return;
    let cardWidth = card.offsetWidth;
    let activeIndex = Math.round(scrollPos / cardWidth);

    dots.forEach((dot, index) => {
        if(index === activeIndex) { dot.classList.add('active'); }
        else { dot.classList.remove('active'); }
    });
}

let currentHomeItemIndex = 0;
const ITEMS_PER_LOAD = 4;

function renderHome() {
    document.getElementById('home-shop-list').innerHTML = `<div class="shop-card skeleton" style="height: 140px; margin-right: 15px;"></div>`.repeat(4);

    if(typeof updateLoyaltyProgressUI === 'function') updateLoyaltyProgressUI();

    let loyaltyTracker = document.getElementById('loyalty-tracker-container');
    if (loyaltyTracker) loyaltyTracker.style.display = 'none';
    
    let instamartTabs = document.querySelector('.instamart-tabs');
    if (instamartTabs) instamartTabs.style.display = 'none';

    setTimeout(() => {
        let bannerHtml = "";
        promoBanners.forEach(b => {
            bannerHtml += `
            <div class="promo-card banner-img" style="background: ${b.bg}; border-radius: 16px; padding: 20px; position: relative; overflow: hidden; border:none; display:flex; flex-direction:column; justify-content:center;">
                <div style="position: absolute; right: -20px; top: -20px; font-size: 80px; opacity: 0.2;">${b.emoji}</div>
                <h3 style="font-size: 22px; font-weight: 900; color: ${b.text}; margin-bottom: 5px;">${b.title}</h3>
                <p style="font-size: 12px; color: ${b.text}; font-weight: 600; margin-bottom: 12px; opacity:0.8;">${b.sub}</p>
                <div style="background: white; display: inline-block; padding: 5px 12px; border-radius: 8px; font-weight: 800; font-size: 12px; border: 1px dashed ${b.text}; color: ${b.text}; width: max-content;">${b.code}</div>
            </div>`;
        });
        let bannerContainer = document.getElementById('promo-banners-container');
        if(bannerContainer) {
            bannerContainer.innerHTML = bannerHtml;
            bannerContainer.onscroll = updateBannerDots;
        }

        let shopHtml = "";
        shopsData.slice(0,5).forEach(shop => {
            let statusTag = shop.isOpen ? '' : `<span class="flash-tag tag-closed">🔴 CLOSED</span>`;
            
            let isVSaved = currentUser.savedVendors && currentUser.savedVendors.includes(shop.id);
            let vHeart = `<div class="heart-btn" onclick="event.stopPropagation(); toggleSavedVendor('${shop.id}', event)"><span class="heart-icon ${isVSaved ? 'saved' : ''}">${isVSaved ? '♥' : '♡'}</span></div>`;

            shopHtml += `<div class="shop-card ${shop.isOpen ? '' : 'closed'}" style="position:relative;" onclick="${shop.isOpen ? `openShop('${shop.id}')` : ''}">
                ${vHeart}
                <img src="${shop.img}" loading="lazy">
                <h4>${shop.name}</h4>
                <div class="tag-container" style="margin-bottom: 5px;">${statusTag} <span class="flash-tag tag-on">🛵 Delivery</span></div>
                <p style="font-size:10px; color:#64748b; margin-top:5px; font-weight:600;">📍 ${shop.dist}m away</p>
            </div>`;
        });
        document.getElementById('home-shop-list').innerHTML = shopHtml;

        const catMap = { 'grocery': 'home-grocery-grid', 'snacks': 'home-snacks-grid', 'beauty': 'home-beauty-grid', 'lifestyle': 'home-lifestyle-grid' };
        for(let key in catMap) {
            let el = document.getElementById(catMap[key]);
            if(el) {
                let html = "";
                if(genericCategories[key]) {
                    genericCategories[key].forEach(cat => { html += `<div class="category-block" onclick="openCategorySplit('${cat.name}')"><img src="${cat.img}" loading="lazy"><h4>${cat.name}</h4></div>`; });
                }
                el.innerHTML = html;
            }
        }

        currentHomeItemIndex = 0;
        let randomContainer = document.getElementById('home-random-items');
        if(randomContainer) {
            randomContainer.innerHTML = "";
            loadMoreHomeItems(); 
            loadMoreHomeItems(); 
        }

        let homeScreen = document.getElementById('screen-home');
        if(homeScreen) {
            homeScreen.removeEventListener('scroll', handleHomeScroll);
            homeScreen.addEventListener('scroll', handleHomeScroll);
        }

        if(typeof updateBadge === 'function') updateBadge();
    }, 400);
}

function handleHomeScroll() {
    let homeScreen = document.getElementById('screen-home');
    if(!homeScreen) return;
    
    if (homeScreen.scrollTop + homeScreen.clientHeight >= homeScreen.scrollHeight - 100) {
        loadMoreHomeItems();
    }
}

function loadMoreHomeItems() {
    let container = document.getElementById('home-random-items');
    if(!container) return;

    let itemsToLoad = masterInventory.slice(currentHomeItemIndex, currentHomeItemIndex + ITEMS_PER_LOAD);
    if(itemsToLoad.length === 0) return; 

    let randomHtml = "";
    itemsToLoad.forEach(item => {
        let mrp = Math.floor(item.basePrice * 1.15);
        let actionOnClick = `compareItem('${item.id}', 'screen-home')`;
        let isSaved = currentUser.savedItems && currentUser.savedItems.includes(item.id);
        let heartBtn = `<div class="heart-btn" onclick="event.stopPropagation(); toggleSavedItem('${item.id}', event)"><span class="heart-icon ${isSaved ? 'saved' : ''}">${isSaved ? '♥' : '♡'}</span></div>`;

        randomHtml += `<div class="bb-product-card" onclick="compareItem('${item.id}', 'screen-home')">
            ${heartBtn}
            <img src="${item.img}" class="bb-product-img" loading="lazy">
            <span class="bb-weight">${item.loose ? '1 kg' : '1 pc'}</span>
            <div class="bb-title">${item.name}</div>
            <div class="bb-price-row">
                <div class="bb-price-col"><span class="bb-price">₹${item.basePrice}</span><span class="bb-mrp">₹${mrp}</span></div>
                <button class="bb-add-btn" onclick="event.stopPropagation(); ${actionOnClick}">ADD</button>
            </div>
        </div>`;
    });

    container.innerHTML += randomHtml;
    currentHomeItemIndex += ITEMS_PER_LOAD;
}

// ==========================================
// 🏪 5. ALL SHOPS & SHOP INTERNAL MENU
// ==========================================
function renderAllShops(dataList) {
    let container = document.getElementById('all-shops-list');
    if(!container) return;
    let html = "";
    if(dataList.length === 0) { container.innerHTML = `<div style="text-align:center; padding:50px; color:#64748b;">Koi dukaan nahi mili.</div>`; return; }

    dataList.forEach(shop => {
        let statusTag = shop.isOpen ? '<span class="flash-tag tag-on" style="background:#16a34a; color:white;">OPEN NOW</span>' : '<span class="flash-tag tag-closed">CLOSED</span>';
        let looseTag = shop.looseItems ? '<span class="flash-tag tag-loose">🌾 LOOSE RATION</span>' : '';

        let superBadges = "";
        if(shop.offset <= 0) superBadges += `<span class="super-badge badge-sasti">💰 SASTI</span>`;
        if(parseInt(shop.dist) <= 200) superBadges += `<span class="super-badge badge-paas">⚡ PAAS</span>`;
        if(currentUser.khataRequests && currentUser.khataRequests[shop.name] === 'approved') superBadges += `<span class="super-badge badge-udhar">📒 UDHAR</span>`;

        let isVSaved = currentUser.savedVendors && currentUser.savedVendors.includes(shop.id);
        let vHeart = `<div class="heart-btn" onclick="event.stopPropagation(); toggleSavedVendor('${shop.id}', event)"><span class="heart-icon ${isVSaved ? 'saved' : ''}">${isVSaved ? '♥' : '♡'}</span></div>`;

        html += `<div class="vertical-shop-card ${shop.isOpen ? '' : 'closed'}" onclick="${shop.isOpen ? `openShop('${shop.id}')` : ''}" style="${!shop.isOpen ? 'opacity:0.6; filter:grayscale(1);' : ''}">
            ${vHeart}
            <img src="${shop.img}" loading="lazy">
            <div class="vertical-shop-info">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <h4>${shop.name}</h4>
                    <span style="font-size:11px; background:#fef3c7; color:#d97706; padding:2px 6px; border-radius:6px; font-weight:800;">⭐ ${shop.rating}</span>
                </div>
                <p>📍 ${shop.dist}m away • Min Order: ₹${shop.minOrder}</p>
                <div class="tag-container" style="margin-top:6px;">${statusTag} ${looseTag}</div>
                <div style="margin-top:6px; display:flex; gap:5px; flex-wrap:wrap;">${superBadges}</div>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function filterAllShops() {
    let term = document.getElementById('all-shops-search').value.toLowerCase();
    let filtered = shopsData.filter(s => s.name.toLowerCase().includes(term) || s.ownerName.toLowerCase().includes(term));
    renderAllShops(filtered);
}

function openShop(shopId) {
    vibe();
    let shop = shopsData.find(s => s.id === shopId);
    if(!shop) return;
    currentOpenShopId = shopId;

    let superBadges = "";
    if(shop.offset <= 0) superBadges += `<span class="super-badge badge-sasti">💰 SASTI</span>`;
    if(parseInt(shop.dist) <= 200) superBadges += `<span class="super-badge badge-paas">⚡ PAAS</span>`;
    if(currentUser.khataRequests && currentUser.khataRequests[shop.name] === 'approved') superBadges += `<span class="super-badge badge-udhar">📒 UDHAR</span>`;

    let isVSaved = currentUser.savedVendors && currentUser.savedVendors.includes(shop.id);
    let vHeart = `<div class="heart-btn" style="top: 15px; right: 15px; left: auto; background: rgba(0,0,0,0.5); color:white; border: 1px solid rgba(255,255,255,0.2);" onclick="event.stopPropagation(); toggleSavedVendor('${shop.id}', event)"><span class="heart-icon ${isVSaved ? 'saved' : ''}">${isVSaved ? '♥' : '♡'}</span></div>`;

    let headerHtml = `
        <div class="vendor-banner">
            ${vHeart}
            <img src="${shop.img}">
            <div class="vendor-overlay">
                <h2>${shop.name}</h2>
                <div style="margin-bottom:8px; display:flex; gap:5px; flex-wrap:wrap;">${superBadges}</div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <p>⭐ ${shop.rating} | 📍 ${shop.dist}m away</p>
                    <button style="background:rgba(255,255,255,0.2); border:1px solid white; color:white; padding:4px 10px; border-radius:20px; font-size:10px; font-weight:800; cursor:pointer;" onclick="openVendorProfile('${shop.id}')">View Info ℹ️</button>
                </div>
            </div>
        </div>`;

    document.getElementById('shop-menu-header-container').innerHTML = headerHtml;
    document.getElementById('shop-search').value = "";

    let shopScreen = document.getElementById('screen-shop-menu');
    if(shopScreen) shopScreen.scrollTop = 0;

    renderShopItems(masterInventory, shop);
    switchNav('screen-shop-menu');
}

function openVendorProfile(shopId) {
    vibe();
    let shop = shopsData.find(s => s.id === shopId);
    if(!shop) return;

    document.getElementById('vp-cover').src = shop.img;
    document.getElementById('vp-avatar').src = shop.img;
    document.getElementById('vp-rating').innerText = shop.rating;
    document.getElementById('vp-name').innerText = shop.name;
    document.getElementById('vp-address').innerText = `${shop.name}, Gali No. 4, Local Market (Distance: ${shop.dist}m)`;
    document.getElementById('vp-open').innerText = shop.openTime || "08:00 AM";
    document.getElementById('vp-close').innerText = shop.closeTime || "10:00 PM";

    document.getElementById('modal-vendor-profile').style.display = 'flex';
}

function renderShopItems(items, shop) {
    let container = document.getElementById('shop-menu-items');
    if(!container) return;

    let html = "";
    let validItems = items;
    if(!shop.looseItems) validItems = items.filter(i => !i.loose);

    if(validItems.length === 0) { container.innerHTML = "<div style='text-align:center; padding:30px; color:#64748b;'>No items match.</div>"; return; }

    validItems.forEach(item => {
        let finalPrice = item.basePrice + shop.offset;
        let cartItem = realMultiCart.find(c => (c.id === item.id || c.id.startsWith(item.id + "_")) && c.shop === shop.name);

        let actionBtn = "";
        if(cartItem) {
            actionBtn = `<div class="qty-controls"><button class="qty-btn" onclick="event.stopPropagation(); updateQty('${cartItem.id}', '${shop.name}', -1)">-</button><span>${cartItem.qty}</span><button class="qty-btn" onclick="event.stopPropagation(); updateQty('${cartItem.id}', '${shop.name}', 1)">+</button></div>`;
        } else {
            let actionOnClick = item.loose ? `openVariantSelection('${item.id}')` : `addToCart('${item.id}', '${item.name.replace(/'/g,"\\'")}', ${finalPrice}, '${shop.name}', '${item.img}')`;
            actionBtn = `<button class="add-to-cart-btn" onclick="event.stopPropagation(); flyToCart(event, '${item.img}'); ${actionOnClick}">ADD</button>`;
        }

        html += `<div class="menu-item-row" onclick="compareItem('${item.id}', 'screen-shop-menu')">
            <div style="display:flex; align-items:center; gap:15px; width:70%;">
                <img src="${item.img}" style="width:50px; height:50px; object-fit:contain; border-radius:8px; border:1px solid #f1f5f9; padding:2px;">
                <div style="flex:1;">
                    <h4 style="font-size:13px; font-weight:800; color:#1e293b; line-height:1.2; margin-bottom:4px;">${item.name}</h4>
                    <p style="font-size:13px; font-weight:800; color:var(--success);">₹${finalPrice}</p>
                    ${item.loose ? '<span class="loose-badge" style="margin-top:4px;">LOOSE ITEM</span>' : ''}
                </div>
            </div>
            ${actionBtn}
        </div>`;
    });
    container.innerHTML = html;
}

function filterShopMenu() {
    let term = document.getElementById('shop-search').value.toLowerCase();
    let shop = shopsData.find(s => s.id === currentOpenShopId);
    let filtered = masterInventory.filter(i => i.name.toLowerCase().includes(term) || (i.keywords && i.keywords.join(" ").toLowerCase().includes(term)));
    renderShopItems(filtered, shop);
}

// ==========================================
// 🔍 6. SEARCH, COMPARE & VARIANTS
// ==========================================
let searchTimeout;
function runSearch(e) {
    clearTimeout(searchTimeout);
    let term = e.target.value.toLowerCase().trim();

    searchTimeout = setTimeout(() => {
        let il = document.getElementById('search-item-list');
        let sg = document.getElementById('search-suggestions');
        let trendingSec = document.getElementById('trending-popular-section');
        let discoverSec = document.getElementById('discover-items-section');
        let compRes = document.getElementById('compare-results');
        let floatBtn = document.getElementById('floating-compare-btn');

        if(compRes) compRes.style.display = 'none';
        if(floatBtn) floatBtn.style.display = 'none';

        if(term === "") {
            if(sg) sg.style.display = 'block';
            if(trendingSec) trendingSec.style.display = 'block';
            if(discoverSec) discoverSec.style.display = 'block';
            if(il) il.style.display = 'none';
            return;
        }

        if(sg) sg.style.display = 'none';
        if(trendingSec) trendingSec.style.display = 'none';
        if(discoverSec) discoverSec.style.display = 'none';
        if(il) il.style.display = 'grid';

        let matchedItems = masterInventory.filter(item => {
            return item.name.toLowerCase().includes(term) || (item.keywords && item.keywords.join(" ").toLowerCase().includes(term));
        });

        if(matchedItems.length === 0) {
            il.innerHTML = `<div style="text-align:center; grid-column: 1/-1; padding:50px;"><h2 style="font-size:40px;">🔍</h2><p style="color:#64748b; font-weight:600;">No items found</p></div>`;
            return;
        }

        let html = '';
        matchedItems.forEach(item => {
            let mrp = Math.floor(item.basePrice * 1.15);
            let actionOnClick = item.loose ? `openVariantSelection('${item.id}')` : `addToCart('${item.id}', '${item.name.replace(/'/g,"\\'")}', ${item.basePrice}, shopsData[0].name, '${item.img}')`;
            
            let isSaved = currentUser.savedItems && currentUser.savedItems.includes(item.id);
            let heartBtn = `<div class="heart-btn" onclick="event.stopPropagation(); toggleSavedItem('${item.id}', event)"><span class="heart-icon ${isSaved ? 'saved' : ''}">${isSaved ? '♥' : '♡'}</span></div>`;

            html += `<div class="bb-product-card" onclick="compareItem('${item.id}', 'screen-search')">
                ${heartBtn}
                <img src="${item.img}" class="bb-product-img" loading="lazy">
                <span class="bb-weight">${item.loose ? '1 kg' : '1 pc'}</span>
                <div class="bb-title">${item.name}</div>
                <div class="bb-price-row">
                    <div class="bb-price-col"><span class="bb-price">₹${item.basePrice}</span><span class="bb-mrp">₹${mrp}</span></div>
                    <button class="bb-add-btn" onclick="event.stopPropagation(); flyToCart(event, '${item.img}'); ${actionOnClick}">ADD</button>
                </div>
            </div>`;
        });
        il.innerHTML = html;
    }, 300);
}

function fillSearch(term) {
    let inp = document.getElementById('main-search-input');
    if(inp) { inp.value = term; runSearch({target: inp}); }
}

function compareItem(itemId, sourceScreen) {
    vibe();
    let item = masterInventory.find(i => i.id === itemId);
    if(!item) return;

    let sg = document.getElementById('search-suggestions');
    let trend = document.getElementById('trending-popular-section');
    let discoverSec = document.getElementById('discover-items-section');
    let il = document.getElementById('search-item-list');
    let cr = document.getElementById('compare-results');
    let inp = document.getElementById('main-search-input');
    let floatBtn = document.getElementById('floating-compare-btn');

    if(sg) sg.style.display = 'none';
    if(trend) trend.style.display = 'none';
    if(discoverSec) discoverSec.style.display = 'none';
    if(il) il.style.display = 'none';
    if(cr) cr.style.display = 'block';
    
    if(floatBtn) floatBtn.style.display = 'none';
    
    if(inp) inp.value = item.name;

    if(sourceScreen !== 'screen-search') switchNav('screen-search');

    renderCompareResults(item);
}

function renderCompareResults(item) {
    let container = document.getElementById('compare-results');
    if(!container) return;

    let validShops = shopsData;
    if(item.loose) validShops = shopsData.filter(s => s.looseItems);

    let prices = validShops.map(s => ({ shop: s, finalPrice: item.basePrice + s.offset }));
    prices.sort((a,b) => a.finalPrice - b.finalPrice);

    let html = `<div style="padding: 0 20px 10px;">
        <div style="display:flex; gap:15px; align-items:center; background:white; padding:15px; border-radius:16px; border:1px solid #e2e8f0;">
            <img src="${item.img}" style="width:60px; height:60px; object-fit:contain;">
            <div><h3 style="font-size:14px; font-weight:800; color:#1e293b;">${item.name}</h3><p style="font-size:11px; color:#64748b; margin-top:4px;">Prices across ${prices.length} nearby shops</p></div>
        </div>
    </div>`;

    prices.forEach((p, index) => {
        let cartItem = realMultiCart.find(c => (c.id === item.id || c.id.startsWith(item.id + "_")) && c.shop === p.shop.name);

        let actionBtn = "";
        if(cartItem) {
            actionBtn = `<div class="qty-controls" style="background:white; border:1px solid #cbd5e1;"><button class="qty-btn" onclick="event.stopPropagation(); updateQtyAndReturn('${cartItem.id}', '${p.shop.name}', -1)">-</button><span>${cartItem.qty}</span><button class="qty-btn" onclick="event.stopPropagation(); updateQtyAndReturn('${cartItem.id}', '${p.shop.name}', 1)">+</button></div>`;
        } else {
            actionBtn = `<button class="add-to-cart-btn" onclick="event.stopPropagation(); flyToCart(event, '${item.img}'); addToCartAndReturn('${item.id}', '${item.name.replace(/'/g,"\\'")}', ${p.finalPrice}, '${p.shop.name}', '${item.img}')">ADD +</button>`;
        }

        html += `
        <div class="compare-row">
            <div style="flex:1;">
                <h4 style="font-size:14px; font-weight:800; color:#1e293b; margin-bottom:2px;">${p.shop.name}</h4>
                <p style="font-size:11px; color:#64748b;">⭐ ${p.shop.rating} • ${p.shop.dist}m away</p>
                <h3 style="font-size:18px; font-weight:900; color:var(--success); margin-top:6px;">₹${p.finalPrice}</h3>
            </div>
            <div>${actionBtn}</div>
        </div>`;
    });
    container.innerHTML = html;
}

let currentVariantItem = null;
let selectedVariantPrice = 0;
let selectedVariantString = "1 kg";

function openVariantSelection(itemId) {
    vibe();
    let item = masterInventory.find(i => i.id === itemId);
    if(!item) return;
    currentVariantItem = item;

    document.getElementById('variant-item-img').src = item.img;
    document.getElementById('variant-item-name').innerText = item.name;

    let itemNameLow = item.name.toLowerCase();
    let optionsHtml = "";
    let vars = [];

    if(itemNameLow.includes("egg") || itemNameLow.includes("banana") || itemNameLow.includes("lemon")) {
        vars = [
            { label: "3 Pcs", mult: 0.25 },
            { label: "6 Pcs", mult: 0.5 },
            { label: "12 Pcs", mult: 1, default: true },
            { label: "1 Tray (30)", mult: 2.5 }
        ];
    } else {
        let isLiquid = itemNameLow.includes("oil") || itemNameLow.includes("milk");
        vars = [
            { label: isLiquid ? "250 ml" : "250 g", mult: 0.25 },
            { label: isLiquid ? "500 ml" : "500 g", mult: 0.5 },
            { label: isLiquid ? "1 L" : "1 kg", mult: 1, default: true },
            { label: isLiquid ? "2 L" : "2 kg", mult: 2 }
        ];
    }

    vars.forEach((v, index) => {
        let price = Math.round(item.basePrice * v.mult);
        let activeClass = v.default ? 'active' : '';
        if(v.default) { selectedVariantPrice = price; selectedVariantString = v.label; }

        optionsHtml += `<div class="variant-box ${activeClass}" id="var-box-${index}" onclick="selectVariant(${index}, ${price}, '${v.label}')">
            <h4>${v.label}</h4><p>₹${price}</p>
        </div>`;
    });

    document.getElementById('variant-options-grid').innerHTML = optionsHtml;
    document.getElementById('variant-btn-price').innerText = "₹" + selectedVariantPrice;
    document.getElementById('modal-item-variants').style.display = 'flex';
}

function selectVariant(index, price, label) {
    vibe();
    document.querySelectorAll('.variant-box').forEach(b => b.classList.remove('active'));
    document.getElementById('var-box-'+index).classList.add('active');
    selectedVariantPrice = price;
    selectedVariantString = label;
    document.getElementById('variant-btn-price').innerText = "₹" + price;
}

function confirmVariantAndCompare() {
    vibe();
    if(!currentVariantItem) return;
    document.getElementById('modal-item-variants').style.display = 'none';

    let tempItem = JSON.parse(JSON.stringify(currentVariantItem));
    tempItem.name = `${tempItem.name.split(' (')[0]} (${selectedVariantString})`;
    tempItem.basePrice = selectedVariantPrice;
    tempItem.id = tempItem.id + "_" + selectedVariantString.replace(/\s/g, '');

    let existingIndex = masterInventory.findIndex(i => i.id === tempItem.id);
    if(existingIndex === -1) { masterInventory.push(tempItem); }

    let shop = currentOpenShopId ? shopsData.find(s=>s.id===currentOpenShopId).name : shopsData[0].name;
    addToCart(tempItem.id, tempItem.name, tempItem.basePrice, shop, tempItem.img);
}

// ==========================================
// 📦 7. CATEGORY SPLIT SCREEN
// ==========================================
let termMap = {
    "Fresh Vegetables": "Veg", "Fresh Fruits": "Fruit", "Atta, Rice & Dal": "Atta", "Cold Drinks": "Drink", "Cleaners": "Clean",
    "Vegetables": "Veg", "Fruits": "Fruit", "Dairy & Eggs": "Milk", 
    "Grocery": "Atta", "Snacks": "Drink", "Beauty": "Beauty"
};

function openCategorySplit(catName) {
    vibe();
    document.getElementById('split-cat-title').innerText = catName;

    let activeTerm = termMap[catName] || "Atta";

    let leftHtml = "";
    Object.values(genericCategories).flat().forEach(cat => {
        let isActive = cat.term === activeTerm ? "active" : "";
        leftHtml += `<div class="left-menu-item ${isActive}" onclick="scrollToSplitSection('${cat.term}', this)">
            <img src="${cat.img}" loading="lazy"><br>${cat.name.split(' ')[0]}
        </div>`;
    });
    document.getElementById('split-left-menu').innerHTML = leftHtml;

    let rightHtml = "";
    Object.values(genericCategories).flat().forEach(cat => {
        let catItems = masterInventory.filter(i => i.cat === 'ration' || i.cat === 'snacks' || i.cat === 'fresh' || i.cat === 'dairy');
        if(cat.term === 'Milk') catItems = masterInventory.filter(i => i.cat === 'dairy' || i.name.toLowerCase().includes('egg'));
        if(cat.term === 'Veg') catItems = masterInventory.filter(i => i.name.toLowerCase().includes('aloo') || i.name.toLowerCase().includes('pyaaz'));
        if(cat.term === 'Fruit') catItems = masterInventory.filter(i => i.name.toLowerCase().includes('banana') || i.name.toLowerCase().includes('lemon'));

        let itemsHtml = catItems.slice(0, 4).map(item => {
            let mrp = Math.floor(item.basePrice * 1.15);
            let actionOnClick = `compareItem('${item.id}', 'screen-category-split')`;
            let isSaved = currentUser.savedItems && currentUser.savedItems.includes(item.id);
            let heartBtn = `<div class="heart-btn" onclick="event.stopPropagation(); toggleSavedItem('${item.id}', event)"><span class="heart-icon ${isSaved ? 'saved' : ''}">${isSaved ? '♥' : '♡'}</span></div>`;

            return `<div class="bb-product-card" onclick="compareItem('${item.id}', 'screen-category-split')">
                ${heartBtn}
                <img src="${item.img}" class="bb-product-img" loading="lazy">
                <span class="bb-weight">${item.loose ? '1 kg' : '1 pc'}</span>
                <div class="bb-title">${item.name}</div>
                <div class="bb-price-row"><div class="bb-price-col"><span class="bb-price">₹${item.basePrice}</span><span class="bb-mrp">₹${mrp}</span></div>
                <button class="bb-add-btn" onclick="event.stopPropagation(); ${actionOnClick}">ADD</button></div>
            </div>`;
        }).join('');
        rightHtml += `<div class="split-section" id="sec-${cat.term}"><h4 style="font-size:14px; font-weight:800; color:#1e293b; margin-bottom:12px;">${cat.name}</h4><div class="split-grid">${itemsHtml}</div></div>`;
    });

    let rightContainer = document.getElementById('split-right-items');
    rightContainer.innerHTML = rightHtml;

    switchNav('screen-category-split');
    setTimeout(() => { scrollToSplitSection(activeTerm, document.querySelector('.left-menu-item.active')); }, 100);
}

function scrollToSplitSection(id, element) {
    vibe();
    let target = document.getElementById('sec-' + id);
    let container = document.getElementById('split-right-items');
    if(target && container) {
        container.scrollTo({ top: target.offsetTop - container.offsetTop, behavior: 'smooth' });
    }
    document.querySelectorAll('.left-menu-item').forEach(el => el.classList.remove('active'));
    if(element) element.classList.add('active');
}

let isScrollingSplit = false;
function handleSplitScroll() {
    if(isScrollingSplit) return;
    isScrollingSplit = true;
    setTimeout(() => {
        let container = document.getElementById('split-right-items');
        let sections = container.querySelectorAll('.split-section');
        let scrollPos = container.scrollTop;

        for(let i=0; i<sections.length; i++) {
            let sec = sections[i];
            if(sec.offsetTop - container.offsetTop <= scrollPos + 100) {
                let id = sec.id.replace('sec-', '');
                document.querySelectorAll('.left-menu-item').forEach(el => el.classList.remove('active'));
                let menuItems = document.querySelectorAll('.left-menu-item');
                for(let j=0; j<menuItems.length; j++) {
                    if(menuItems[j].getAttribute('onclick').includes(id)) {
                        menuItems[j].classList.add('active');
                        let leftMenu = document.getElementById('split-left-menu');
                        leftMenu.scrollTo({ top: menuItems[j].offsetTop - leftMenu.offsetTop - 50, behavior: 'smooth'});
                        break;
                    }
                }
            }
        }
        isScrollingSplit = false;
    }, 150);
}

// ==========================================
// 🚀 8. ANIMATIONS (FLY TO CART)
// ==========================================
function flyToCart(event, imgSrc) {
    if(!event) return;
    let btn = event.currentTarget;
    let rect = btn.getBoundingClientRect();

    let flyingItem = document.createElement('img');
    flyingItem.src = imgSrc;
    flyingItem.className = 'flying-item';
    flyingItem.style.left = `${rect.left}px`;
    flyingItem.style.top = `${rect.top}px`;
    document.body.appendChild(flyingItem);

    let cartIcon = document.getElementById('nav-cart');
    if(!cartIcon || document.getElementById('nav-bar').style.display === 'none') {
        cartIcon = document.getElementById('floating-cart');
    }

    if(cartIcon && cartIcon.style.display !== 'none') {
        let cartRect = cartIcon.getBoundingClientRect();
        let targetX = cartRect.left + (cartRect.width / 2) - 20;
        let targetY = cartRect.top + (cartRect.height / 2) - 20;

        setTimeout(() => {
            flyingItem.style.transform = `translate(${targetX - rect.left}px, ${targetY - rect.top}px) scale(0.2)`;
            flyingItem.style.opacity = '0.5';
        }, 10);
    } else {
        setTimeout(() => {
            flyingItem.style.transform = `translate(0, -100px) scale(0.5)`;
            flyingItem.style.opacity = '0';
        }, 10);
    }

    setTimeout(() => { flyingItem.remove(); }, 800);
}

// ==========================================
// 🚀 PHASE 4 (POINT 17): COLLAPSING HEADER LOGIC
// ==========================================
function handleVendorScroll() {
    let screen = document.getElementById('screen-shop-menu');
    let banner = screen.querySelector('.vendor-banner');
    let searchBar = document.getElementById('shop-sticky-search-bar');
    
    if(!banner || !searchBar) return;
    
    if(screen.scrollTop > 50) {
        banner.classList.add('collapsed');
        searchBar.style.boxShadow = '0 4px 10px rgba(0,0,0,0.06)';
    } else {
        banner.classList.remove('collapsed');
        searchBar.style.boxShadow = 'none';
    }
}

// ==========================================
// 🚀 PHASE 6 (POINTS 26 & 27): SAVED ITEMS/VENDORS RENDERERS
// ==========================================
function renderSavedItemsScreen() {
    let container = document.getElementById('saved-items-list');
    if(!container) return;
    
    let savedIds = currentUser.savedItems || [];
    if(savedIds.length === 0) {
        container.innerHTML = `<div class="empty-saved-state"><span>💔</span><h3 style="font-size:18px; font-weight:800; color:#1e293b; margin-bottom:8px;">No Saved Items</h3><p style="font-size:13px;">Apne pasandida items ko heart (♡) dabakar save karein!</p></div>`;
        return;
    }

    let html = "";
    let items = masterInventory.filter(i => savedIds.includes(i.id));
    
    items.forEach(item => {
        let mrp = Math.floor(item.basePrice * 1.15);
        let actionOnClick = `compareItem('${item.id}', 'screen-saved-items')`;
        let heartBtn = `<div class="heart-btn" onclick="event.stopPropagation(); toggleSavedItem('${item.id}', event)"><span class="heart-icon saved">♥</span></div>`;
        
        html += `<div class="bb-product-card" onclick="compareItem('${item.id}', 'screen-saved-items')">
            ${heartBtn}
            <img src="${item.img}" class="bb-product-img" loading="lazy">
            <span class="bb-weight">${item.loose ? '1 kg' : '1 pc'}</span>
            <div class="bb-title">${item.name}</div>
            <div class="bb-price-row">
                <div class="bb-price-col"><span class="bb-price">₹${item.basePrice}</span><span class="bb-mrp">₹${mrp}</span></div>
                <button class="bb-add-btn" onclick="event.stopPropagation(); ${actionOnClick}">ADD</button>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

function renderSavedVendorsScreen() {
    let container = document.getElementById('saved-vendors-list');
    if(!container) return;
    
    let savedIds = currentUser.savedVendors || [];
    if(savedIds.length === 0) {
        container.innerHTML = `<div class="empty-saved-state"><span>💔</span><h3 style="font-size:18px; font-weight:800; color:#1e293b; margin-bottom:8px;">No Saved Vendors</h3><p style="font-size:13px;">Apni favorite dukaano ko heart (♡) dabakar save karein!</p></div>`;
        return;
    }

    let filtered = shopsData.filter(s => savedIds.includes(s.id));
    let html = "";
    
    filtered.forEach(shop => {
        let statusTag = shop.isOpen ? '<span class="flash-tag tag-on" style="background:#16a34a; color:white;">OPEN NOW</span>' : '<span class="flash-tag tag-closed">CLOSED</span>';
        let looseTag = shop.looseItems ? '<span class="flash-tag tag-loose">🌾 LOOSE RATION</span>' : '';

        let superBadges = "";
        if(shop.offset <= 0) superBadges += `<span class="super-badge badge-sasti">💰 SASTI</span>`;
        if(parseInt(shop.dist) <= 200) superBadges += `<span class="super-badge badge-paas">⚡ PAAS</span>`;
        if(currentUser.khataRequests && currentUser.khataRequests[shop.name] === 'approved') superBadges += `<span class="super-badge badge-udhar">📒 UDHAR</span>`;

        let heartBtn = `<div class="heart-btn" onclick="event.stopPropagation(); toggleSavedVendor('${shop.id}', event)"><span class="heart-icon saved">♥</span></div>`;

        html += `<div class="vertical-shop-card ${shop.isOpen ? '' : 'closed'}" onclick="${shop.isOpen ? `openShop('${shop.id}')` : ''}" style="${!shop.isOpen ? 'opacity:0.6; filter:grayscale(1);' : ''}">
            ${heartBtn}
            <img src="${shop.img}" loading="lazy">
            <div class="vertical-shop-info">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <h4>${shop.name}</h4>
                    <span style="font-size:11px; background:#fef3c7; color:#d97706; padding:2px 6px; border-radius:6px; font-weight:800;">⭐ ${shop.rating}</span>
                </div>
                <p>📍 ${shop.dist}m away • Min Order: ₹${shop.minOrder}</p>
                <div class="tag-container" style="margin-top:6px;">${statusTag} ${looseTag}</div>
                <div style="margin-top:6px; display:flex; gap:5px; flex-wrap:wrap;">${superBadges}</div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

// ==========================================
// 🌟 SUPER APP: VERTICAL SWITCHER LOGIC (UPDATED FOR SKY ORANGE HIGHLIGHT)
// ==========================================
function switchVerticalUniverse(target, element) {
    if (typeof vibe === 'function') vibe();
    
    // Remove active class from ALL tabs to reset them to normal
    const buttons = document.querySelectorAll('.folder-tab, .v-tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Apply active class ONLY to the tapped tab (Triggers Sky Orange CSS)
    if (element) {
        element.classList.add('active');
    } else if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    // Hide all screens
    const views = document.querySelectorAll('.vertical-universe-view');
    views.forEach(v => v.style.display = 'none');

    // Show the selected screen
    const targetView = document.getElementById('vertical-' + target);
    if (targetView) {
        targetView.style.display = 'block';
    }

    // Context-Aware Navigation: Khata tab only in Kirana
    const navKhata = document.getElementById('nav-khata');
    if (navKhata) {
        navKhata.style.display = (target === 'kirana') ? 'flex' : 'none';
    }
}

// ==========================================
// 💊 SMART FULFILLMENT FILTER LOGIC
// ==========================================
function filterKiranaFulfillment(type, elem) {
    if (typeof vibe === 'function') vibe();
    
    const pills = document.querySelectorAll('.fulfillment-bar .f-pill');
    pills.forEach(p => p.classList.remove('active'));
    if (elem) elem.classList.add('active');

    const shopCards = document.querySelectorAll('#home-shop-list .shop-card, #home-shop-list > div');
    shopCards.forEach(card => {
        const hasDelivery = card.dataset.delivery !== "false";
        const hasPickup = card.dataset.pickup !== "false";

        if (type === 'all') {
            card.style.display = 'flex';
        } else if (type === 'delivery') {
            card.style.display = hasDelivery ? 'flex' : 'none';
        } else if (type === 'pickup') {
            card.style.display = hasPickup ? 'flex' : 'none';
        }
    });
}

// ==========================================
// 🔄 APP INITIALIZATION
// ==========================================
window.addEventListener('load', function() {
    setTimeout(() => {
        if(typeof updateProfileBadges === 'function') updateProfileBadges();
        initProfilePic();
    }, 500);

    let allScreens = document.querySelectorAll('.screen, [id^="screen-"]');
    allScreens.forEach(screen => {
        screen.style.display = 'none';
        screen.classList.remove('active');
    });

    let loginScreen = document.getElementById('screen-login');
    if(loginScreen) {
        loginScreen.style.display = 'block';
        loginScreen.classList.add('active');
    }

    let step1 = document.getElementById('login-step-1');
    let step2 = document.getElementById('login-step-2');
    if(step1) step1.style.display = 'block';
    if(step2) step2.style.display = 'none';

    let bottomNavBar = document.getElementById('nav-bar') || document.querySelector('nav') || document.querySelector('.bottom-nav');
    if(bottomNavBar) {
        bottomNavBar.style.display = 'none';
    }
});
