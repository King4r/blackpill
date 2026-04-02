async function initContact() {
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

let supabase = null;
initContact().then(client => {
    supabase = client;
});

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const formData = new FormData(contactForm);
            const name = formData.get('name');
            const email = formData.get('email');
            const subject = formData.get('subject');
            const message = formData.get('message');

            setLoading(submitBtn, true);

            try {
                if (supabase) {
                    const { error } = await supabase.from('messages').insert({
                        name,
                        email,
                        subject,
                        message
                    });

                    if (error) throw error;
                }

                showAlertMessage('Message sent! We will get back to you soon.', 'success');
                contactForm.reset();
            } catch (error) {
                showAlertMessage(error.message || 'Failed to send message', 'error');
            } finally {
                setLoading(submitBtn, false);
            }
        });
    }
});

function showAlertMessage(message, type) {
    const existing = document.querySelector('.form-alert');
    if (existing) existing.remove();

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} form-alert`;
    alert.textContent = message;

    const form = document.getElementById('contactForm');
    if (form) {
        form.insertBefore(alert, form.firstChild);
        setTimeout(() => alert.remove(), 5000);
    }
}

function setLoading(button, loading) {
    if (loading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.innerHTML = '<span class="spinner"></span> Sending...';
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Send Message';
    }
}
