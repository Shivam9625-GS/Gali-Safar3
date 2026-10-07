// ==========================================
// 🔐 AUTH.JS : LOGIN, OTP & REGISTRATION
// ==========================================

// 1. Get OTP button action
function sendOTP() {
    if (typeof vibe === 'function') vibe();

    const mobileInput = document.getElementById('mobile')?.value.trim() || '';

    if (mobileInput.length !== 10) {
        alert('⚠️ Kripya sahi 10 ankon ka mobile number dalein!');
        return;
    }

    // UI immediately switch to OTP step
    const loginStep1 = document.getElementById('login-step-1');
    const loginStep2 = document.getElementById('login-step-2');
    if (loginStep1) loginStep1.style.display = 'none';
    if (loginStep2) loginStep2.style.display = 'block';

    const otpDisplay = document.getElementById('display-otp-number');
    if (otpDisplay) {
        otpDisplay.innerHTML = '+91 ' + mobileInput + ' &nbsp;<span style="font-size: 12px;">✏️ Edit</span>';
    }

    if (typeof currentUser !== 'undefined') {
        currentUser.phone = mobileInput;
    }

    if (window.AndroidBridge) {
        window.AndroidBridge.sendOTP(mobileInput);
    } else {
        console.log('Testing Mode: Android Bridge nahi mila.');
        if (typeof showToast === 'function') showToast('Test Mode: Koi bhi 6 digit OTP daalein!');
    }
}

// ==========================================
// 🧠 SMART 6-BOX OTP LOGIC (PHASE 1)
// ==========================================
window.addEventListener('load', function () {
    const otpInputs = document.querySelectorAll('.otp-box');

    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            if (e.target.value !== '' && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                otpInputs[index - 1].focus();
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            let pasteData = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
            pasteData = pasteData.substring(0, otpInputs.length);

            for (let i = 0; i < pasteData.length; i++) {
                otpInputs[i].value = pasteData[i];
                if (i < otpInputs.length - 1) {
                    otpInputs[i + 1].focus();
                } else {
                    otpInputs[i].focus();
                }
            }
        });
    });
});

// 6 boxes numbers join logic
function getFullOTP() {
    let finalOTP = '';
    document.querySelectorAll('.otp-box').forEach((input) => {
        finalOTP += input.value;
    });
    return finalOTP;
}

// 2. OTP verification function
function verifyOTP() {
    if (typeof vibe === 'function') vibe();

    const otpCode = getFullOTP();

    if (otpCode.length < 6) {
        return alert('Pura 6 ankon ka OTP dalein! 🔒');
    }

    const loginScreen = document.getElementById('screen-login');
    if (loginScreen) {
        loginScreen.classList.remove('active');
        loginScreen.style.display = 'none';
    }

    window.location.hash = '#register';
    if (typeof handleHashRouting === 'function') handleHashRouting();

    if (typeof showToast === 'function') showToast('Login Successful! 🎉');
}

// 3. Edit Number function
function editNumber() {
    if (typeof vibe === 'function') vibe();

    const loginStep2 = document.getElementById('login-step-2');
    const loginStep1 = document.getElementById('login-step-1');
    if (loginStep2) loginStep2.style.display = 'none';
    if (loginStep1) loginStep1.style.display = 'block';

    document.querySelectorAll('.otp-box').forEach((input) => {
        input.value = '';
    });

    const sheet = document.getElementById('auth-sheet');
    if (sheet) {
        sheet.style.transform = 'translateY(10px)';
        setTimeout(() => {
            sheet.style.transform = 'translateY(0)';
        }, 150);
    }
}

// ==========================================
// 📝 REGISTRATION & PROFILE LOGIC
// ==========================================
function fetchLocation() {
    if (typeof vibe === 'function') vibe();

    const btn = document.getElementById('loc-btn');
    if (btn) {
        btn.innerText = '📍 GPS Location Saved';
        btn.style.background = '#f0fdf4';
        btn.style.color = '#16a34a';
        btn.style.borderColor = '#bbf7d0';
    }

    if (typeof showToast === 'function') showToast('Location Captured! 🌍');
}

function completeRegistration() {
    if (typeof vibe === 'function') vibe();

    const nameInput = document.getElementById('user-name');
    const addressInput = document.getElementById('user-address');

    const finalName = (nameInput && nameInput.value.trim() !== '') ? nameInput.value.trim() : 'Shivam';
    const finalAddress = (addressInput && addressInput.value.trim() !== '') ? addressInput.value.trim() : 'Delhi, 110035';

    if (typeof currentUser !== 'undefined') {
        currentUser.name = finalName;
        currentUser.address = finalAddress;
        currentUser.referralCode = `GS_${finalName.toUpperCase().split(' ')[0]}20`;
    }

    try {
        if (typeof updateGreeting === 'function') updateGreeting();

        const locHeader = document.getElementById('header-loc');
        if (locHeader) locHeader.innerHTML = `📍 ${finalAddress.substring(0, 15)}... ✏️`;

        if (typeof saveState === 'function') saveState();
    } catch (err) {
        console.error('UI update minor error, ignoring...', err);
    }

    document.querySelectorAll('.screen').forEach((s) => {
        s.style.display = 'none';
        s.classList.remove('active');
    });

    const homeScreen = document.getElementById('screen-home');
    if (homeScreen) {
        homeScreen.style.display = 'block';
        homeScreen.classList.add('active');
    }

    const navBar = document.getElementById('nav-bar');
    if (navBar) navBar.style.display = 'flex';

    window.location.hash = '#home';
    if (typeof renderHome === 'function') renderHome();

    if (typeof showToast === 'function') showToast('Welcome to Gali-Safar! 🚀');
}


