// ==========================================
// 📄 1. PARCHI SCANNER & ROUTING ENGINE (PHASE 5 UPDATED)
// ==========================================
let parchiItems = [];
let scanTarget = 'cart';

function processParchiScan(event) {
    vibe();
    let file = event.target.files[0];
    if(!file) return;
    
    showToast("Parchi scan ho rahi hai... AI text read kar raha hai ⏳");
    
    setTimeout(() => {
        // Mocking real-world user handwritten parchi data
        parchiItems = [
            { id: 'p_ext_1', name: "Aashirvaad Atta (5kg)", qty: 1, unit: "Pkt", basePrice: 220 }, 
            { id: 'p_sub_1', name: "Yippee Noodles", qty: 4, unit: "Pkt", basePrice: 15 }, 
            { id: 'p_oos_1', name: "Imported Dragon Fruit", qty: 2, unit: "Kg", basePrice: 350 } 
        ];
        
        if(scanTarget === 'schedule' || scanTarget === 'monthly') {
            parchiItems.forEach(item => { if(typeof addToScheduleCart === 'function') addToScheduleCart(item.id, item.qty); });
            showToast("Parchi items added to schedule! ✅");
        } else {
            renderParchiList();
            if(typeof switchNav === 'function') switchNav('screen-parchi-verify', null);
        }
    }, 1500);
}

function renderParchiList() {
    let listEl = document.getElementById('parchi-verify-list');
    if(!listEl) return;
    
    let html = '';
    parchiItems.forEach((item, index) => {
        let estTotal = item.basePrice * item.qty; 
        html += `
        <div class="verify-row" style="display:flex; justify-content:space-between; align-items:center; background:white; padding:15px; border-radius:12px; margin-bottom:10px; border:1px solid #e2e8f0;">
            <div style="flex: 1; margin-right: 10px;">
                <!-- 🚀 BUG FIX: oninput added so typed name is not lost when qty is changed -->
                <input type="text" class="verify-input" value="${item.name}" oninput="parchiItems[${index}].name = this.value" style="width:100%; border:none; outline:none; font-weight:800; font-size:14px; color:#1e293b; background:transparent;">
                <div style="display: flex; gap: 10px; align-items: center; margin-top:5px;">
                    <span style="font-size:11px; padding:3px 6px; border-radius:4px; color:#64748b; background:#f1f5f9;">${item.unit}</span>
                    <span style="font-size:11px; color:#059669; font-weight: 600;">Est. ₹${estTotal}</span>
                </div>
            </div>
            <div class="parchi-qty-controls" style="display:flex; align-items:center; gap:10px; background:#f1f5f9; padding:5px 10px; border-radius:8px;">
                <button onclick="changeParchiQty(${index}, -1)" style="border:none; background:none; font-weight:bold; font-size:16px; cursor:pointer;">-</button>
                <span style="font-size:13px; font-weight:bold; width:15px; text-align:center;">${item.qty}</span>
                <button onclick="changeParchiQty(${index}, 1)" style="border:none; background:none; color:var(--success); font-weight:bold; font-size:16px; cursor:pointer;">+</button>
            </div>
        </div>`;
    });
    listEl.innerHTML = html;
}

function changeParchiQty(index, change) {
    vibe();
    if(parchiItems[index].qty + change > 0) { 
        parchiItems[index].qty += change; 
        renderParchiList(); 
    } else if (parchiItems[index].qty + change === 0) { 
        parchiItems.splice(index, 1); 
        renderParchiList(); 
    }
}

function addManualItemToParchi() {
    vibe();
    parchiItems.push({ id: 'p_new_'+Date.now(), name: "Naya Item Likhein", qty: 1, unit: "Pkt", basePrice: 50 });
    renderParchiList();
}

function generateParchiRoutes() {
    vibe();
    if(parchiItems.length === 0) return alert("Parchi khali hai!");
    
    window.parchiExactMatches = [];
    window.parchiSubMatches = [];
    let oosMatches = [];

    parchiItems.forEach(item => {
        let term = item.name.toLowerCase();
        let exact = masterInventory.find(i => i.name.toLowerCase() === term);
        
        if(exact) {
            parchiExactMatches.push({ ...exact, parchiQty: item.qty });
        } else {
            let sub = masterInventory.find(i => {
                let iName = i.name.toLowerCase();
                return (term.includes('noodle') && iName.includes('noodle')) ||
                       (term.includes('chini') && iName.includes('chini'));
            });

            if(!sub && term.includes('yippee')) sub = masterInventory.find(i => i.name.includes('Maggi'));

            if(sub) {
                parchiSubMatches.push({ originalName: item.name, substitute: sub, parchiQty: item.qty });
            } else {
                oosMatches.push(item);
            }
        }
    });

    let exactHtml = '';
    if(parchiExactMatches.length > 0) {
        exactHtml += `<h4 style="font-size:13px; font-weight:800; color:#166534; margin-bottom:8px;">✅ EXACT MATCHES</h4>`;
        parchiExactMatches.forEach(match => {
            exactHtml += `
            <div class="parchi-match-card exact">
                <div>
                    <span class="parchi-badge exact">Found</span>
                    <h4 style="font-size:14px; font-weight:800; color:#1e293b; margin-top:4px;">${match.name}</h4>
                    <p style="font-size:11px; color:#64748b;">${match.parchiQty} ${match.loose ? 'kg' : 'pc'} • ₹${match.basePrice}</p>
                </div>
                <img src="${match.img}" style="width:45px; height:45px; object-fit:contain; border-radius:8px; border: 1px solid #e2e8f0;">
            </div>`;
        });
    }
    document.getElementById('parchi-exact-match').innerHTML = exactHtml;

    let subHtml = '';
    if(parchiSubMatches.length > 0) {
        subHtml += `<h4 style="font-size:13px; font-weight:800; color:#b45309; margin-bottom:8px; margin-top:15px;">⚠️ BRAND CHOICE (SUBSTITUTE)</h4>`;
        parchiSubMatches.forEach(match => {
            subHtml += `
            <div class="parchi-match-card sub">
                <div>
                    <span class="parchi-badge sub">Replaced: ${match.originalName}</span>
                    <h4 style="font-size:14px; font-weight:800; color:#1e293b; margin-top:4px;">${match.substitute.name}</h4>
                    <p style="font-size:11px; color:#64748b;">${match.parchiQty} ${match.substitute.loose ? 'kg' : 'pc'} • ₹${match.substitute.basePrice}</p>
                </div>
                <img src="${match.substitute.img}" style="width:45px; height:45px; object-fit:contain; border-radius:8px; border: 1px solid #fde68a;">
            </div>`;
        });
    }
    document.getElementById('parchi-sub-match').innerHTML = subHtml;

    let oosHtml = '';
    if(oosMatches.length > 0) {
        oosHtml += `<h4 style="font-size:13px; font-weight:800; color:#b91c1c; margin-bottom:8px; margin-top:15px;">❌ OUT OF STOCK</h4>`;
        oosMatches.forEach(match => {
            oosHtml += `
            <div class="parchi-match-card oos">
                <div>
                    <span class="parchi-badge oos">Unavailable</span>
                    <h4 style="font-size:14px; font-weight:800; color:#1e293b; margin-top:4px; text-decoration:line-through;">${match.name}</h4>
                    <p style="font-size:11px; color:#64748b;">Aas-paas ki kisi dukaan par nahi mila.</p>
                </div>
            </div>`;
        });
    }
    document.getElementById('parchi-oos-match').innerHTML = oosHtml;

    let cartBtn = document.getElementById('parchi-add-cart-btn');
    if(cartBtn) {
        if(parchiExactMatches.length > 0 || parchiSubMatches.length > 0) cartBtn.style.display = 'block';
        else cartBtn.style.display = 'none';
    }

    if(typeof switchNav === 'function') switchNav('screen-parchi-route', null);
}

function addParchiToCart() {
    vibe();
    let shopName = shopsData[0].name; 
    let itemsAdded = 0;
    
    if(window.parchiExactMatches) {
        window.parchiExactMatches.forEach(item => {
            for(let i=0; i<item.parchiQty; i++) {
                if(typeof addToCart === 'function') addToCart(item.id, item.name, item.basePrice, shopName, item.img);
            }
            itemsAdded++;
        });
    }
    
    if(window.parchiSubMatches) {
        window.parchiSubMatches.forEach(match => {
            for(let i=0; i<match.parchiQty; i++) {
                if(typeof addToCart === 'function') addToCart(match.substitute.id, match.substitute.name, match.substitute.basePrice, shopName, match.substitute.img);
            }
            itemsAdded++;
        });
    }
    
    if(itemsAdded > 0) {
        showToast("Parchi items added to Cart! 🛒");
        if(typeof switchNav === 'function') switchNav('screen-cart');
    } else {
        alert("Oops! Koi saaman add nahi ho paya.");
    }
}

// ==========================================
// 📒 2. UDHAR KHATA SYSTEM
// ==========================================
function updateKhataUI() {
    if(currentUser.khataStatus === 'linked') {
        let cardsHtml = ""; let hasActiveKhata = false;

        for(let shop in currentUser.khataBalances) {
            hasActiveKhata = true;
            let bal = currentUser.khataBalances[shop];

            if(bal > 0) {
                cardsHtml += `<div class="khata-card" onclick="openPassbook('${shop}')">
                    <div>
                        <p style="font-size:14px; font-weight:900; color:#fbbf24; margin-bottom:2px;">🏪 ${shop.toUpperCase()}</p>
                        <h2 style="font-size:26px; font-weight:900; margin-top:4px;">₹${bal}</h2>
                        <p style="font-size:11px; margin-top:4px; color:#cbd5e1;">Due in 15 days</p>
                    </div>
                    <div style="text-align:right;">
                        <div style="background:rgba(255,255,255,0.15); width:40px; height:40px; border-radius:50%; display:inline-flex; justify-content:center; align-items:center; font-size:18px; margin-bottom:10px;">🧾</div>
                        <p style="font-size:11px; font-weight:800; color:var(--success);">PAY NOW ➔</p>
                    </div>
                </div>`;
            } else {
                 cardsHtml += `<div class="khata-card" style="background: linear-gradient(135deg, #16a34a, #15803d);" onclick="openPassbook('${shop}')">
                    <div>
                        <p style="font-size:14px; font-weight:900; color:#d1fae5; margin-bottom:2px;">🏪 ${shop.toUpperCase()}</p>
                        <h2 style="font-size:26px; font-weight:900; margin-top:4px;">₹0</h2>
                        <p style="font-size:11px; margin-top:4px; color:#a7f3d0;">NO DUES ✅</p>
                    </div>
                    <div style="text-align:right;">
                        <div style="background:rgba(255,255,255,0.15); width:40px; height:40px; border-radius:50%; display:inline-flex; justify-content:center; align-items:center; font-size:18px; margin-bottom:10px;">📒</div>
                        <p style="font-size:11px; font-weight:800; color:#ecfdf5;">VIEW ➔</p>
                    </div>
                </div>`;
            }
        }

        let container = document.getElementById('khata-cards-container');
        if(container) {
            if(hasActiveKhata) container.innerHTML = cardsHtml;
            else container.innerHTML = "<p style='font-size:13px; color:#64748b; text-align:center; padding: 20px;'>Aapka koi outstanding udhar nahi hai. 🎉</p>";
        }

        let kycBox = document.getElementById('khata-kyc-box');
        if(kycBox) kycBox.style.display = 'none';
    } else {
        let kycBox = document.getElementById('khata-kyc-box');
        if(kycBox) {
            kycBox.style.display = 'block';
            kycBox.innerHTML = `
                <div style="font-size: 40px; margin-bottom: 10px;">🤳</div>
                <h3 style="font-size: 16px; font-weight: 800; color: #1e293b;">Start 1-Tap Udhar</h3>
                <p style="font-size: 12px; color: #64748b; margin-bottom: 15px;">Trust build karne ke liye ek baar apna face verify karein aur khata shuru karein.</p>
                <button class="primary-btn" onclick="document.getElementById('udharModal').style.display='flex'">Setup Udhar Khata ➔</button>
            `;
        }
    }
}

function updateProfileKhataUI() {
    let balEl = document.getElementById('profile-udhar-val');
    if(balEl) {
        if(currentUser.khataPending > 0) {
            balEl.innerText = `₹${currentUser.khataPending}`;
            balEl.style.color = 'var(--danger)';
            balEl.nextElementSibling.innerHTML = `Udhar<br><span style="font-size:8px; color:var(--danger);">Dues Pending</span>`;
        } else {
            balEl.innerText = `₹0`;
            balEl.style.color = 'var(--success)';
            balEl.nextElementSibling.innerHTML = `Udhar<br><span style="font-size:8px; color:var(--success);">Clear ✅</span>`;
        }
    }
}

function deductKhata(method) {
    vibe();
    let payAmtInput = document.getElementById('pay-amount-input');
    if(!payAmtInput) return;
    let payAmt = parseInt(payAmtInput.value);

    if(isNaN(payAmt) || payAmt <= 0) return alert("Sahi amount daalein!");

    let shopName = typeof currentlyOpeningShop !== 'undefined' ? currentlyOpeningShop : "Sharma Store";
    let currentBal = currentUser.khataBalances[shopName] || 0;

    if(payAmt > currentBal) return alert("Aapne pending amount se zyada daal diya hai!");

    if(method === 'upi') {
        let btn = document.querySelector('#khataPassbookModal .btn-full');
        if(btn) btn.innerHTML = "Processing UPI... ⏳";
        setTimeout(() => {
            completeKhataDeduction(shopName, payAmt, 'UPI');
            if(btn) btn.innerHTML = "Pay via UPI ⚡";
        }, 1500);
    } else if (method === 'coins') {
        if(currentUser.coins < payAmt) return alert("Aapke paas itne Gali-Coins nahi hain!");
        let confirmCoin = confirm(`Kya aap ${payAmt} Gali-Coins use karke udhar settle karna chahte hain?`);
        if(confirmCoin) {
            currentUser.coins -= payAmt;
            if(typeof updateCoinsUI === 'function') updateCoinsUI();
            completeKhataDeduction(shopName, payAmt, 'Gali-Coins');
        }
    }
}

function completeKhataDeduction(shopName, payAmt, paymentMethod) {
    currentUser.khataBalances[shopName] -= payAmt;
    currentUser.khataPending -= payAmt;
    currentUser.khataHistory.unshift({ timestamp: Date.now(), date: new Date().toLocaleDateString(), amount: payAmt, shop: shopName, type: 'settlement', method: paymentMethod });

    showToast(`₹${payAmt} settled to ${shopName} via ${paymentMethod}! ✅`);
    document.getElementById('khataPassbookModal').style.display='none';
    if(typeof updateKhataUI === 'function') updateKhataUI();
    if(typeof updateProfileKhataUI === 'function') updateProfileKhataUI();
    saveState();
}

function setupKhataAndOrder() {
    vibe();
    document.getElementById('udharModal').style.display = 'none';
    currentUser.khataStatus = 'linked';
    showToast("Face Verified! Khata Linked ✅");
    saveState();

    let gtEl = document.getElementById('final-gt-hidden');
    if(gtEl && typeof executeFinalOrder === 'function') {
        executeFinalOrder(parseInt(gtEl.innerText), `Udhar Khata`);
    } else if (typeof updateKhataUI === 'function') {
        updateKhataUI();
    }
}

function previewSelfie(event) {
    let file = event.target.files[0];
    if(!file) return;
    let reader = new FileReader();
    reader.onload = function(e) {
        let img = document.getElementById('selfie-img');
        if(img) {
            img.src = e.target.result;
            img.style.display = 'block';
        }
        let camIcon = document.getElementById('cam-icon');
        if(camIcon) camIcon.style.display = 'none';

        currentUser.photo = e.target.result;
        saveState();
        if(typeof initProfilePic === 'function') initProfilePic();

        let sendBtn = document.getElementById('send-udhar-btn');
        if(sendBtn) {
            sendBtn.disabled = false;
            sendBtn.style.opacity = '1';
            sendBtn.style.pointerEvents = 'auto';
            sendBtn.innerText = "Save & Link Khata ✅";
        }
    };
    reader.readAsDataURL(file);
}

function searchShopForKhata() {
    let searchEl = document.getElementById('khata-shop-search');
    let res = document.getElementById('khata-search-results');
    if(!searchEl || !res) return;

    let term = searchEl.value.toLowerCase();
    if(term.length < 2) { res.innerHTML = ""; return; }

    let matched = shopsData.filter(s => s.name.toLowerCase().includes(term));
    let html = "";
    matched.slice(0,3).forEach(s => {
        let bal = currentUser.khataBalances[s.name] || 0;
        let actionBtn = bal > 0 ?
            `<button style="background:white; color:var(--success); border:1px solid var(--success); padding:6px 12px; border-radius:6px; font-weight:800; font-size:12px;" onclick="openPassbook('${s.name}')">Pay ₹${bal}</button>` :
            `<button style="background:var(--secondary); color:white; border:none; padding:6px 12px; border-radius:6px; font-weight:800; font-size:12px;" onclick="requestKhataFromShop('${s.name}')">Request Khata ➕</button>`;

        html += `<div style="background:white; padding:15px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
            <div><h4 style="font-size:14px; font-weight:800; color:#1e293b;">${s.name}</h4><p style="font-size:11px; color:#64748b;">${s.dist}m away</p></div>${actionBtn}
        </div>`;
    });
    res.innerHTML = html;
}

function requestKhataFromShop(shopName) {
    vibe();
    if(currentUser.khataStatus === 'unlinked') {
        document.getElementById('udharModal').style.display = 'flex';
        return;
    }
    alert(`Khata request sent to ${shopName}. They will approve it shortly.`);
    currentUser.khataRequests[shopName] = 'pending';

    setTimeout(() => {
        currentUser.khataRequests[shopName] = 'approved';
        saveState();
        showToast(`Your Udhar Khata request for ${shopName} is Approved! ✅`);
        if(typeof updateKhataUI === 'function') updateKhataUI();
    }, 10000);

    saveState();
    if(typeof updateKhataUI === 'function') updateKhataUI();
}

function openPassbook(shopName) {
    vibe(); currentlyOpeningShop = shopName;
    document.getElementById('khataPassbookModal').style.display = 'flex';
    let bal = currentUser.khataBalances[shopName] || 0;
    
    let totalEl = document.getElementById('passbook-total');
    if(totalEl) {
        totalEl.innerText = "₹" + bal;
        if(bal > 0) totalEl.style.color = '#dc2626'; 
        else totalEl.style.color = '#16a34a'; 
    }

    let payInput = document.getElementById('pay-amount-input');
    if(payInput) payInput.value = bal > 0 ? bal : "";

    let qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=upi://pay?pa=${shopName.replace(/\s+/g, '').toLowerCase()}@ybl&pn=${shopName}&am=${bal}&cu=INR`;
    let qrBox = document.getElementById('qr-dynamic-box');
    if(qrBox) {
        qrBox.innerHTML = `<img src="${qrUrl}" style="width:90px; height:90px; border-radius:8px;"><div style="text-align:left;"><h4 style="font-size:14px; font-weight:800; color:#1e293b;">Pay ${shopName}</h4><p style="font-size:11px; color:#64748b;">Scan with any app</p></div>`;
    }

    let listHtml = "";
    let shopHist = currentUser.khataHistory.filter(h => h.shop === shopName);
    let shopOrders = currentUser.orderHistory.filter(o => o.method === 'Udhar Khata' && o.shop === shopName && o.status !== 'Cancelled');

    let combined = [...shopHist, ...shopOrders].sort((a,b) => {
        let timeA = a.timestamp || new Date(a.date + " " + (a.time || "00:00:00")).getTime();
        let timeB = b.timestamp || new Date(b.date + " " + (b.time || "00:00:00")).getTime();
        return timeB - timeA;
    });

    combined.forEach(entry => {
        if(entry.type === 'settlement') {
            listHtml += `<details style="background:white; margin-bottom:5px; border-radius:8px; border:1px solid #f1f5f9;"><summary style="display:flex; justify-content:space-between; padding:12px; cursor:pointer;"><div style="display:flex; gap:10px;"><span style="font-size:20px;">✅</span><div><h4 style="font-size:13px; font-weight:800; color:#1e293b;">Payment Sent</h4><p style="font-size:11px; color:#64748b;">${entry.date}</p></div></div><div style="font-weight:800; color:var(--success);">+₹${entry.amount}</div></summary></details>`;
        } else {
            let itemsString = entry.items ? entry.items.map(i => `${i.qty}x ${i.name}`).join('<br>') : "Items data missing";
            listHtml += `<details style="background:white; margin-bottom:5px; border-radius:8px; border:1px solid #f1f5f9;"><summary style="display:flex; justify-content:space-between; padding:12px; cursor:pointer;"><div style="display:flex; gap:10px;"><span style="font-size:20px;">🛍️</span><div><h4 style="font-size:13px; font-weight:800; color:#1e293b;">Items Bought</h4><p style="font-size:11px; color:#64748b;">${entry.date}</p></div></div><div style="font-weight:800; color:#dc2626;">-₹${entry.total}</div></summary><div style="padding: 10px 15px; font-size:11px; color:#64748b; background:#f8fafc; border-top:1px dashed #cbd5e1;">${itemsString}</div></details>`;
        }
    });

    let pbList = document.getElementById('passbook-list');
    if(pbList) {
        pbList.innerHTML = listHtml || "<p style='text-align:center; font-size:12px; color:#94a3b8; padding:10px;'>No history yet.</p>";
    }
}

function closePassbook(e) {
    if(e.target.id === 'khataPassbookModal') {
        document.getElementById('khataPassbookModal').style.display='none';
    }
}

// ==========================================
// 🎟️ 3. SCRATCH CARDS & CONFETTI REWARDS
// ==========================================
function createDust(x, y, wrapperId) {
    let wrapper = document.getElementById(wrapperId);
    if(!wrapper) return;
    let dust = document.createElement('div');
    dust.style.position = 'absolute';
    dust.style.left = x + 'px';
    dust.style.top = y + 'px';
    dust.style.width = (Math.random() * 4 + 2) + 'px';
    dust.style.height = dust.style.width;
    dust.style.background = '#d97706'; 
    dust.style.borderRadius = '50%';
    dust.style.pointerEvents = 'none';
    dust.style.zIndex = '4';
    dust.style.transition = 'all 0.5s ease-out';
    wrapper.appendChild(dust);
    
    setTimeout(() => {
        dust.style.transform = `translate(${(Math.random() - 0.5) * 40}px, ${Math.random() * 40 + 20}px)`;
        dust.style.opacity = '0';
    }, 10);
    
    setTimeout(() => dust.remove(), 500);
}

function initScratchCard(orderId) {
    let winAmt = 0;
    let currentOrderCount = currentUser.totalOrdersPlaced;

    if (currentOrderCount % 10 === 1) currentUser.blockWins = 0;

    let isWin = Math.random() < 0.6;
    if (isWin) {
        winAmt = (currentOrderCount < 5) ? (Math.floor(Math.random() * 5) + 5) : (Math.floor(Math.random() * 3) + 1);
    }

    let isReferral = (Math.random() > 0.85 && isWin);
    let cardId = 'card_' + Date.now();
    let htmlContent = "";

    if (!isWin) {
        htmlContent = `<h2 style="font-size:35px; margin-bottom:5px;">😢</h2><h3 style="font-size:18px; font-weight:900;">Better Luck Next Time</h3><p style="font-size:12px; font-weight:600; color:#b45309;">Keep ordering!</p>`;
        currentUser.scratchCards.push({ id: cardId, orderRef: orderId, type: 'empty', reward: 0, isReferral: false, status: 'pending', html: htmlContent });
    } else if (isReferral) {
        htmlContent = `<h2 style="font-size:35px; margin-bottom:5px;">🤝</h2><h3 style="font-size:18px; font-weight:900;">Share & Earn!</h3><p style="font-size:12px; font-weight:600; color:#b45309;">Share link to get 20 Coins.</p>`;
        currentUser.scratchCards.push({ id: cardId, orderRef: orderId, type: 'referral', reward: 20, isReferral: true, status: 'pending', html: htmlContent });
    } else {
        htmlContent = `<h2 style="font-size:35px; margin-bottom:5px;">🪙</h2><h3 style="font-size:24px; font-weight:900;">${winAmt} Coins</h3>`;
        currentUser.scratchCards.push({ id: cardId, orderRef: orderId, type: 'coins', reward: winAmt, isReferral: false, status: 'pending', html: htmlContent });
    }
    saveState();

    let canvas = document.getElementById('scratch-canvas');
    if(!canvas) return;
    let ctx = canvas.getContext('2d');
    canvas.width = 260; canvas.height = 150;

    let gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#f59e0b"); gradient.addColorStop(1, "#d97706");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "bold 20px Poppins"; ctx.fillStyle = "#ffffff"; ctx.textAlign = "center";
    ctx.fillText("💰 Scratch Here!", canvas.width/2, canvas.height/2);

    let rewardContent = document.getElementById('success-reward-content');
    let scratchWrapper = document.getElementById('success-scratch-wrapper');
    if(rewardContent) rewardContent.innerHTML = htmlContent;
    if(scratchWrapper) scratchWrapper.classList.add('drop-in-bounce');

    let isDrawing = false;
    let cardRevealed = false;

    function getTouchPos(e) {
        let rect = canvas.getBoundingClientRect();
        let clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
        let clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function scratchStart(e) {
        if(cardRevealed) return;
        e.preventDefault();
        isDrawing = true;
        let suspense = document.getElementById('scratch-suspense-layer');
        if(suspense) suspense.style.display = 'none';
        vibe();
    }

    function scratchEnd() { isDrawing = false; }

    function scratchMove(e) {
        if(!isDrawing || cardRevealed) return;
        e.preventDefault();
        let pos = getTouchPos(e);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 25, 0, Math.PI*2); ctx.fill();

        if(Math.random() > 0.4) createDust(pos.x, pos.y, 'success-scratch-wrapper');

        let revealed = checkReveal(canvas, ctx, cardId, isWin, isReferral, winAmt, 'success-reward-content', 'screen-success', 'scratch-hint-text', 'wa-buttons-container');
        if(revealed) cardRevealed = true;
    }

    canvas.addEventListener('click', function(e) {
        if(!cardRevealed) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let suspense = document.getElementById('scratch-suspense-layer');
            if(suspense) suspense.style.display = 'none';
            
            let revealed = checkReveal(canvas, ctx, cardId, isWin, isReferral, winAmt, 'success-reward-content', 'screen-success', 'scratch-hint-text', 'wa-buttons-container');
            if(revealed) cardRevealed = true;
        }
    });

    canvas.addEventListener('mousedown', scratchStart); canvas.addEventListener('touchstart', scratchStart, {passive: false});
    canvas.addEventListener('mousemove', scratchMove); canvas.addEventListener('touchmove', scratchMove, {passive: false});
    canvas.addEventListener('mouseup', scratchEnd); canvas.addEventListener('touchend', scratchEnd);
}

function openStandaloneScratch(cardId) {
    vibe();
    let card = currentUser.scratchCards.find(c => c.id === cardId);
    if(!card) return;

    let modal = document.getElementById('standaloneScratchModal');
    let rewardContent = document.getElementById('standalone-reward-content');
    if(!modal || !rewardContent) return;

    modal.style.display = 'flex';
    rewardContent.innerHTML = card.html;
    rewardContent.classList.remove('animate-pop');

    let canvas = document.getElementById('standalone-scratch-canvas');
    if(!canvas) return;

    canvas.replaceWith(canvas.cloneNode(true));
    canvas = document.getElementById('standalone-scratch-canvas');

    let ctx = canvas.getContext('2d');
    canvas.width = 260; canvas.height = 150; canvas.style.opacity = '1';

    let gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#f59e0b"); gradient.addColorStop(1, "#d97706");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "bold 20px Poppins"; ctx.fillStyle = "#ffffff"; ctx.textAlign = "center";
    ctx.fillText("💰 Scratch Here!", canvas.width/2, canvas.height/2);

    let isDrawing = false;
    let cardRevealed = false;

    function getTouchPos(e) {
        let rect = canvas.getBoundingClientRect();
        let clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
        let clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function scratchStart(e) {
        if(cardRevealed) return;
        e.preventDefault();
        isDrawing = true;
        vibe();
    }
    function scratchEnd() { isDrawing = false; }
    function scratchMove(e) {
        if(!isDrawing || cardRevealed) return;
        e.preventDefault();
        let pos = getTouchPos(e);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 25, 0, Math.PI*2); ctx.fill();

        if(Math.random() > 0.4) createDust(pos.x, pos.y, 'standaloneScratchModal');

        let revealed = checkReveal(canvas, ctx, cardId, card.type !== 'empty', card.isReferral, card.reward, 'standalone-reward-content', 'standaloneScratchModal', 'standalone-hint-text', null);
        if(revealed) cardRevealed = true;
    }

    canvas.addEventListener('click', function(e) {
        if(!cardRevealed) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let revealed = checkReveal(canvas, ctx, cardId, card.type !== 'empty', card.isReferral, card.reward, 'standalone-reward-content', 'standaloneScratchModal', 'standalone-hint-text', null);
            if(revealed) cardRevealed = true;
        }
    });

    canvas.addEventListener('mousedown', scratchStart); canvas.addEventListener('touchstart', scratchStart, {passive: false});
    canvas.addEventListener('mousemove', scratchMove); canvas.addEventListener('touchmove', scratchMove, {passive: false});
    canvas.addEventListener('mouseup', scratchEnd); canvas.addEventListener('touchend', scratchEnd);
}

function checkReveal(canvas, ctx, cardId, isWin, isReferral, winAmt, contentId, confettiContainerId, hintTextId, waContainerId) {
    let imgData = ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let cleared = 0;
    for(let i=3; i<imgData.length; i+=4) if(imgData[i] === 0) cleared++;

    let card = currentUser.scratchCards.find(c => c.id === cardId);
    if(card && card.status === 'scratched') return true;

    if(cleared / (canvas.width * canvas.height) > 0.45) {
        canvas.style.opacity = '0';
        let contentEl = document.getElementById(contentId);
        if(contentEl) contentEl.classList.add('animate-pop');

        if (isWin) startConfetti(confettiContainerId);
        vibe(); setTimeout(vibe, 150);

        let hintEl = document.getElementById(hintTextId);
        let waEl = document.getElementById(waContainerId);

        if(card) card.status = 'scratched';

        if (!isWin) {
            if(hintEl) hintEl.innerText = "Oops! No coins this time. (Auto-redirecting...)";
        } else if (isReferral) {
            if(hintEl) hintEl.innerHTML = `<button class="btn-full" style="background:var(--whatsapp); margin-top:15px; border:none; padding:10px;" onclick="shareAppFromScratch('${cardId}', 20)">Share via WhatsApp to Claim 💬</button>`;
            if(waEl) waEl.innerHTML = `<button class="btn-full" style="background:var(--whatsapp); margin-bottom:15px;" onclick="shareAppFromScratch('${cardId}', 20)">Send via WhatsApp & Claim 💬</button>`;
            return true; 
        } else {
            // 🚀 BUG FIX: NAVI APP ANIMATION TRIGGER
            if(typeof flyCoinsToWallet === 'function') flyCoinsToWallet(winAmt);
            
            currentUser.coins += winAmt; currentUser.lifetimeCoins += winAmt;
            if(hintEl) hintEl.innerText = "Coins added to wallet! 🥳 (Auto-redirecting...)";
        }

        if(typeof updateCoinsUI === 'function') updateCoinsUI();
        saveState();

        if(contentId === 'success-reward-content') {
            setTimeout(() => {
                // Strict redirect - User cannot go back to scratch card
                window.history.replaceState(null, '', '#orders');
                if(typeof handleHashRouting === 'function') handleHashRouting();
            }, 2500);
        }

        return true;
    }
    return false;
}

function startConfetti(containerId) {
    const container = document.getElementById(containerId);
    if(!container) return;
    const colors = ['#ff6b00', '#16a34a', '#ef4444', '#f59e0b', '#8b5cf6'];
    for (let i = 0; i < 60; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.left = Math.random() * 100 + '%';
        c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        c.style.animationDelay = Math.random() * 0.5 + 's';
        c.style.width = Math.random() * 8 + 6 + 'px';
        c.style.height = Math.random() * 8 + 6 + 'px';
        container.appendChild(c);
        setTimeout(() => c.remove(), 3000);
    }
}

// ==========================================
// 🎙️ 4. VOICE SEARCH ENGINE 
// ==========================================
function startVoiceSearch(source) {
    vibe();
    let overlay = document.getElementById('voice-overlay');
    let msg = document.getElementById('overlay-msg');
    let title = document.getElementById('overlay-title');

    if(!overlay) return;

    overlay.style.display = 'flex';
    if(title) title.innerText = "Listening...";
    if(msg) msg.innerText = "Boliye, kya chahiye?";

    setTimeout(() => {
        if(title) title.innerText = "Processing...";
        if(msg) msg.innerText = "Awaaz sun li... dhund rahe hain 🤖";
        vibe();
    }, 1500);

    setTimeout(() => {
        overlay.style.display = 'none';
        let query = "Atta"; 

        if(source === 'home' || source === 'search') {
            if(typeof fillSearch === 'function') fillSearch(query);
        }
        else if(source === 'shop') {
            let shopInput = document.getElementById('shop-search');
            if(shopInput) { shopInput.value = query; if(typeof filterShopMenu === 'function') filterShopMenu(); }
        }
        else if(source === 'sub') {
            let subInput = document.getElementById('sub-search');
            if(subInput) { subInput.value = query; if(typeof filterSubItems === 'function') filterSubItems(); }
        }
        else if(source === 'all-shops') {
            let allInput = document.getElementById('all-shops-search');
            if(allInput) { allInput.value = "Sharma"; if(typeof filterAllShops === 'function') filterAllShops(); }
        }
    }, 3000);
}

// ==========================================
// 📊 5. UI HELPERS (Trending & Substitute)
// ==========================================
function renderTrending() {
    let trendingItems = masterInventory.filter(i => ['Aashirvaad Atta (5kg)', 'Khuli Chini (Sugar 1kg)', 'Loose Refined Oil (1L)'].includes(i.name));
    let popularItems = masterInventory.filter(i => ['Amul Full Cream (1L)', 'Maggi Noodles', 'Tata Toor Daal (1kg)'].includes(i.name));

    let trendList = document.getElementById('trending-list');
    let popList = document.getElementById('popular-list');
    let discoverList = document.getElementById('discover-item-list');

    const generateCards = (items) => {
        return items.map(item => {
            let mrp = Math.floor(item.basePrice * 1.15);
            let actionOnClick = `compareItem('${item.id}', 'screen-search')`;
            return `<div class="bb-product-card" style="min-width: 140px; box-shadow: 0 2px 5px rgba(0,0,0,0.02); border: 1px solid #e2e8f0; scroll-snap-align: start;" onclick="compareItem('${item.id}', 'screen-search')">
                <img src="${item.img}" class="bb-product-img" style="height: 70px;" loading="lazy">
                <span class="bb-weight">${item.loose ? '1 kg' : '1 pc'}</span>
                <div class="bb-title" style="height: 32px;">${item.name}</div>
                <div class="bb-price-row">
                    <div class="bb-price-col"><span class="bb-price">₹${item.basePrice}</span><span class="bb-mrp">₹${mrp}</span></div>
                    <button class="bb-add-btn" style="padding:4px 10px;" onclick="event.stopPropagation(); flyToCart(event, '${item.img}'); ${actionOnClick}">ADD</button>
                </div>
            </div>`;
        }).join('');
    };

    if(trendList && trendingItems.length > 0) trendList.innerHTML = generateCards(trendingItems);
    if(popList && popularItems.length > 0) popList.innerHTML = generateCards(popularItems);

    if(discoverList) {
        let discoverItems = masterInventory.slice(0, 20);
        discoverList.innerHTML = generateCards(discoverItems);
    }
}

function approveSubstitute() {
    vibe();
    let subSection = document.getElementById('substitute-approval-section');
    if(subSection) subSection.style.display = 'none';
    showToast("Substitute Request Approved! ✅");
}

function rejectSubstitute() {
    vibe();
    let subSection = document.getElementById('substitute-approval-section');
    if(subSection) subSection.style.display = 'none';
    showToast("Request Rejected. Item will be removed. ❌");
}

// ==========================================
// ➗ 6. SPLIT BILL LOGIC
// ==========================================
let currentSplitTotal = 0;
let currentSplitPeople = 2;

function openSplitBillModal() {
    vibe();
    let shopName = typeof currentlyOpeningShop !== 'undefined' ? currentlyOpeningShop : '';
    let bal = currentUser.khataBalances[shopName] || 0;
    if(bal <= 0) return alert("Koi pending udhar nahi hai!");

    currentSplitTotal = bal; currentSplitPeople = 2;
    let splitAmtEl = document.getElementById('split-total-amt');
    if(splitAmtEl) splitAmtEl.innerText = "₹" + bal;
    updateSplitUI();
    let modal = document.getElementById('splitBillModal');
    if(modal) modal.style.display = 'flex';
}

function adjustSplitCount(change) {
    vibe();
    if(currentSplitPeople + change >= 2) { currentSplitPeople += change; updateSplitUI(); }
}

function updateSplitUI() {
    let pCount = document.getElementById('split-people-count');
    if(pCount) pCount.innerText = currentSplitPeople;
    let perPerson = Math.ceil(currentSplitTotal / currentSplitPeople);
    let splitPerP = document.getElementById('split-per-person');
    if(splitPerP) splitPerP.innerText = "₹" + perPerson;
}

function sendSplitWhatsApp() {
    vibe();
    let perPerson = Math.ceil(currentSplitTotal / currentSplitPeople);
    let shopName = typeof currentlyOpeningShop !== 'undefined' ? currentlyOpeningShop : '';
    let upiId = `${shopName.replace(/\s+/g, '').toLowerCase()}@ybl`;

    let shareText = `*Udhar Settle Karna Hai!* 🧾\n\nBhai, ${shopName} ka udhar pending hai. Total bill hai ₹${currentSplitTotal}.\n\nHum ${currentSplitPeople} log hain, toh tera hissa bana *₹${perPerson}*.\n\nNiche diye gaye UPI ID pe sidha payment kar de ya mujhe GPay/PhonePe kar de.\n\n*UPI ID:* ${upiId}\n\nJaldi bhej de bhai! 🙏`;

    let waLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(waLink, '_blank');
}

// ==========================================
// 🔗 7. REFERRAL & SHARE LOGIC 
// ==========================================
function shareApp() {
    vibe();
    // 🚀 SYNC: Gali-Safar URL and wording updated perfectly
    let inviteLink = `https://galisafar.com/register?code=${currentUser.referralCode}`;
    const shareText = `*Garmi ka meter high, par Gali-Safar pe prices yahan low!* ☀️📉\n\nHanji, Gali-Safar laya hai aapke liye local dukaan ki sabse best deals!\n\n👉 *Join Now:* ${inviteLink}`;

    if (navigator.share) { 
        navigator.share({ title: 'Gali-Safar Special Deals', text: shareText }).catch(err => console.log('Share error:', err)); 
    } else {
        let waLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(waLink, '_blank');
    }
}

function shareAppFromScratch(cardId, reward) {
    shareApp();
    let card = currentUser.scratchCards.find(c => c.id === cardId);
    if (card && card.isReferral && !card.rewardClaimed) {
        let verifyShare = () => {
            if (document.hidden) {
                card.rewardClaimed = true;
                currentUser.coins += reward;
                currentUser.lifetimeCoins += reward;

                if(typeof updateCoinsUI === 'function') updateCoinsUI();

                alert(`🎉 Verification Success! ${reward} Gali-Coins unlocked and added to your wallet.`);

                let modal = document.getElementById('standaloneScratchModal');
                if(modal) modal.style.display='none';

                if(typeof renderCoinsScreen === 'function') renderCoinsScreen();
                saveState();
                document.removeEventListener("visibilitychange", verifyShare);
            }
        };
        document.addEventListener("visibilitychange", verifyShare);

        setTimeout(() => {
            document.removeEventListener("visibilitychange", verifyShare);
            if(!card.rewardClaimed) { alert("Share verification timed out. Did you successfully share it on WhatsApp?"); }
        }, 10000);
    }
}

// ==========================================
// 🛒 8. DAILY & MONTHLY SUBSCRIPTION LOGIC
// ==========================================
function openSubModal(type) {
    vibe();
    activeSubType = type;
    document.getElementById('sub-type-label').innerText = type + " Schedule";
    document.getElementById('subModal').style.display = 'flex';
    document.getElementById('sub-search').value = "";
    filterSubItems();
}

function closeSubModal(e) {
    if(e.target.id === 'subModal') e.target.style.display = 'none';
}

function filterSubItems() {
    let searchEl = document.getElementById('sub-search');
    if(!searchEl) return;
    let term = searchEl.value.toLowerCase();
    let list = document.getElementById('sub-modal-list');
    let qActions = document.getElementById('sub-quick-actions');

    if(term.length < 2) {
        if(list) list.innerHTML = "";
        if(qActions) qActions.style.display = 'flex';
        renderSubModalCart(); return;
    }

    if(qActions) qActions.style.display = 'none';
    let matched = masterInventory.filter(i => i.name.toLowerCase().includes(term));
    if(matched.length === 0) { if(list) list.innerHTML = `<div style="text-align:center; padding:20px; color:#64748b;">Item not found.</div>`; return; }

    let html = "";
    matched.forEach(item => {
        html += `
        <div style="background:white; padding:12px; border-radius:12px; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; gap:10px; align-items:center;">
                <img src="${item.img}" style="width:40px; height:40px; object-fit:contain;">
                <div><h4 style="font-size:13px; font-weight:800; color:#1e293b;">${item.name}</h4><p style="font-size:12px; color:var(--success); font-weight:800;">₹${item.basePrice}</p></div>
            </div>
            <button class="add-to-cart-btn" style="width:auto; padding:6px 15px;" onclick="addToScheduleCart('${item.id}')">ADD +</button>
        </div>`;
    });
    if(list) list.innerHTML = html;
}

function addToScheduleCart(id, qty = 1) {
    vibe();
    let item = masterInventory.find(i => i.id === id);
    if(!item) return;
    let schedCart = scheduleCarts[activeSubType];
    let existing = schedCart.find(c => c.id === id);
    if(existing) { existing.qty += qty; } else { schedCart.push({ ...item, qty: qty }); }

    showToast(`${item.name} added to schedule!`);
    let searchEl = document.getElementById('sub-search');
    if(searchEl) searchEl.value = "";
    filterSubItems();
}

function renderSubModalCart() {
    let schedCart = scheduleCarts[activeSubType];
    let container = document.getElementById('sub-added-items');
    let list = document.getElementById('sub-cart-list');
    if(!container || !list) return;

    if(schedCart.length === 0) { container.style.display = 'none'; return; }
    container.style.display = 'block';
    let subCount = document.getElementById('sub-count');
    if(subCount) subCount.innerText = schedCart.length;

    let html = "";
    schedCart.forEach(item => {
        html += `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">
            <div style="font-size:12px; font-weight:600; color:#1e293b; display:flex; align-items:center; gap:8px;">
                <img src="${item.img}" style="width:25px; height:25px; object-fit:contain;">
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:150px;">${item.name}</span>
            </div>
            <div class="qty-controls" style="margin:0; width:70px; background:white; padding:2px;">
                <button class="qty-btn" onclick="updateScheduleQty('${item.id}', -1)">-</button>
                <span>${item.qty}</span>
                <button class="qty-btn" onclick="updateScheduleQty('${item.id}', 1)">+</button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

function updateScheduleQty(id, change) {
    vibe(); let schedCart = scheduleCarts[activeSubType];
    let idx = schedCart.findIndex(c => c.id === id);
    if(idx > -1) {
        schedCart[idx].qty += change;
        if(schedCart[idx].qty <= 0) schedCart.splice(idx, 1);
    }
    renderSubModalCart();
    let modModal = document.getElementById('modal-modify-schedule');
    if(modModal && modModal.style.display === 'flex') {
        if(typeof renderModifyModal === 'function') renderModifyModal();
        if(typeof updateScheduleBill === 'function') updateScheduleBill();
    }
}

function addQuickBundle(bundleType) {
    vibe();
    if(bundleType === 'Gym Diet') { addToScheduleCart('d1', 2); addToScheduleCart('gen19', 1); }
    else if (bundleType === 'Night Study') { addToScheduleCart('s1', 3); addToScheduleCart('gen20', 1); }
    showToast(`${bundleType} added! 💪`);
}

function addFamilyKit() {
    vibe(); preMadeKits.basicFamily.forEach(kitItem => { addToScheduleCart(kitItem.id, 1); });
    showToast("Family Kit added! 📦");
}

function proceedToSubSetup() {
    vibe();
    if(scheduleCarts[activeSubType].length === 0) return alert("Please add items first!");
    let subModal = document.getElementById('subModal');
    if(subModal) subModal.style.display = 'none';

    let itemsToProcess = scheduleCarts[activeSubType];
    let shopCosts = shopsData.filter(s => s.isOpen && parseInt(s.dist) <= 1000).map(shop => {
        let total = 0; itemsToProcess.forEach(item => { total += (item.basePrice + shop.offset) * item.qty; });
        return { shop: shop, totalCost: total };
    });

    shopCosts.sort((a, b) => a.totalCost - b.totalCost);
    let sasti = shopCosts[0] || {shop: shopsData[0], totalCost: 0};
    let paasShopCosts = [...shopCosts].sort((a, b) => parseInt(a.shop.dist) - parseInt(b.shop.dist));
    let paas = paasShopCosts[0] || sasti;
    let savedShop = shopCosts.find(s => currentUser.savedVendors && currentUser.savedVendors.includes(s.shop.id));

    let vendorHtml = `<p style="font-size: 12px; font-weight: 800; color: #64748b; margin: 15px 20px 10px; text-transform: uppercase;">🛒 Choose Store for Schedule</p>`;
    let options = [];
    options.push({ type: 'sasti', shop: sasti.shop, cost: sasti.totalCost, title: '💰 SABSE SASTI', color: '#10b981' });
    if (paas.shop.name !== sasti.shop.name) options.push({ type: 'paas', shop: paas.shop, cost: paas.totalCost, title: '⚡ SABSE PAAS', color: '#0284c7' });
    if (savedShop && savedShop.shop.name !== sasti.shop.name && savedShop.shop.name !== paas.shop.name) options.push({ type: 'saved', shop: savedShop.shop, cost: savedShop.totalCost, title: '⭐ SAVED VENDOR', color: '#ff6b00' });

    if (!activeScheduleVendor) activeScheduleVendor = sasti.shop.name;

    options.forEach(opt => {
        let isSelected = activeScheduleVendor === opt.shop.name;
        let bgStyle = isSelected ? `border-color: ${opt.color}; box-shadow: 0 4px 10px rgba(0,0,0,0.1); background: #fffaf5;` : `border-color: #e2e8f0;`;
        vendorHtml += `
            <div class="setup-vendor-card ${isSelected ? 'selected' : ''}" style="${bgStyle}" onclick="selectScheduleVendor('${opt.shop.name}')">
                <div style="font-size: 10px; font-weight: 800; color: ${opt.color}; margin-bottom: 4px;">${opt.title}</div>
                <h4 style="font-size:13px; font-weight:800; color:#1e293b;">${opt.shop.name}</h4>
                <p style="font-size:10px; color:#64748b;">${opt.shop.dist}m away</p>
                <h3 style="color:${opt.color}; font-size:16px; font-weight:900; margin-top:5px;">₹${opt.cost}/day</h3>
            </div>
        `;
    });

    let vOptions = document.getElementById(`setup-vendor-options-${activeSubType}`);
    if(vOptions) vOptions.innerHTML = vendorHtml;

    if(typeof renderSchedulePreview === 'function') renderSchedulePreview();
    if(typeof updateScheduleBill === 'function') updateScheduleBill();

    if (activeSubType === 'Daily') switchNav('screen-daily-setup');
    else if (activeSubType === 'Monthly') switchNav('screen-monthly-setup');
}

function selectScheduleVendor(shopName) { vibe(); activeScheduleVendor = shopName; proceedToSubSetup(); }

function renderSchedulePreview() {
    let items = scheduleCarts[activeSubType];
    let previewContainer = document.getElementById(`${activeSubType.toLowerCase()}-item-preview`);
    if(!previewContainer) return;

    let html = "";
    let displayItems = items.slice(0, 4);
    displayItems.forEach(item => { html += `<div class="preview-item-box"><img src="${item.img}"><p>${item.qty}x ${item.name}</p></div>`; });

    if(items.length > 4) {
        html += `<div class="preview-item-box" style="display:flex; justify-content:center; align-items:center; background:#e2e8f0; border:none; cursor:pointer;" onclick="openModifyModal('${activeSubType}')"><span style="font-size:14px; font-weight:800; color:#475569;">+${items.length - 4} More</span></div>`;
    }
    previewContainer.innerHTML = html;
}

function updateScheduleBill() {
    let items = scheduleCarts[activeSubType];
    let shopObj = shopsData.find(s => s.name === activeScheduleVendor) || shopsData[0];
    let itemTotal = items.reduce((sum, item) => sum + (item.basePrice + shopObj.offset) * item.qty, 0);
    
    let isVip = document.getElementById('vip-pass-checkbox') ? document.getElementById('vip-pass-checkbox').checked : currentUser.vipPassActive;

    if(activeSubType === 'Daily') {
        let days = scheduleDuration['Daily'] || 7;
        let dailyDelFee = isVip ? 0 : 10;
        let total = (itemTotal + dailyDelFee) * days;

        let dGt = document.getElementById('daily-grand-total');
        let dAdv = document.getElementById('daily-advance-amt');
        
        let vipText = isVip ? `<br><span style="font-size:10px; color:#d97706;">Free Delivery Applied 👑</span>` : `<br><span style="font-size:10px; color:#64748b;">+ ₹${dailyDelFee*days} Delivery Fee</span>`;

        if(dGt) dGt.innerHTML = `₹${total} ${vipText}`;
        if(dAdv) dAdv.innerText = "₹" + total;
    } else {
        let months = scheduleDuration['Monthly'] || 1;
        let totalItemsCost = itemTotal * months;
        let monthlyDelFee = isVip ? 0 : 60;
        let setupFee = 5;
        let grandTotal = totalItemsCost + (monthlyDelFee * months) + setupFee;

        let mIt = document.getElementById('monthly-item-total');
        let mGt = document.getElementById('monthly-grand-total');
        
        let vipText = isVip ? `<br><span style="font-size:10px; color:#d97706;">Free Delivery Applied 👑</span>` : `<br><span style="font-size:10px; color:#64748b;">+ ₹${monthlyDelFee*months} Delivery Fee</span>`;

        if(mIt) mIt.innerText = "₹" + totalItemsCost;
        if(mGt) mGt.innerHTML = `₹${grandTotal} ${vipText}`;
        updateMonthlyBill();
    }
}

function applyVIPPass() {
    vibe();
    let cb = document.getElementById('vip-pass-checkbox');
    currentUser.vipPassActive = cb ? cb.checked : false;
    showToast(currentUser.vipPassActive ? "VIP Pass Applied! 👑 ₹0 Delivery" : "VIP Pass Removed");
    updateScheduleBill();
    saveState();
}

function setScheduleDuration(type, days, btnElement) {
    vibe(); scheduleDuration[type] = days;
    let container = document.getElementById(type === 'Daily' ? 'daily-duration-container' : 'monthly-duration-container');
    if(container) {
        container.querySelectorAll('.duration-btn').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
    }
    updateScheduleBill();
}

function updateDeductionWarning() {
    let dateEl = document.getElementById('monthly-date');
    if(!dateEl) return;
    let dateVal = dateEl.value;
    let deductionDate = parseInt(dateVal) - 1; if(deductionDate <= 0) deductionDate = 30;
    let suffix = deductionDate === 1 ? 'st' : (deductionDate === 2 ? 'nd' : (deductionDate === 3 ? 'rd' : 'th'));
    let warnEl = document.getElementById('upi-deduction-warning');
    if(warnEl) warnEl.innerText = `⚠️ Amount will be deducted on the ${deductionDate}${suffix} of every month.`;
}

function updateMonthlyBill() {
    let mGtEl = document.getElementById('monthly-grand-total');
    let sCountEl = document.getElementById('monthly-split-count');
    let resultEl = document.getElementById('monthly-split-result');
    if(!mGtEl || !sCountEl || !resultEl) return;

    let grandTotalText = mGtEl.innerHTML.split('<br>')[0].replace(/[^0-9]/g, '');
    let grandTotal = parseInt(grandTotalText) || 0;
    let splitCount = parseInt(sCountEl.value);

    if(splitCount > 1) {
        let perPerson = Math.ceil(grandTotal / splitCount);
        resultEl.innerText = `Per Person: ₹${perPerson}`; resultEl.style.display = 'block';
    } else { resultEl.style.display = 'none'; }
}

function openModifyModal(type) {
    vibe(); activeSubType = type;
    let modal = document.getElementById('modal-modify-schedule');
    if(modal) { modal.style.display = 'flex'; renderModifyModal(); }
}

function renderModifyModal() {
    let schedCart = scheduleCarts[activeSubType];
    let list = document.getElementById('modify-schedule-list');
    if(!list) return;
    if(schedCart.length === 0) { list.innerHTML = "<p>Schedule is empty.</p>"; return; }

    let html = "";
    schedCart.forEach(item => {
        html += `<div style="background:white; padding:12px; border-radius:12px; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;"><div style="display:flex; gap:10px; align-items:center;"><img src="${item.img}" style="width:40px; height:40px; object-fit:contain;"><div><h4 style="font-size:12px; font-weight:800; color:#1e293b;">${item.name}</h4><p style="font-size:12px; color:var(--success); font-weight:800;">₹${item.basePrice}</p></div></div><div class="qty-controls" style="margin:0; width:80px; background:#f1f5f9;"><button class="qty-btn" onclick="updateScheduleQty('${item.id}', -1)">-</button><span>${item.qty}</span><button class="qty-btn" onclick="updateScheduleQty('${item.id}', 1)">+</button></div></div>`;
    });
    list.innerHTML = html;
}

function saveModifiedSchedule() {
    vibe();
    let modal = document.getElementById('modal-modify-schedule');
    if(modal) modal.style.display = 'none';
    renderSchedulePreview(); updateScheduleBill(); showToast("Changes Saved! ✅");
}

function confirmAndSaveSchedule(type) {
    vibe();
    if(scheduleCarts[type].length === 0) {
        return alert("Aapka schedule abhi khali hai. Pehle items add karein!");
    }

    showToast(`Saving ${type} Schedule... ⏳`);

    setTimeout(() => {
        alert(`${type} Schedule Confirmed & Activated! 🎉`);
        if(type === 'Daily') switchNav('screen-daily-dash');
        else switchNav('screen-monthly-dash');

        if(typeof updateProfileBadges === 'function') updateProfileBadges();
        saveState();
    }, 800);
}

// 🚀 PHASE 7 (POINT 33): BUG FIX - VACATION MODE STATE PERSISTENCE
function handleVacationDate() {
    vibe();
    let dateVal = document.getElementById('vacation-date').value;
    if(!dateVal) return alert("Bhai, pehle calendar se date toh select kar lo! 📅");
    
    // Save to user object
    currentUser.vacationDate = dateVal;
    currentUser.isDeliveryPaused = true;
    saveState();

    showToast(`Vacation mode ON! Delivery paused till ${dateVal} ✈️`);
    
    let btn = document.getElementById('pause-daily-btn');
    if(btn) {
        btn.innerHTML = '▶️ RESUME DELIVERY';
        btn.style.background = '#dcfce7'; 
        btn.style.color = '#166534'; 
        btn.style.borderColor = '#bbf7d0';
    }
}

function togglePauseDelivery() {
    vibe();
    let btn = document.getElementById('pause-daily-btn');
    let dateInput = document.getElementById('vacation-date');
    
    // Toggle based on current state
    if(!currentUser.isDeliveryPaused) {
        currentUser.isDeliveryPaused = true;
        btn.innerHTML = '▶️ RESUME DELIVERY';
        btn.style.background = '#dcfce7'; btn.style.color = '#166534'; btn.style.borderColor = '#bbf7d0';
        showToast("Daily Schedule Paused ⏸️");
    } else {
        currentUser.isDeliveryPaused = false;
        currentUser.vacationDate = "";
        btn.innerHTML = '⏸️ PAUSE DELIVERY NOW';
        btn.style.background = '#fef2f2'; btn.style.color = '#ef4444'; btn.style.borderColor = '#fca5a5';
        if(dateInput) dateInput.value = ""; 
        showToast("Daily Schedule Resumed ▶️ Welcome Back!");
    }
    saveState(); // Ensure persistence
}

// ==========================================
// ❤️ 12. SAVED ECOSYSTEM ENGINE
// ==========================================
function toggleSavedItem(id, event) {
    if(event) event.stopPropagation();
    vibe();
    
    if(!currentUser.savedItems) currentUser.savedItems = [];
    
    let idx = currentUser.savedItems.indexOf(id);
    let icon = event.currentTarget.querySelector('.heart-icon');
    
    if(idx > -1) {
        currentUser.savedItems.splice(idx, 1);
        if(icon) { icon.classList.remove('saved'); icon.innerText = '♡'; }
        showToast("Removed from Saved ❤️");
    } else {
        currentUser.savedItems.push(id);
        if(icon) { icon.classList.add('saved'); icon.innerText = '♥'; }
        showToast("Saved to Favorites! ❤️");
    }
    
    saveState();
    
    if(typeof renderSavedItemsScreen === 'function') {
        let screen = document.getElementById('screen-saved-items');
        if(screen && screen.classList.contains('active')) renderSavedItemsScreen();
    }
}

function toggleSavedVendor(id, event) {
    if(event) event.stopPropagation();
    vibe();
    
    if(!currentUser.savedVendors) currentUser.savedVendors = [];
    
    let idx = currentUser.savedVendors.indexOf(id);
    let icon = event.currentTarget.querySelector('.heart-icon');
    
    if(idx > -1) {
        currentUser.savedVendors.splice(idx, 1);
        if(icon) { icon.classList.remove('saved'); icon.innerText = '♡'; }
        showToast("Vendor removed from Saved");
    } else {
        currentUser.savedVendors.push(id);
        if(icon) { icon.classList.add('saved'); icon.innerText = '♥'; }
        showToast("Vendor Saved! ⭐");
    }
    
    saveState();
    
    if(typeof renderSavedVendorsScreen === 'function') {
        let screen = document.getElementById('screen-saved-vendors');
        if(screen && screen.classList.contains('active')) renderSavedVendorsScreen();
    }
}

// ==========================================
// 🚨 OOS POLICY & ACTIONS
// ==========================================
let currentOOSPolicy = "Remove Item";
function setPolicy(policyName, elId) {
    vibe();
    currentOOSPolicy = policyName;
    document.querySelectorAll('.policy-card').forEach(c => c.classList.remove('active'));
    document.getElementById(elId).classList.add('active');
}

function placeFinalOrder() {
    vibe();
    document.getElementById('modal-oos').style.display = 'none';
    showToast("Policy saved: " + currentOOSPolicy);
}
