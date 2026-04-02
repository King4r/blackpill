const VAULT_PIN = '055183';
let supabase = null;
let currentUser = null;

async function initVault() {
    try {
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        const supabaseUrl = 'https://jwybufiryfrqlvojbzto.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3eWJ1ZmlyeWZycWx2b2pienRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzg2NzAsImV4cCI6MjA5MDY1NDY3MH0.0V-2UvX6NErA_5otgUIGZuvqeZa56rD2pInqRqW7RlY';
        return createClient(supabaseUrl, supabaseKey);
    } catch (e) {
        console.error('Supabase init error:', e);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    supabase = await initVault();
    
    if (!supabase) {
        showMessage('Database not connected. Please refresh the page.', 'error');
        return;
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
            showLoginRequired();
            return;
        }

        currentUser = session.user;
        updateUserUI(currentUser);
        updateNavbar();

        const { data: accessData, error } = await supabase
            .from('users_access')
            .select('paid_access, vault_pin_verified')
            .eq('user_id', session.user.id)
            .single();

        if (error) {
            console.log('Access check error:', error.message);
        }

        if (accessData?.vault_pin_verified) {
            window.location.href = 'course.html';
            return;
        }

        if (accessData?.paid_access) {
            showPinGate();
        } else {
            showPaymentPending();
        }

    } catch (e) {
        console.error('Vault auth error:', e);
        showLoginRequired();
    }
});

function showLoginRequired() {
    const container = document.querySelector('.vault-container');
    container.innerHTML = `
        <div class="glass-card" style="max-width: 500px; margin: 100px auto; padding: 60px; text-align: center;">
            <svg xmlns="http://www.w3.org/2000/svg" style="width: 80px; height: 80px; color: var(--rich-gold); margin-bottom: 24px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2>Login Required</h2>
            <p style="color: rgba(248, 248, 248, 0.7); margin: 20px 0;">You need to be logged in and have an approved payment to access the vault.</p>
            <a href="purchase.html" class="btn-gold" style="display: inline-block; margin-top: 16px;">Go to Purchase</a>
        </div>
    `;
}

function showPaymentPending() {
    const container = document.querySelector('.vault-container');
    const header = container.querySelector('.vault-header');
    
    header.style.display = 'none';
    
    const pendingCard = document.createElement('div');
    pendingCard.className = 'glass-card';
    pendingCard.style.cssText = 'max-width: 500px; margin: 100px auto; padding: 60px; text-align: center;';
    pendingCard.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" style="width: 80px; height: 80px; color: var(--rich-gold); margin-bottom: 24px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2>Payment Under Review</h2>
        <p style="color: rgba(248, 248, 248, 0.7); margin: 20px 0;">Your payment is being reviewed by the admin. This usually takes less than 24 hours.</p>
        <p style="color: var(--rich-gold); margin-bottom: 30px;">Check your email for updates and your vault PIN once approved.</p>
        <p style="color: rgba(248, 248, 248, 0.5); font-size: 0.85rem; margin-bottom: 20px;">If you haven't submitted payment yet:</p>
        <a href="purchase.html" class="btn-gold" style="display: inline-block;">Submit Payment</a>
    `;
    
    container.appendChild(pendingCard);
}

function showPinGate() {
    const container = document.querySelector('.vault-container');
    const header = container.querySelector('.vault-header');
    
    header.style.display = 'none';
    
    const pinCard = document.createElement('div');
    pinCard.className = 'glass-card';
    pinCard.style.cssText = 'max-width: 450px; margin: 100px auto; padding: 50px; text-align: center;';
    pinCard.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" style="width: 60px; height: 60px; color: var(--rich-gold); margin-bottom: 24px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        <h2 style="margin-bottom: 12px;">Enter Vault PIN</h2>
        <p style="color: rgba(248, 248, 248, 0.7); margin-bottom: 30px;">Enter the 6-digit PIN sent to your email after payment approval.</p>
        <form id="pinForm">
            <div class="pin-input-group" style="margin-bottom: 24px;">
                <input type="password" class="pin-input" maxlength="1" autofocus style="width: 50px; height: 60px; text-align: center; font-size: 1.5rem; background: rgba(26, 26, 26, 0.8); border: 2px solid rgba(212, 175, 55, 0.3); border-radius: 12px; color: var(--soft-white);">
                <input type="password" class="pin-input" maxlength="1" style="width: 50px; height: 60px; text-align: center; font-size: 1.5rem; background: rgba(26, 26, 26, 0.8); border: 2px solid rgba(212, 175, 55, 0.3); border-radius: 12px; color: var(--soft-white);">
                <input type="password" class="pin-input" maxlength="1" style="width: 50px; height: 60px; text-align: center; font-size: 1.5rem; background: rgba(26, 26, 26, 0.8); border: 2px solid rgba(212, 175, 55, 0.3); border-radius: 12px; color: var(--soft-white);">
                <input type="password" class="pin-input" maxlength="1" style="width: 50px; height: 60px; text-align: center; font-size: 1.5rem; background: rgba(26, 26, 26, 0.8); border: 2px solid rgba(212, 175, 55, 0.3); border-radius: 12px; color: var(--soft-white);">
                <input type="password" class="pin-input" maxlength="1" style="width: 50px; height: 60px; text-align: center; font-size: 1.5rem; background: rgba(26, 26, 26, 0.8); border: 2px solid rgba(212, 175, 55, 0.3); border-radius: 12px; color: var(--soft-white);">
                <input type="password" class="pin-input" maxlength="1" style="width: 50px; height: 60px; text-align: center; font-size: 1.5rem; background: rgba(26, 26, 26, 0.8); border: 2px solid rgba(212, 175, 55, 0.3); border-radius: 12px; color: var(--soft-white);">
            </div>
            <button type="submit" class="btn-gold" style="width: 100%;">Unlock Vault</button>
        </form>
        <p id="pinError" style="color: #f44336; margin-top: 16px; display: none;">Invalid PIN. Check your email and try again.</p>
        <p style="color: rgba(248, 248, 248, 0.5); margin-top: 24px; font-size: 0.85rem;">Didn't receive a PIN? <a href="contact.html" style="color: var(--rich-gold);">Contact Support</a></p>
    `;
    
    container.appendChild(pinCard);
    
    const pinForm = document.getElementById('pinForm');
    const pinInputs = document.querySelectorAll('.pin-input');
    
    pinInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < pinInputs.length - 1) {
                pinInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                pinInputs[index - 1].focus();
            }
        });
    });
    
    pinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let enteredPin = '';
        pinInputs.forEach(input => enteredPin += input.value);

        if (enteredPin === VAULT_PIN) {
            await verifyPinInDB(currentUser.id);
        } else {
            document.getElementById('pinError').style.display = 'block';
            pinInputs.forEach(input => {
                input.value = '';
                input.style.borderColor = '#f44336';
            });
            pinInputs[0].focus();
            
            setTimeout(() => {
                pinInputs.forEach(input => {
                    input.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                });
            }, 2000);
        }
    });
}

async function verifyPinInDB(userId) {
    try {
        const { error } = await supabase
            .from('users_access')
            .update({ vault_pin_verified: true })
            .eq('user_id', userId);

        if (error) throw error;

        window.location.href = 'course.html';
    } catch (e) {
        console.error('PIN verification error:', e);
        document.getElementById('pinError').style.display = 'block';
    }
}

function updateUserUI(user) {
    const userAvatar = document.querySelector('.user-avatar');
    const userName = document.querySelector('.user-name');
    const userEmail = document.querySelector('.user-email');

    if (userAvatar) {
        const name = user.user_metadata?.full_name || user.email;
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        userAvatar.textContent = initials;
    }

    if (userName) {
        userName.textContent = user.user_metadata?.full_name || 'Member';
    }

    if (userEmail) {
        userEmail.textContent = user.email;
    }
}

function showMessage(message, type) {
    const container = document.querySelector('.vault-container');
    container.innerHTML = `
        <div class="glass-card" style="max-width: 500px; margin: 100px auto; padding: 60px; text-align: center;">
            <p style="color: ${type === 'error' ? '#f44336' : '#4CAF50'}; margin-bottom: 20px;">${message}</p>
            <a href="index.html" class="btn-outline" style="display: inline-block;">Go Home</a>
        </div>
    `;
}

document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('logout-btn') || e.target.closest('.logout-btn')) {
        e.preventDefault();
        if (supabase) {
            await supabase.auth.signOut();
        }
        window.location.href = 'index.html';
    }
});

function updateNavbar() {
    const navLinks = document.getElementById('navLinks');
    if (!navLinks) return;

    navLinks.innerHTML = `
        <a href="course.html">Course</a>
        <a href="vault.html" class="gold-text">Vault</a>
        <a href="profile.html">Profile</a>
        <button class="btn-outline logout-btn" style="padding: 8px 20px; font-size: 0.8rem;">Logout</button>
    `;
}
