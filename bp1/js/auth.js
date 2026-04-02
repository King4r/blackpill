let supabase = null;

async function initAuth() {
    try {
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        const supabaseUrl = 'https://jwybufiryfrqlvojbzto.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3eWJ1ZmlyeWZycWx2b2pienRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzg2NzAsImV4cCI6MjA5MDY1NDY3MH0.0V-2UvX6NErA_5otgUIGZuvqeZa56rD2pInqRqW7RlY';
        supabase = createClient(supabaseUrl, supabaseKey);
        return supabase;
    } catch (e) {
        console.error('Supabase init error:', e);
        return null;
    }
}

function showAlertMessage(message, type, targetForm) {
    const existing = document.querySelector('.form-alert');
    if (existing) existing.remove();

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} form-alert`;
    alert.textContent = message;
    alert.style.cssText = 'padding: 16px 20px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem;';
    if (type === 'success') {
        alert.style.background = 'rgba(76, 175, 80, 0.1)';
        alert.style.border = '1px solid rgba(76, 175, 80, 0.3)';
        alert.style.color = '#4CAF50';
    } else {
        alert.style.background = 'rgba(244, 67, 54, 0.1)';
        alert.style.border = '1px solid rgba(244, 67, 54, 0.3)';
        alert.style.color = '#f44336';
    }

    const form = targetForm || document.querySelector('.auth-form.active') || document.getElementById('registerForm');
    if (form) {
        form.insertBefore(alert, form.firstChild);
        setTimeout(() => alert.remove(), 8000);
    }
}

function setLoading(button, loading) {
    if (loading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.innerHTML = '<span style="display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(10,10,10,0.3); border-radius: 50%; border-top-color: #0A0A0A; animation: spin 0.8s linear infinite; margin-right: 8px;"></span> Processing...';
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Submit';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await initAuth();

    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const registerTab = document.getElementById('registerTab');
    const loginTab = document.getElementById('loginTab');
    const paymentSection = document.getElementById('paymentSection');
    const paymentForm = document.getElementById('paymentForm');

    if (registerTab && loginTab) {
        registerTab.addEventListener('click', () => {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            if (registerForm) registerForm.classList.add('active');
            if (loginForm) loginForm.classList.remove('active');
        });

        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            if (loginForm) loginForm.classList.add('active');
            if (registerForm) registerForm.classList.remove('active');
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!supabase) {
                showAlertMessage('Database not connected. Please refresh the page.', 'error', registerForm);
                return;
            }

            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const formData = new FormData(registerForm);
            const email = formData.get('email');
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');
            const fullName = formData.get('fullName');

            if (password !== confirmPassword) {
                showAlertMessage('Passwords do not match', 'error', registerForm);
                return;
            }

            if (password.length < 6) {
                showAlertMessage('Password must be at least 6 characters', 'error', registerForm);
                return;
            }

            setLoading(submitBtn, true);

            try {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName
                        }
                    }
                });

                if (error) throw error;

                if (data.user) {
                    try {
                        await supabase.from('profiles').insert({
                            id: data.user.id,
                            full_name: fullName,
                            email: email
                        });

                        await supabase.from('users_access').insert({
                            user_id: data.user.id,
                            paid_access: false,
                            vault_pin_verified: false
                        });
                    } catch (dbError) {
                        console.log('Profile insert skipped:', dbError.message);
                    }

                    showAlertMessage('Account created! Please submit your payment below.', 'success', registerForm);
                    if (paymentSection) paymentSection.classList.remove('hidden');
                }
            } catch (error) {
                showAlertMessage(error.message || 'Registration failed. Please try again.', 'error', registerForm);
            } finally {
                setLoading(submitBtn, false);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!supabase) {
                showAlertMessage('Database not connected. Please refresh the page.', 'error', loginForm);
                return;
            }

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const formData = new FormData(loginForm);
            const email = formData.get('email');
            const password = formData.get('password');

            setLoading(submitBtn, true);

            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;

                const { data: accessData } = await supabase
                    .from('users_access')
                    .select('paid_access')
                    .eq('user_id', data.user.id)
                    .single();

                if (accessData?.paid_access) {
                    window.location.href = 'vault.html';
                } else {
                    showAlertMessage('Login successful! Submit your payment to access the course.', 'success', loginForm);
                    if (paymentSection) paymentSection.classList.remove('hidden');
                }
            } catch (error) {
                showAlertMessage(error.message || 'Login failed. Check your email/password.', 'error', loginForm);
            } finally {
                setLoading(submitBtn, false);
            }
        });
    }

    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!supabase) {
                showAlertMessage('Database not connected. Please refresh the page.', 'error', paymentForm);
                return;
            }

            const submitBtn = paymentForm.querySelector('button[type="submit"]');
            const formData = new FormData(paymentForm);
            const transactionRef = formData.get('transactionRef');
            
            setLoading(submitBtn, true);

            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError || !session?.user) {
                    throw new Error('Session error. Please login again.');
                }

                const user = session.user;

                const { error: paymentError } = await supabase.from('payments').insert({
                    user_id: user.id,
                    email: user.email,
                    transaction_ref: transactionRef,
                    amount: 20,
                    status: 'pending'
                });

                if (paymentError) {
                    console.log('Payment insert error:', paymentError.message);
                }

                showAlertMessage('Payment submitted! Check your email for the vault PIN. Redirecting...', 'success', paymentForm);
                
                setTimeout(() => {
                    window.location.href = 'vault.html';
                }, 3000);

            } catch (error) {
                showAlertMessage(error.message || 'Please login first to submit payment.', 'error', paymentForm);
            } finally {
                setLoading(submitBtn, false);
            }
        });
    }

    async function checkExistingSession() {
        if (!supabase) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: accessData } = await supabase
                    .from('users_access')
                    .select('paid_access')
                    .eq('user_id', session.user.id)
                    .single();

                if (accessData?.paid_access) {
                    window.location.href = 'vault.html';
                } else {
                    if (paymentSection) paymentSection.classList.remove('hidden');
                }
            }
        } catch (e) {
            console.log('Session check:', e.message);
        }
    }

    checkExistingSession();
});
