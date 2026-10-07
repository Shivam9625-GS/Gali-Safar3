// ==========================================
// 🛒 GLOBAL VARIABLES FOR CARTS
// ==========================================
let deliveryMode = 'home';
let cart = [];
let currentShopInCart = null; 
let appliedCouponCode = "";
let isCoinApplied = false;

// 🚀 PHASE 3 (POINT 12): CART TABS STATE
let activeCartTab = 'kirana'; 

let currentBillDetails = {
    itemTotal: 0, delFee: 0, platformFee: 3, couponDiscount: 0, coinDiscount: 0, grandTotal: 0
};

// ==========================================
// ✨ MAXXSAVER ANIMATIONS & SYNC
// ==========================================
let selectedBundleShop = null; 
let hideMaxxSaverPopup = false;

function triggerMaxModeAnimation() {
    if (hideMaxxSaverPopup) return; 
    let overlay = document.getElementById('max-mode-animation');
    if(!overlay) return;
    if(typeof vibe === 'function') vibe(); 
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
}

function closeMaxxSaverPopup() {
    if(typeof vibe === 'function') vibe();
    let overlay = document.getElementById('max-mode-animation');
    let checkbox = document.getElementById('no-show-maxx');
    if (checkbox && checkbox.checked) { hideMaxxSaverPopup = true; }
    if(overlay) overlay.style.opacity = '0';
    setTimeout(() => { if(overlay) overlay.style.display = 'none'; }, 300);
}

// 🚀 PHASE 3 (POINT 12): 3-TOGGLE TAB SWITCHER
function switchCartTab(tab) {
    if(typeof vibe === 'function') vibe();
    activeCartTab = tab;
    
    document.querySelectorAll('.cart-toggle-btn').forEach(btn => {
        if(btn.id && btn.id.startsWith('c-tab-')) btn.classList.remove('active');
    });
    
    let activeBtn = document.getElementById('c-tab-' + tab);
    if(activeBtn) activeBtn.classList.add('active');

    // Force Normal Mode for Fresh items
    if(tab !== 'kirana') cartMode = 'normal';

    syncCart();
    renderCart();
}

function updateCartTabBadges() {
    let counts = { kirana: 0, fruits: 0, veg: 0 };
    realMultiCart.forEach(c => {
        let invItem = masterInventory.find(i => i.id === c.id);
        if(invItem) {
            let itemName = invItem.name.toLowerCase();
            let isFruit = itemName.includes('banana') || itemName.includes('lemon') || itemName.includes('fruit') || itemName.includes('apple') || itemName.includes('mango');
            let isFreshOrDairy = ['fresh', 'dairy'].includes(invItem.cat) || invItem.isPieceBased;
            
            if(!isFreshOrDairy) counts.kirana += c.qty;
            else if(isFruit) counts.fruits += c.qty;
            else counts.veg += c.qty;
        } else {
            counts.kirana += c.qty;
        }
    });

    let updateTabTxt = (tab, baseText, emoji) => {
        let el = document.getElementById('c-tab-' + tab);
        if(el) {
            el.innerHTML = `${emoji} ${baseText} ${counts[tab] > 0 ? `<span style="background:var(--danger); color:white; border-radius:50%; padding:2px 6px; font-size:10px; margin-left:4px;">${counts[tab]}</span>` : ''}`;
        }
    }
    
    updateTabTxt('kirana', 'Kirana', '📦');
    updateTabTxt('fruits', 'Fruits', '🍎');
    updateTabTxt('veg', 'Veg', '🥦');
}

// 🚀 BUG FIX & SYNC: STRICT CATEGORY FILTERING
function syncCart() {
    if(realMultiCart.length === 0) { cart = []; selectedBundleShop = null; return; }

    let tabFilteredCart = realMultiCart.filter(c => {
        let invItem = masterInventory.find(i => i.id === c.id);
        if(!invItem) return activeCartTab === 'kirana';
        
        let itemName = invItem.name.toLowerCase();
        let isFruit = itemName.includes('banana') || itemName.includes('lemon') || itemName.includes('fruit') || itemName.includes('apple') || itemName.includes('mango');
        let isVeg = itemName.includes('aloo') || itemName.includes('onion') || itemName.includes('pyaaz') || (invItem.cat === 'fresh' && !isFruit);
        let isDairyOrEggs = invItem.cat === 'dairy' || itemName.includes('egg') || itemName.includes('milk');

        if (activeCartTab === 'kirana') return !isFruit && !isVeg && !isDairyOrEggs;
        if (activeCartTab === 'fruits') return isFruit;
        if (activeCartTab === 'veg') return isVeg || isDairyOrEggs;
        return true;
    });

    if(tabFilteredCart.length === 0) { cart = []; return; }

    let uniqueShops = [...new Set(tabFilteredCart.map(i => i.shop))];

    if (!selectedBundleShop || !shopsData.find(s => s.name === selectedBundleShop)) {
        selectedBundleShop = currentShopInCart || uniqueShops[0];
    }

    // 🚀 BUG FIX: NORMAL MODE NOW APPLIES ACROSS ALL TABS (Fruits/Veg/Kirana)
    if (cartMode === 'normal') {
        let bundles = getVendorBundles(tabFilteredCart);
        let shopObj = shopsData.find(s => s.name === selectedBundleShop) || shopsData[0];
        
        cart = bundles.itemsList.map(item => ({
            id: item.id, name: item.name, price: item.basePrice + shopObj.offset, shop: shopObj.name, img: item.img, qty: item.qty
        }));
    } else {
        cart = JSON.parse(JSON.stringify(tabFilteredCart));
    }
}

function getVendorBundles(itemsToProcess) {
    if(!itemsToProcess) itemsToProcess = realMultiCart;
    let uniqueItems = {};
    let requiresLoose = false;

    itemsToProcess.forEach(c => {
        if(!uniqueItems[c.id]) {
            let invItem = masterInventory.find(inv => inv.id === c.id);
            if(invItem && invItem.loose) requiresLoose = true;
            uniqueItems[c.id] = { id: c.id, name: c.name, img: c.img, qty: 0, basePrice: invItem ? invItem.basePrice : c.price };
        }
        uniqueItems[c.id].qty += c.qty; 
    });

    let validShopsData = shopsData.filter(s => s.isOpen && (!requiresLoose || s.looseItems) && parseInt(s.dist) <= 1000);
    if(validShopsData.length === 0) validShopsData = shopsData.filter(s => s.isOpen && parseInt(s.dist) <= 1000);
    if(validShopsData.length === 0) validShopsData = shopsData.filter(s => s.isOpen);

    let shopCosts = validShopsData.map(shop => {
        let total = 0;
        for(let id in uniqueItems) { total += (uniqueItems[id].basePrice + shop.offset) * uniqueItems[id].qty; }
        return { shop: shop, totalCost: total };
    });

    shopCosts.sort((a, b) => a.totalCost - b.totalCost);
    let sasti = shopCosts[0] || {shop: shopsData[0], totalCost: 0};
    
    let paasShopCosts = [...shopCosts].sort((a, b) => parseInt(a.shop.dist) - parseInt(b.shop.dist));
    let paas = paasShopCosts[0] || sasti;

    if (sasti.shop.id === paas.shop.id && paasShopCosts.length > 1) { 
        paas = paasShopCosts[1]; 
    }
    
    return { sasti, paas, itemsList: Object.values(uniqueItems) };
}

// 🚀 BUG FIX: STORE SYNC ON TAB/BUNDLE SELECTION
function selectVendorBundle(shopName) {
    if(typeof vibe === 'function') vibe(); 
    selectedBundleShop = shopName; 
    currentShopInCart = shopName; // UI FIX: Master store update
    syncCart(); 
    renderCart();
}

function setCartMode(mode) {
    if(typeof vibe === 'function') vibe(); 
    cartMode = mode; 
    syncCart(); 
    renderCart(); 
    saveState();
}

// ==========================================
// 🛍️ CART ADDITION & MODIFICATION (Live UI Sync)
// ==========================================
function addToCart(id, name, price, shopName, img) {
    if(typeof vibe === 'function') vibe(); 
    
    let invItem = masterInventory.find(i => i.id === id);
    let isFreshItem = invItem && (invItem.cat === 'fresh' || invItem.cat === 'dairy' || invItem.isPieceBased);

    if (invItem) {
        let itemName = invItem.name.toLowerCase();
        let isFruit = itemName.includes('banana') || itemName.includes('lemon') || itemName.includes('fruit') || itemName.includes('apple') || itemName.includes('mango');
        if (!isFreshItem) activeCartTab = 'kirana';
        else if (isFruit) activeCartTab = 'fruits';
        else activeCartTab = 'veg';

        document.querySelectorAll('.cart-toggle-btn').forEach(btn => {
            if(btn.id && btn.id.startsWith('c-tab-')) btn.classList.remove('active');
        });
        let activeBtn = document.getElementById('c-tab-' + activeCartTab);
        if(activeBtn) activeBtn.classList.add('active');
    }
    
    if (realMultiCart.length > 0) {
        let hasOtherVendorInCart = realMultiCart.some(c => c.shop !== shopName);
        if (hasOtherVendorInCart && isFreshItem) {
            if(typeof window.pendingFreshVendorId !== 'undefined') {
                window.pendingFreshVendorId = shopsData.find(s=>s.name === shopName)?.id || shopsData[0].id;
                window.pendingFreshCategory = invItem.cat === 'dairy' ? 'Dairy & Eggs' : (name.toLowerCase().includes('fruit') ? 'Fruits' : 'Vegetables');
            }
            let clashModal = document.getElementById('modal-fresh-clash');
            if(clashModal) clashModal.style.display = 'flex';
            return;
        }
    }

    currentShopInCart = shopName;
    selectedBundleShop = shopName; 
    
    let existing = realMultiCart.find(c => c.id === id && c.shop === shopName);
    if(existing) { 
        existing.qty++; 
    } else {
        realMultiCart.push({ id: id, name: name, price: price, shop: shopName, img: img, qty: 1 }); 
    }
    
    let uniqueShops = [...new Set(realMultiCart.map(i => i.shop))];
    if (uniqueShops.length > 1 && cartMode !== 'max' && !isFreshItem) {
        cartMode = 'max';
        triggerMaxModeAnimation(); 
    }
    
    syncCart();
    updateBadge(); 
    
    let shopMenuScreen = document.getElementById('screen-shop-menu');
    if(shopMenuScreen && shopMenuScreen.classList.contains('active')) {
        let shopObj = shopsData.find(s => s.name === shopName) || shopsData.find(s => s.id === currentOpenShopId);
        if(shopObj) renderShopItems(masterInventory, shopObj);
    }
    let homeScreen = document.getElementById('screen-home');
    if(homeScreen && homeScreen.classList.contains('active')) renderHome();

    let cartScreen = document.getElementById('screen-cart');
    if(cartScreen && cartScreen.classList.contains('active')) renderCart();

    let categorySplitScreen = document.getElementById('screen-category-split');
    if(categorySplitScreen && categorySplitScreen.classList.contains('active')) {
        let catTitle = document.getElementById('split-cat-title').innerText;
        if(typeof openCategorySplit === 'function') openCategorySplit(catTitle);
    }

    saveState();
    if(typeof showToast === 'function') showToast(name + " added! 🛒");
}

function addToCartAndReturn(id, name, price, shopName, img) {
    addToCart(id, name, price, shopName, img);
    let isAdded = realMultiCart.some(c => c.id === id && c.shop === shopName);
    if(isAdded && typeof compareItem === 'function') compareItem(id, 'screen-search');
}

function updateQty(id, shopName, change) {
    if(typeof vibe === 'function') vibe();
    
    // 🚀 BUG FIX: Safe find logic across ALL tabs
    let itemIndex = realMultiCart.findIndex(c => c.id === id && c.shop === shopName);
    if (itemIndex === -1 && cartMode === 'normal') {
        itemIndex = realMultiCart.findIndex(c => c.id === id); 
    }

    if(itemIndex > -1) {
        realMultiCart[itemIndex].qty += change;
        if(realMultiCart[itemIndex].qty <= 0) { realMultiCart.splice(itemIndex, 1); }
    }

    if(realMultiCart.length === 0) {
        appliedCouponCode = "";
        isCoinApplied = false;
        let coinCb = document.getElementById('use-coin-cb');
        if(coinCb) coinCb.checked = false;
        let couponInput = document.getElementById('coupon-code');
        if(couponInput) couponInput.value = "";
    }

    let uniqueShops = [...new Set(realMultiCart.map(i => i.shop))];
    if(uniqueShops.length <= 1) cartMode = 'normal';

    syncCart();

    if (cart.length > 0) {
        let currentItemTotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
        if (appliedCouponCode === 'GALI50' && currentItemTotal < 149) {
            appliedCouponCode = "";
            let couponInput = document.getElementById('coupon-code');
            if(couponInput) couponInput.value = "";
            alert("Cart value dropped below ₹149. Coupon GALI50 removed!");
        }
    }

    updateBadge();

    let shopMenuScreen = document.getElementById('screen-shop-menu');
    if(shopMenuScreen && shopMenuScreen.classList.contains('active')) {
        let shopObj = shopsData.find(s => s.name === shopName) || shopsData.find(s => s.id === currentOpenShopId);
        if(shopObj) renderShopItems(masterInventory, shopObj);
    }
    let homeScreen = document.getElementById('screen-home');
    if(homeScreen && homeScreen.classList.contains('active')) renderHome();

    let cartScreen = document.getElementById('screen-cart');
    if(cartScreen && cartScreen.classList.contains('active')) renderCart();

    let categorySplitScreen = document.getElementById('screen-category-split');
    if(categorySplitScreen && categorySplitScreen.classList.contains('active')) {
        let catTitle = document.getElementById('split-cat-title').innerText;
        if(typeof openCategorySplit === 'function') openCategorySplit(catTitle);
    }

    saveState();
}

function updateQtyAndReturn(id, shopName, change) {
    updateQty(id, shopName, change);
    if(typeof compareItem === 'function') compareItem(id, 'screen-search');
}

function updateBadge() {
    let total = realMultiCart.reduce((sum, i) => sum + i.qty, 0);
    let badge = document.getElementById('cart-badge');
    if(badge) { badge.innerText = total; badge.style.display = total > 0 ? 'flex' : 'none'; }

    if(typeof updateCartTabBadges === 'function') updateCartTabBadges();

    let floatCart = document.getElementById('floating-cart');

    let hideScreens = ['screen-cart', 'screen-single-pay', 'screen-multi-pay', 'screen-success', 'screen-category-split', 'screen-shop-menu', 'screen-coins'];
    let isHideScreenActive = hideScreens.some(id => {
        let el = document.getElementById(id);
        return el && el.classList.contains('active');
    });

    if(floatCart) {
        if(total > 0 && !isHideScreenActive) {
            let totalVal = realMultiCart.reduce((sum, i) => sum + (i.price * i.qty), 0);
            document.getElementById('float-cart-info').innerText = `${total} Items | ₹${totalVal}`;
            floatCart.style.display = 'flex';
        } else {
            floatCart.style.display = 'none';
        }
    }
}

// 🚀 BUG FIX: ADD MORE BUTTON ALWAYS ROUTES TO THE CORRECT STORE
function handleAddMoreClick() {
    if(typeof vibe === 'function') vibe();
    
    let targetShopName = selectedBundleShop || (cart.length > 0 ? cart[0].shop : null) || currentShopInCart;
    let shopObj = null;
    
    if (targetShopName) {
        shopObj = shopsData.find(s => s.name === targetShopName || s.id === targetShopName);
    }
    if (!shopObj && typeof currentOpenShopId !== 'undefined' && currentOpenShopId) {
        shopObj = shopsData.find(s => s.id === currentOpenShopId);
    }

    if(shopObj) {
        if(typeof openShop === 'function') openShop(shopObj.id);
    } else {
        let firstOpenShop = shopsData.find(s => s.isOpen && s.looseItems) || shopsData.find(s => s.isOpen) || shopsData[0];
        if(typeof openShop === 'function') openShop(firstOpenShop.id);
    }
}

// ==========================================
// 🛒 RENDERING CART & CHECKOUT UI
// ==========================================
function renderCart() {
    let container = document.getElementById('cart-container');
    let emptyMsg = document.getElementById('empty-cart-msg');
    let checkoutArea = document.getElementById('checkout-area');
    let toggleContainer = document.getElementById('cart-toggle-container');
    let addMoreBtn = document.getElementById('add-more-container');
    let delHomeBtn = document.getElementById('del-home');

    updateCartTabBadges();

    let coinBalEl = document.getElementById('cart-coin-bal');
    if(coinBalEl && typeof currentUser !== 'undefined') coinBalEl.innerText = currentUser.coins;

    if(!container) return;
    container.innerHTML = "";

    if(cart.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:50px 20px; color:#64748b;">
            <div style="font-size:50px; opacity:0.5; margin-bottom:10px;">🛒</div>
            <p style="font-weight:800; color:#1e293b;">No items in ${activeCartTab}</p>
        </div>`;
        if(emptyMsg) emptyMsg.style.display = 'none'; 
        if(checkoutArea) checkoutArea.style.display = 'none';
        if(toggleContainer) toggleContainer.style.display = 'none';
        if(addMoreBtn) addMoreBtn.style.display = 'block';
        return;
    }

    if(emptyMsg) emptyMsg.style.display = 'none';
    if(checkoutArea) checkoutArea.style.display = 'block';
    if(addMoreBtn) addMoreBtn.style.display = 'block';

    let kiranaItems = realMultiCart.filter(c => {
        let invItem = masterInventory.find(i => i.id === c.id);
        if(!invItem) return true;
        let isFreshOrDairy = ['fresh', 'dairy'].includes(invItem.cat) || invItem.isPieceBased;
        return !isFreshOrDairy;
    });
    let actualShopsCount = [...new Set(kiranaItems.map(i => i.shop))].length;
    
    if(toggleContainer) {
        toggleContainer.style.display = (actualShopsCount > 1 && activeCartTab === 'kirana') ? 'flex' : 'none';
    }

    let btnNormal = document.getElementById('btn-normal-cart');
    let btnMaxx = document.getElementById('btn-maxx-cart');
    if(btnNormal) btnNormal.classList.toggle('active', cartMode === 'normal');
    if(btnMaxx) btnMaxx.classList.toggle('active', cartMode === 'max');

    if(cartMode === 'normal') {
        let bundles = getVendorBundles(cart);
        let originalShopName = currentShopInCart || [...new Set(cart.map(i => i.shop))][0];
        let originalShopObj = shopsData.find(s => s.name === originalShopName) || shopsData[0];
        
        // 🚀 BUG FIX: Correct original cost calculation
        let originalCost = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

        let optionsHtml = `<p style="font-size: 12px; font-weight: 800; color: #64748b; margin: 15px 20px 10px; text-transform: uppercase;">🛒 Choose Store (${activeCartTab})</p>`;
        
        let options = [];
        let addedShopNames = new Set();

        options.push({ type: 'current', shop: originalShopObj, cost: originalCost, title: '📍 CURRENT STORE', color: '#ff6b00' });
        addedShopNames.add(originalShopObj.name);

        if (!addedShopNames.has(bundles.sasti.shop.name)) {
            options.push({ type: 'sasti', shop: bundles.sasti.shop, cost: bundles.sasti.totalCost, title: '💰 SABSE SASTI', color: '#10b981' });
            addedShopNames.add(bundles.sasti.shop.name);
        }

        if (!addedShopNames.has(bundles.paas.shop.name)) {
            options.push({ type: 'paas', shop: bundles.paas.shop, cost: bundles.paas.totalCost, title: '⚡ SABSE PAAS', color: '#0284c7' });
            addedShopNames.add(bundles.paas.shop.name);
        }

        if (options.length < 3) {
            let validShopsData = shopsData.filter(s => s.isOpen && parseInt(s.dist) <= 1000);
            let nextShop = validShopsData.find(s => !addedShopNames.has(s.name));
            if (nextShop) {
                let nCost = bundles.itemsList.reduce((sum, i) => sum + (i.basePrice + nextShop.offset) * i.qty, 0);
                options.push({ type: 'alternative', shop: nextShop, cost: nCost, title: '🏪 ALTERNATIVE STORE', color: '#8b5cf6' });
                addedShopNames.add(nextShop.name);
            }
        }
        
        options.forEach(opt => {
            let isSelected = selectedBundleShop === opt.shop.name;
            let bgStyle = isSelected ? `background: #fffaf5; border: 2px solid ${opt.color}; box-shadow: 0 8px 20px rgba(0,0,0,0.1); transform: scale(1.02);` : `background: white; border: 1px solid #cbd5e1; box-shadow: 0 2px 5px rgba(0,0,0,0.02);`;
            let checkMark = isSelected ? `<div style="font-size:10px; background:${opt.color}; color:white; padding:3px 8px; border-radius:6px; font-weight:800; display:inline-block; margin-top:4px;">✅ SELECTED</div>` : '';

            optionsHtml += `
            <div style="border-radius: 16px; padding: 25px 20px 20px; margin: 25px 20px 15px; cursor: pointer; position: relative; transition: 0.2s; ${bgStyle}" onclick="selectVendorBundle('${opt.shop.name}')">
                <div style="position: absolute; top: -12px; left: 15px; font-size: 11px; font-weight: 900; padding: 5px 15px; border-radius: 20px; color: white; background: ${opt.color}; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">${opt.title}</div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h4 style="font-size:15px; font-weight:800; color:#1e293b;">${opt.shop.name}</h4>
                        <p style="font-size:11px; color:#64748b;">⭐ ${opt.shop.rating} • ${opt.shop.dist}m away</p>
                        ${checkMark}
                    </div>
                    <div style="text-align:right;">
                        <h3 style="color:${opt.color}; font-size:22px; font-weight:900;">₹${opt.cost}</h3>
                        <span style="font-size:11px; color:#64748b; font-weight:800;">${bundles.itemsList.length} items</span>
                    </div>
                </div>
            </div>`;
        });

        container.innerHTML += optionsHtml;
        
        let activeShopName = cart.length > 0 ? cart[0].shop : selectedBundleShop;
        container.innerHTML += `<div style="background: #e2e8f0; padding: 8px 20px; margin: 15px 20px 0; border-radius: 8px 8px 0 0; font-size: 11px; font-weight: 800; color: #1e293b; text-transform: uppercase;">🛍️ ITEMS FROM ${activeShopName}</div>`;

        cart.forEach(item => {
            container.innerHTML += `
            <div class="cart-item" style="margin-top: 0; border-radius: 0; border-top: none; border-bottom: 1px solid #e2e8f0;">
                <div style="display:flex; align-items:center; gap:15px; width:60%;">
                    <img src="${item.img}" style="width:40px; height:40px; object-fit:contain;">
                    <div>
                        <h4 style="font-size:12px; font-weight:800; color:#1e293b;">${item.name}</h4>
                        <p style="font-size:13px; font-weight:800; color:var(--success);">₹${item.price}</p>
                        <p style="font-size:11px; color:#64748b; margin-top:2px;">Total: ₹${item.price * item.qty}</p>
                    </div>
                </div>
                <div class="qty-controls" style="margin:0; width:80px; background:white;">
                    <button class="qty-btn" onclick="updateQty('${item.id}', '${item.shop}', -1)">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" onclick="updateQty('${item.id}', '${item.shop}', 1)">+</button>
                </div>
            </div>`;
        });

        if(container.lastElementChild) { container.lastElementChild.style.borderBottom = "none"; container.lastElementChild.style.borderRadius = "0 0 8px 8px"; }
    } else {
        let shopGroups = {};
        cart.forEach(item => {
            if(!shopGroups[item.shop]) shopGroups[item.shop] = [];
            shopGroups[item.shop].push(item);
        });

        for(let shopName in shopGroups) {
            container.innerHTML += `<div style="background: linear-gradient(135deg, #06b6d4, #0891b2); padding: 8px 20px; margin: 15px 20px 0; border-radius: 8px 8px 0 0; font-size: 11px; font-weight: 900; color: white; text-transform: uppercase; box-shadow: 0 4px 6px rgba(8, 145, 178, 0.2);">📦 FROM ${shopName}</div>`;
            shopGroups[shopName].forEach(item => {
                container.innerHTML += `
                <div class="cart-item" style="margin-top: 0; border-radius: 0; border-top: none; border-bottom: 1px solid #e2e8f0;">
                    <div style="display:flex; align-items:center; gap:15px; width:60%;">
                        <img src="${item.img}" style="width:40px; height:40px; object-fit:contain;">
                        <div>
                            <h4 style="font-size:12px; font-weight:800; color:#1e293b;">${item.name}</h4>
                            <p style="font-size:13px; font-weight:800; color:var(--success);">₹${item.price}</p>
                            <p style="font-size:11px; color:#64748b; margin-top:2px;">Total: ₹${item.price * item.qty}</p>
                        </div>
                    </div>
                    <div class="qty-controls" style="margin:0; width:80px; background:white;">
                        <button class="qty-btn" onclick="updateQty('${item.id}', '${item.shop}', -1)">-</button>
                        <span>${item.qty}</span>
                        <button class="qty-btn" onclick="updateQty('${item.id}', '${item.shop}', 1)">+</button>
                    </div>
                </div>`;
            });
            if(container.lastElementChild) { container.lastElementChild.style.borderBottom = "none"; container.lastElementChild.style.borderRadius = "0 0 8px 8px"; }
        }
    }

    updateBillTotals();

    if(cartMode === 'max') {
        setDeliveryMode('pickup');
        if(delHomeBtn) {
            delHomeBtn.style.opacity = '0.5';
            delHomeBtn.style.pointerEvents = 'none';
        }
        let msWarn = document.getElementById('max-saver-warning');
        if(msWarn) msWarn.style.display = 'block';
    } else {
        if(delHomeBtn && delHomeBtn.style.pointerEvents === 'none') {
            setDeliveryMode('home');
        }
        if(delHomeBtn) {
            delHomeBtn.style.opacity = '1';
            delHomeBtn.style.pointerEvents = 'auto';
        }
        let msWarn = document.getElementById('max-saver-warning');
        if(msWarn) msWarn.style.display = 'none';

        let shopForSlots = cart.length > 0 ? cart[0].shop : 'Sharma Store';
        updateShopTimeSlots(shopForSlots);
    }
}

// ==========================================
// 💰 BILLING, COUPONS & DELIVERY
// ==========================================
function applyCoupon() {
    let codeEl = document.getElementById('coupon-code');
    if(!codeEl) return;
    let code = codeEl.value.toUpperCase().trim();
    let itemTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    if(code === 'GALI50') {
        if (currentUser.totalOrdersPlaced > 0 || currentUser.isGali50Used) {
            alert("Yeh coupon sirf FIRST time order ke liye hai!");
            appliedCouponCode = ""; codeEl.value = ""; updateBillTotals(); return;
        }
        if (itemTotal < 149) {
            alert(`Cart value must be ₹149 or more to apply ${code}. Add more items!`);
            appliedCouponCode = ""; codeEl.value = ""; updateBillTotals(); return;
        }
        appliedCouponCode = code;
        alert("Coupon Applied! 50% Off (Max ₹50) on items.");
        updateBillTotals();
    } else {
        alert("Invalid Coupon Code");
    }
    saveState();
}

function toggleCoinUsage() {
    let cb = document.getElementById('use-coin-cb');
    if(!cb) return;
    if(cb.checked && currentUser.coins > 0) {
        isCoinApplied = true;
    } else {
        isCoinApplied = false;
        if(cb.checked && currentUser.coins === 0) {
            cb.checked = false;
            alert("Aapke paas Gali-Coins nahi hain!");
        }
    }
    updateBillTotals();
    saveState();
}

function setDeliveryMode(mode) {
    if(typeof vibe === 'function') vibe();
    deliveryMode = mode;
    let homeBtn = document.getElementById('del-home');
    let pickupBtn = document.getElementById('del-pickup');
    
    if(homeBtn) homeBtn.classList.toggle('active', mode === 'home');
    if(pickupBtn) pickupBtn.classList.toggle('active', mode === 'pickup');
    
    if(mode === 'pickup') {
        if(typeof showToast === 'function') showToast("Store Pickup Selected: Delivery Fee Waived! 🚶");
    } else {
        if(typeof showToast === 'function') showToast("Home Delivery Selected 🛵");
    }
    
    updateBillTotals();
}

function updateBillTotals() {
    let itemTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let validationWarningHtml = "";
    let uniqueShops = [...new Set(cart.map(i => i.shop))];
    let isValid = true;

    if (cartMode === 'max') {
        if (itemTotal < 149) {
            isValid = false;
            validationWarningHtml += `<div style="background:#fee2e2; color:#b91c1c; padding:10px; border-radius:8px; font-size:12px; font-weight:800; margin:0 20px 15px; border:1px solid #fca5a5;">⚠️ MaxxSaver Mode: Total cart value must be at least ₹149 (Current: ₹${itemTotal}).</div>`;
        }
    } else {
        // 🚀 BUG FIX: Warning only shows for the currently active store
        let shopsToCheck = (activeCartTab === 'kirana' && selectedBundleShop) ? [selectedBundleShop] : uniqueShops;
        
        shopsToCheck.forEach(shopName => {
            let shopTotal = cart.filter(i => i.shop === shopName).reduce((sum, i) => sum + (i.price * i.qty), 0);
            
            let shopObj = shopsData.find(s => s.name === shopName);
            if(shopObj) {
                let minReq = shopObj.minOrder || 100;
                if(shopTotal < minReq) {
                    isValid = false;
                    validationWarningHtml += `<div style="background:#fee2e2; color:#b91c1c; padding:10px; border-radius:8px; font-size:12px; font-weight:800; margin:0 20px 15px; border:1px solid #fca5a5;">⚠️ ${shopObj.name}: Add ₹${minReq - shopTotal} more to reach minimum order value (₹${minReq}).</div>`;
                }
            }
        });
    }

    let warnDiv = document.getElementById('checkout-warnings');
    if(warnDiv) warnDiv.innerHTML = validationWarningHtml;

    let btnUpi = document.getElementById('btn-upi');
    let btnCod = document.getElementById('btn-cod');
    let btnUdhar = document.getElementById('btn-udhar');

    if(btnUpi) { btnUpi.disabled = !isValid; btnUpi.style.opacity = isValid ? '1' : '0.5'; }
    if(btnCod) { btnCod.disabled = !isValid; btnCod.style.opacity = isValid ? '1' : '0.5'; }

    // 🚀 BUG FIX: Strict 1-Tap Khata Visibility Rules
    if(btnUdhar) {
        if(cartMode === 'max' || cart.length === 0) {
            btnUdhar.style.display = 'none';
        } else {
            let activeShopName = cart[0].shop;
            
            let isUdharApproved = (currentUser.khataBalances && currentUser.khataBalances.hasOwnProperty(activeShopName)) || 
                                  (currentUser.khataRequests && currentUser.khataRequests[activeShopName] === 'approved');

            if(isUdharApproved) {
                btnUdhar.style.display = 'flex'; 
                btnUdhar.disabled = !isValid;
                btnUdhar.style.opacity = isValid ? '1' : '0.5';
            } else {
                btnUdhar.style.display = 'none';
            }
        }
    }

    let delFee = 0;
    if (deliveryMode === 'home') {
        uniqueShops.forEach(shopName => {
            let shopObj = shopsData.find(s => s.name === shopName) || shopsData[0];
            delFee += (shopObj.delCharge || 15);
        });
    }

    let couponDiscount = 0;
    if(appliedCouponCode === 'GALI50') { couponDiscount = Math.min(itemTotal * 0.5, 50); }

    let maxCoinAllowed = Math.floor(itemTotal * 0.1);
    let coinDiscount = 0;
    if(isCoinApplied) { coinDiscount = Math.min(currentUser.coins, maxCoinAllowed); }

    let calculatedTotal = itemTotal + delFee + 3 - couponDiscount - coinDiscount;
    let grandTotal = Math.max(0, Math.round(calculatedTotal));

    let normalTotalIfMax = 0;
    if(cartMode === 'max') {
        let bundles = getVendorBundles(cart);
        let originalShopName = currentShopInCart || bundles.sasti.shop.name;
        let originalShopObj = shopsData.find(s => s.name === originalShopName) || shopsData[0];
        normalTotalIfMax = bundles.itemsList.reduce((sum, i) => sum + (i.basePrice + originalShopObj.offset) * i.qty, 0);
    }

    currentBillDetails = { itemTotal, delFee, platformFee: 3, couponDiscount, coinDiscount, grandTotal };

    let savingsBanner = document.getElementById('savings-banner');
    let bannerSavingsAmt = document.getElementById('total-savings');

    if(savingsBanner && bannerSavingsAmt) {
        if(cartMode === 'max' && normalTotalIfMax > itemTotal) {
            let diff = Math.round(normalTotalIfMax - itemTotal);
            bannerSavingsAmt.innerText = diff;
            savingsBanner.style.display = 'block';
        } else {
            savingsBanner.style.display = 'none';
        }
    }

    let billBox = document.getElementById('bill-box-content');
    if(billBox) {
        let deliveryText = deliveryMode === 'pickup' ? '<span style="color:var(--success);">WAIVED (Pickup)</span>' : (delFee === 0 ? '<span style="color:var(--success);">FREE</span>' : '₹'+delFee);
        
        billBox.innerHTML = `
            <div class="bill-row"><span>Item Total</span><span>₹${itemTotal}</span></div>
            <div class="bill-row"><span>Delivery Fee</span><span>${deliveryText}</span></div>
            <div class="bill-row"><span>Platform Fee</span><span>₹3</span></div>
            ${couponDiscount > 0 ? `<div class="bill-row" style="color:var(--success);"><span>Coupon (${appliedCouponCode})</span><span>-₹${couponDiscount}</span></div>` : ''}
            ${coinDiscount > 0 ? `<div class="bill-row" style="color:#d97706;"><span>Gali-Coins Used</span><span>-₹${coinDiscount}</span></div>` : ''}
            <div class="bill-row grand-total-row"><span>Grand Total</span><span>₹${grandTotal}</span></div>
            <span id="final-gt-hidden" style="display:none;">${grandTotal}</span>
        `;
    }
}

// ==========================================
// ⏰ TIME SLOTS & MODALS
// ==========================================
let availableDates = [];
let currentSelectedDateIndex = 0;
let tempSelectedSlot = "";

function openTimeSlotModal() {
    if(typeof vibe === 'function') vibe();
    let modal = document.getElementById('timeSlotModal');
    if(modal) {
        modal.style.display = 'flex';
        renderDateTabs();
        renderSlotsGrid();
    }
}

function renderDateTabs() {
    let html = "";
    availableDates.forEach((d, i) => {
        let isActive = i === currentSelectedDateIndex ? "active" : "";
        html += `<div class="date-tab ${isActive}" onclick="selectDateTab(${i})">
                    <div class="date-tab-day">${d.labelDay}</div>
                    <div class="date-tab-date">${d.labelDate}</div>
                 </div>`;
    });
    let container = document.getElementById('slot-dates-container');
    if(container) container.innerHTML = html;
}

function selectDateTab(index) {
    if(typeof vibe === 'function') vibe(); 
    currentSelectedDateIndex = index; 
    tempSelectedSlot = "";
    renderDateTabs(); 
    renderSlotsGrid();
}

function renderSlotsGrid() {
    if(!availableDates[currentSelectedDateIndex]) return;
    let slots = availableDates[currentSelectedDateIndex].slots;
    let html = "";
    if(slots.length === 0) {
        html = `<div style="grid-column: 1 / -1; text-align:center; padding: 30px; color: #64748b; font-weight:600;">No slots available for this day.</div>`;
    } else {
        slots.forEach(slot => {
            let isActive = tempSelectedSlot === slot ? "active" : "";
            html += `<div class="slot-btn-new ${isActive}" onclick="selectSlotBtn('${slot}')">${slot}</div>`;
        });
    }
    let container = document.getElementById('slots-grid-container');
    if(container) container.innerHTML = html;
}

function selectSlotBtn(slot) { 
    if(typeof vibe === 'function') vibe(); 
    tempSelectedSlot = slot; 
    renderSlotsGrid(); 
}

function confirmTimeSlot() {
    if(typeof vibe === 'function') vibe();
    if(!tempSelectedSlot && availableDates[currentSelectedDateIndex].slots.length > 0) tempSelectedSlot = availableDates[currentSelectedDateIndex].slots[0];
    if(!tempSelectedSlot) return alert("Please select a slot!");

    let dayPrefix = availableDates[currentSelectedDateIndex].labelDay;
    let finalDisplay = `${dayPrefix}, ${tempSelectedSlot}`;

    let textEl = document.getElementById('selected-slot-text');
    let inputEl = document.getElementById('time-slot-policy');
    if(textEl) textEl.innerText = finalDisplay;
    if(inputEl) inputEl.value = finalDisplay;

    let modal = document.getElementById('timeSlotModal');
    if(modal) modal.style.display = 'none';
    if(typeof showToast === 'function') showToast("Delivery time updated! ✅");
}

function format12H(h) { let ampm = h >= 12 ? 'PM' : 'AM'; let hr = h % 12 || 12; return `${hr}:00 ${ampm}`; }

function updateShopTimeSlots(shopName) {
    let openHour = 6, closeHour = 23;
    if (shopName !== 'Mixed') {
        let shop = shopsData.find(s => s.name === shopName);
        if (shop && shop.openTime) { openHour = parseInt(shop.openTime.split(":")[0]); closeHour = parseInt(shop.closeTime.split(":")[0]); }
    }

    availableDates = [];
    let now = new Date();
    for(let i=0; i<4; i++) {
        let d = new Date(now);
        d.setDate(now.getDate() + i);
        let dayName = i === 0 ? "Today" : (i === 1 ? "Tomorrow" : d.toLocaleDateString('en-US', {weekday: 'long'}));
        let dateStr = d.getDate() + " " + d.toLocaleDateString('en-US', {month: 'short'});

        let slots = [];
        let startHr = openHour;
        if(i === 0) startHr = Math.max(now.getHours() + 1, openHour);
        
        for(let h = startHr; h < closeHour; h++) { 
            slots.push(`${format12H(h)} - ${format12H(h+1)}`); 
        }
        availableDates.push({ labelDay: dayName, labelDate: dateStr, slots: slots });
    }

    currentSelectedDateIndex = availableDates[0].slots.length === 0 ? 1 : 0;
    if(!availableDates[currentSelectedDateIndex]) return;

    let defaultDay = availableDates[currentSelectedDateIndex].labelDay;
    let defaultSlot = availableDates[currentSelectedDateIndex].slots[0] || "No slots";
    tempSelectedSlot = defaultSlot;

    let slotEl = document.getElementById('selected-slot-text');
    if(slotEl) slotEl.innerText = `${defaultDay}, ${defaultSlot}`;
    let policyEl = document.getElementById('time-slot-policy');
    if(policyEl) policyEl.value = `${defaultDay}, ${defaultSlot}`;

    let countEl = document.getElementById('slot-product-count');
    if(countEl) {
        let totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
        countEl.innerText = `${totalQty} Product${totalQty >1 ? 's' : ''}`;
    }
}

// ==========================================
// 💳 CHECKOUT & FINAL ORDER EXECUTION
// ==========================================
function validateCheckout() {
    if (cart.length === 0) { alert("Cart is empty!"); return false; }
    let uniqueShops = [...new Set(cart.map(i => i.shop))];
    for (let shopName of uniqueShops) {
        let shopTotal = cart.filter(i => i.shop === shopName).reduce((sum, i) => sum + (i.price * i.qty), 0);
        let shopObj = shopsData.find(s => s.name === shopName) || shopsData[0];
        let minReq = shopObj.minOrder || 100;
        if (shopTotal < minReq && cartMode !== 'max') {
            alert(`${shopName} se kam se kam ₹${minReq} ka saaman lena zaroori hai! Aapne sirf ₹${shopTotal} ka liya hai.`);
            return false;
        }
    }
    if (cartMode === 'max') {
        let overallTotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
        if (overallTotal < 149) { alert("MaxxSaver mode ke liye minimum total order value ₹149 honi chahiye!"); return false; }
    }
    return true;
}

function processOrder(paymentType) {
    if(typeof vibe === 'function') vibe();
    if(!validateCheckout()) return;
    let gtEl = document.getElementById('final-gt-hidden');
    if(!gtEl) return;
    let grandTotal = parseInt(gtEl.innerText);

    if(paymentType === 'COD') {
        executeFinalOrder(grandTotal, 'Cash on Delivery');
    } else if (paymentType === 'UPI') {
        let warnModal = document.getElementById('modal-refund-warning');
        if(warnModal) {
            warnModal.style.display = 'flex';
            let shopNameEl = document.getElementById('single-pay-shop-name');
            let amtEl = document.getElementById('single-pay-amount');
            let qrEl = document.getElementById('single-pay-qr');

            if(shopNameEl) shopNameEl.innerText = cartMode === 'max' ? "Gali-Safar Escrow (Multiple Vendors)" : cart[0].shop;
            if(amtEl) amtEl.innerText = "₹" + grandTotal;
            if(qrEl) {
                let qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=galisafar@ybl&pn=GaliSafar&am=${grandTotal}&cu=INR`;
                qrEl.innerHTML = `<img src="${qrUrl}" style="width:150px; height:150px; border-radius:8px;">`;
            }
        } else {
            alert("⚠️️ Online Payment is Non-Refundable! Proceeding to Pay.");
            switchNav('screen-single-pay');
        }
    }
}

function simulateSinglePayment() {
    if(typeof vibe === 'function') vibe(); 
    let btn = document.querySelector('#screen-single-pay .primary-btn');
    if(btn) { btn.innerHTML = "Processing... ⏳"; btn.style.opacity = '0.7'; }
    setTimeout(() => {
        let gtEl = document.getElementById('final-gt-hidden');
        executeFinalOrder(gtEl ? parseInt(gtEl.innerText) : 0, 'UPI (Direct/Manual Ledger)');
        if(btn) { btn.innerHTML = "I have paid ✅"; btn.style.opacity = '1'; }
    }, 1500);
}

// 🚀 BUG FIX: Udhar Khata Advance Payment / Max Limit
function processUdharOrder() {
    if(typeof vibe === 'function') vibe();
    if(!validateCheckout()) return;
    if(cartMode === 'max') return alert("MaxxSaver mode mein Udhar Khata allow nahi hai! (Multiple shops involved). Please switch to Normal Cart or pay via UPI.");

    let shopName = cart[0].shop;
    if(currentUser.khataStatus === 'unlinked') {
        let modal = document.getElementById('udharModal');
        if(modal) modal.style.display = 'flex';
        return;
    }
    
    // Increased safe limit to 10000 to allow smooth transactions
    let pendingAmt = currentUser.khataBalances[shopName] || 0;
    let gtEl = document.getElementById('final-gt-hidden');
    let grandTotal = gtEl ? parseInt(gtEl.innerText) : 0;

    if((pendingAmt + grandTotal) > 10000) {
        let nameEl = document.getElementById('counter-shop-name');
        if(nameEl) nameEl.innerText = shopName;
        let cModal = document.getElementById('modal-udhar-counter');
        if(cModal) cModal.style.display = 'flex';
        return;
    }
    executeFinalOrder(grandTotal, `Udhar Khata`);
}

let activeOrderTimerInterval = null;
function startCancelTimer() {
    let timerDisplay = document.getElementById('cancel-timer-display');
    let cancelBtn = document.getElementById('btn-cancel-order');
    let policyEl = document.getElementById('time-slot-policy');
    let policyStr = policyEl ? policyEl.value : "ASAP";
    let timeRemaining = 300;

    if(policyStr && policyStr !== "ASAP" && !policyStr.includes("Today")) timeRemaining = 3600;

    if(cancelBtn) {
        cancelBtn.style.display = 'block'; cancelBtn.style.opacity = '1'; cancelBtn.style.pointerEvents = 'auto';
        cancelBtn.innerHTML = `Cancel Order (<span id="cancel-timer-display">05:00</span>)`;
    }

    if(activeOrderTimerInterval) clearInterval(activeOrderTimerInterval);

    activeOrderTimerInterval = setInterval(() => {
        timeRemaining--;
        let m = Math.floor(timeRemaining / 60); let s = timeRemaining % 60;
        let tDisplay = document.getElementById('cancel-timer-display');

        if(tDisplay) tDisplay.innerText = `${m < 10 ? '0':''}${m}:${s < 10 ? '0':''}${s}`;

        if (timeRemaining <= 0) {
            clearInterval(activeOrderTimerInterval);
            if(tDisplay) tDisplay.innerText = "00:00";
            if(cancelBtn) { cancelBtn.style.opacity = '0.5'; cancelBtn.style.pointerEvents = 'none'; cancelBtn.innerText = "Order Locked (Packing Started)"; }
        }
    }, 1000);
}

function executeFinalOrder(grandTotal, method) {
    if(typeof vibe === 'function') vibe();

    currentUser.weeklySpend += grandTotal;

    if(appliedCouponCode === 'GALI50') currentUser.isGali50Used = true;
    if(isCoinApplied) { let coinUsed = currentBillDetails.coinDiscount; currentUser.coins -= coinUsed; }

    let orderShopName = cart[0].shop;
    if(method === 'Udhar Khata') {
        if(!currentUser.khataBalances[orderShopName]) currentUser.khataBalances[orderShopName] = 0;
        currentUser.khataBalances[orderShopName] += grandTotal; 
        
        let newPending = 0;
        for(let shop in currentUser.khataBalances) {
            if(currentUser.khataBalances[shop] > 0) newPending += currentUser.khataBalances[shop];
        }
        currentUser.khataPending = newPending;
    }

    let orderId = 'ORD' + Math.floor(Math.random()*10000);
    let orderItemsCopy = JSON.parse(JSON.stringify(cart));
    let shopName = (cartMode === 'max' && activeCartTab === 'kirana') ? "MaxxSaver Split" : cart[0].shop;
    let slotPolicyEl = document.getElementById('time-slot-policy');

    let newOrder = {
        id: orderId, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(),
        items: orderItemsCopy, total: grandTotal, method: method,
        status: 'Accepted', shop: shopName, policy: "Call Me", delivery: deliveryMode,
        schedule: slotPolicyEl ? slotPolicyEl.value : "ASAP",
        billDetails: currentBillDetails, coinsUsed: isCoinApplied ? currentBillDetails.coinDiscount : 0,
        isNonRefundable: (method.includes('UPI'))
    };

    currentUser.orderHistory.unshift(newOrder); currentUser.totalOrdersPlaced++;
    currentUser.activeOrder = newOrder;

    if(currentUser.lastOrderShop === shopName) { currentUser.consecutiveOrders++; }
    else { currentUser.consecutiveOrders = 1; currentUser.lastOrderShop = shopName; }

    let remainingCart = realMultiCart.filter(c => {
        let invItem = masterInventory.find(i => i.id === c.id);
        if(!invItem) return false; 
        let isFruit = invItem.name.toLowerCase().match(/banana|lemon|fruit|apple|mango/);
        let isFreshOrDairy = ['fresh', 'dairy'].includes(invItem.cat) || invItem.isPieceBased;

        if (activeCartTab === 'kirana') return isFreshOrDairy; 
        if (activeCartTab === 'fruits') return !isFreshOrDairy || !isFruit; 
        if (activeCartTab === 'veg') return !isFreshOrDairy || isFruit; 
        return true;
    });

    realMultiCart = remainingCart;
    cartMode = 'normal'; deliveryMode = 'home'; isCoinApplied = false; appliedCouponCode = "";

    let coinCb = document.getElementById('use-coin-cb'); if(coinCb) coinCb.checked = false;
    let couponInput = document.getElementById('coupon-code'); if(couponInput) couponInput.value = "";

    syncCart(); updateBadge();
    if(typeof updateCoinsUI === 'function') updateCoinsUI();
    if(typeof updateKhataUI === 'function') updateKhataUI();
    saveState();

    window.history.replaceState(null, '', '#home');
    window.history.pushState(null, '', '#success');
    if(typeof handleHashRouting === 'function') handleHashRouting();

    let subTextEl = document.getElementById('success-subtext');
    if(subTextEl) subTextEl.innerText = `${shopName} has received your order.`;

    startCancelTimer();
    if(typeof initScratchCard === 'function') initScratchCard(orderId);
}

function cancelActiveOrder() {
    if (!currentUser.activeOrder) {
        return; 
    }

    if(currentUser.activeOrder.isNonRefundable) {
        alert("⚠️ This order was placed via Online Payment and cannot be cancelled automatically.");
        return;
    }

    if(confirm("Are you sure you want to cancel this order?")) {
        if(activeOrderTimerInterval) clearInterval(activeOrderTimerInterval);
        currentUser.activeOrder.status = 'Cancelled';

        currentUser.weeklySpend -= currentUser.activeOrder.total;
        if(currentUser.weeklySpend < 0) currentUser.weeklySpend = 0;

        if(currentUser.activeOrder.method === 'Udhar Khata') {
            currentUser.khataBalances[currentUser.activeOrder.shop] -= currentUser.activeOrder.total;
            
            let newPending = 0;
            for(let shop in currentUser.khataBalances) {
                if(currentUser.khataBalances[shop] > 0) newPending += currentUser.khataBalances[shop];
            }
            currentUser.khataPending = newPending;
        }

        if(currentUser.activeOrder.coinsUsed && currentUser.activeOrder.coinsUsed > 0) {
            currentUser.coins += currentUser.activeOrder.coinsUsed;
        }

        let relatedCardIndex = currentUser.scratchCards.findIndex(c => c.orderRef === currentUser.activeOrder.id);
        if (relatedCardIndex > -1) {
            let card = currentUser.scratchCards[relatedCardIndex];
            if (card.status === 'pending') { currentUser.scratchCards.splice(relatedCardIndex, 1); }
            else if (card.status === 'scratched') {
                if (!card.isReferral) { currentUser.coins -= card.reward; currentUser.lifetimeCoins -= card.reward; }
            }
        }

        currentUser.activeOrder = null;
        if(typeof updateCoinsUI === 'function') updateCoinsUI();
        if(typeof updateKhataUI === 'function') updateKhataUI();
        if(typeof renderOrdersScreen === 'function') renderOrdersScreen();
        saveState();
        alert("Order cancelled successfully. Adjustments applied.");
    }
}

function smartReorder(orderId) {
    if(typeof vibe === 'function') vibe();
    let pastOrder = currentUser.orderHistory.find(o => o.id === orderId);
    if(!pastOrder) return alert("Order nahi mila!");

    realMultiCart = [];
    pastOrder.items.forEach(item => {
        let freshItem = masterInventory.find(i => i.id === item.id);
        if(freshItem) {
            addToCart(freshItem.id, freshItem.name, freshItem.basePrice, pastOrder.shop, freshItem.img);
            if(item.qty > 1) { updateQty(freshItem.id, pastOrder.shop, item.qty - 1); }
        }
    });

    if(typeof showToast === 'function') showToast("Checking best prices... 🔍");
    setTimeout(() => {
        cartMode = 'max';
        syncCart();
        renderCart();
        switchNav('screen-cart', 'nav-cart');
        triggerMaxModeAnimation();
    }, 800);
}

function renderOrdersScreen(filterType = 'All') {
    let listContainer = document.getElementById('my-orders-list');
    if(!listContainer) return;

    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    let activeTab = document.getElementById(`tab-${filterType.split(' ')[0]}`);
    if(activeTab) activeTab.classList.add('active');

    let ordersToShow = currentUser.orderHistory;

    if (filterType !== 'All') {
        if (filterType === 'UPI') {
            ordersToShow = ordersToShow.filter(o => o.method.includes('UPI'));
        } else if (filterType === 'Cash') { // 🚀 BUG FIX: Cash filter fixed
            ordersToShow = ordersToShow.filter(o => o.method.includes('Cash'));
        } else {
            ordersToShow = ordersToShow.filter(o => o.method === filterType);
        }
    }

    if(ordersToShow.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center; padding: 40px; color:#64748b;">No past orders found for ${filterType}.</div>`;
        return;
    }

    let html = "";
    ordersToShow.forEach(order => {
        let statusColor = order.status === 'Cancelled' ? '#ef4444' : (order.status === 'Delivered' ? '#16a34a' : '#ff6b00');
        let itemsText = order.items.slice(0, 2).map(i => `${i.qty}x ${i.name}`).join(', ');
        if(order.items.length > 2) itemsText += ` + ${order.items.length - 2} more`;

        html += `
        <div class="order-history-card" style="padding: 15px; margin-bottom: 15px; background: white; border-radius: 16px; border: 1px solid #e2e8f0;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h4 style="font-size:14px; font-weight:800; color:#1e293b;">${order.shop}</h4>
                <span style="font-size:11px; font-weight:800; color:${statusColor}; background:${statusColor}22; padding:3px 8px; border-radius:6px;">${order.status.toUpperCase()}</span>
            </div>
            <p style="font-size:12px; color:#64748b; font-weight:600; margin-bottom:10px;">${order.date} • ${order.time} • ${order.method}</p>
            <div style="background:#f8fafc; padding:10px; border-radius:8px; border:1px dashed #cbd5e1; font-size:11px; color:#475569; margin-bottom:10px;">
                ${itemsText}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h4 style="font-size:16px; font-weight:900; color:#1e293b;">₹${order.total}</h4>
                <button class="btn-outline" style="width:auto; padding:6px 15px; margin:0; border-color: #ff6b00; color: #ff6b00;" onclick="smartReorder('${order.id}')">Reorder 🔄</button>
            </div>
        </div>`;
    });

    listContainer.innerHTML = html;
}

// 🚀 SPECIAL REQUEST (Navi App Style): Flying Coin Animation Logic
function flyCoinsToWallet(amount) {
    let walletIcon = document.querySelector('.coin-badge');
    let walletRect = walletIcon ? walletIcon.getBoundingClientRect() : { left: window.innerWidth - 60, top: 20, width: 40, height: 40 };
    let cardCanvas = document.getElementById('scratch-canvas');
    let cardRect = cardCanvas ? cardCanvas.getBoundingClientRect() : { left: window.innerWidth/2, top: window.innerHeight/2, width: 200, height: 150 };

    for(let i=0; i<15; i++) {
        let coin = document.createElement('div');
        coin.innerText = '🪙';
        coin.style.position = 'fixed';
        coin.style.left = (cardRect.left + cardRect.width/2) + 'px';
        coin.style.top = (cardRect.top + cardRect.height/2) + 'px';
        coin.style.fontSize = '30px';
        coin.style.zIndex = '99999';
        coin.style.pointerEvents = 'none';
        coin.style.transition = `all 0.8s cubic-bezier(0.25, 0.8, 0.25, 1) ${i * 0.05}s`;
        document.body.appendChild(coin);

        setTimeout(() => {
            coin.style.transform = `translate(${(Math.random() - 0.5) * 150}px, ${(Math.random() - 0.5) * 150}px) scale(1.2)`;
        }, 20);

        setTimeout(() => {
            coin.style.left = (walletRect.left + walletRect.width/2 - 15) + 'px';
            coin.style.top = (walletRect.top + walletRect.height/2 - 15) + 'px';
            coin.style.transform = 'scale(0.4)';
            coin.style.opacity = '0';
        }, 500 + (i * 50));

        setTimeout(() => coin.remove(), 2000);
    }
}
