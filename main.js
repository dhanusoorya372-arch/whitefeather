document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.main-header');
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const counters = document.querySelectorAll('.counter');
    const themeToggle = document.getElementById('themeToggle');

    const applyTheme = (theme) => {
        const isDark = theme === 'dark';
        document.body.classList.toggle('dark-theme', isDark);
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-moon', !isDark);
                icon.classList.toggle('fa-sun', isDark);
            }
            themeToggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
        }
        localStorage.setItem('whiteFeatherTheme', theme);
    };

    const savedTheme = localStorage.getItem('whiteFeatherTheme') || 'light';
    applyTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
            applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
        });
    }

    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-xmark');
            }
        });
    }

    if (counters.length) {
        const observerOptions = { threshold: 0.7 };

        const counterObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = Number(entry.target.getAttribute('data-target'));
                    const countUp = () => {
                        const current = Number(entry.target.innerText);
                        const increment = target / 100;

                        if (current < target) {
                            entry.target.innerText = Math.ceil(current + increment);
                            setTimeout(countUp, 20);
                        } else {
                            entry.target.innerText = target + (target === 99 ? '%' : '+');
                        }
                    };

                    countUp();
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        counters.forEach(counter => counterObserver.observe(counter));
    }

    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        const statusBox = contactForm.querySelector('.form-status');

        const setStatus = (message, type = 'success') => {
            if (!statusBox) return;
            statusBox.textContent = message;
            statusBox.className = `form-status ${type}`;
        };

        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(contactForm);
            const payload = {
                name: String(formData.get('name') || '').trim(),
                email: String(formData.get('email') || '').trim(),
                company: String(formData.get('company') || '').trim(),
                message: String(formData.get('message') || '').trim()
            };

            if (!payload.name || !payload.email || !payload.message) {
                setStatus('Please complete your name, email, and project details.', 'error');
                return;
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(payload.email)) {
                setStatus('Please enter a valid email address.', 'error');
                return;
            }

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    setStatus(result.message || 'Something went wrong while sending your inquiry.', 'error');
                    return;
                }

                setStatus(result.message || 'Thank you! Your inquiry has been sent successfully.', 'success');
                contactForm.reset();

                if (window.location.pathname.endsWith('contact.html')) {
                    setTimeout(() => {
                        window.location.href = 'thank-you.html';
                    }, 700);
                }
            } catch (error) {
                console.error('Contact form submission failed:', error);
                setStatus('Unable to send the message right now. Please try again later.', 'error');
            }
        });
    }

    const observerOptions = { threshold: 0.15 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
            }
        });
    }, observerOptions);

    document.querySelectorAll('[data-aos]').forEach(el => {
        observer.observe(el);
    });
});