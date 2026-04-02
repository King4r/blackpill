let supabase = null;

async function initSupabase() {
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

function createParticles() {
    const container = document.querySelector('.hero-bg-particles');
    if (!container) return;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        container.appendChild(particle);
    }
}

function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuBtn.classList.toggle('active');
        });
        
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuBtn.classList.remove('active');
            });
        });
    }
}

function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                faqItems.forEach(i => i.classList.remove('active'));
                
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });
}

async function updateNavbar() {
    const navLinks = document.getElementById('navLinks');
    if (!navLinks || !supabase) return;

    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
            navLinks.innerHTML = `
                <a href="course.html">Course</a>
                <a href="vault.html">Vault</a>
                <a href="profile.html">Profile</a>
                <button class="btn-outline logout-btn" style="padding: 8px 20px; font-size: 0.8rem;">Logout</button>
            `;
        }
    } catch (e) {
        console.error('Navbar update error:', e);
    }
}

async function logout() {
    if (supabase) {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error('Logout error:', e);
        }
    }
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', async () => {
    supabase = await initSupabase();
    createParticles();
    initMobileMenu();
    initFAQ();
    
    await updateNavbar();

    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('logout-btn') || e.target.closest('.logout-btn')) {
            e.preventDefault();
            await logout();
        }
    });
});
