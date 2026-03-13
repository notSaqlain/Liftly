// =========================================
// LIFTLY PRESENTATION – DYNAMIC ENGINE
// =========================================

document.addEventListener('DOMContentLoaded', () => {

    // 1. Initialize Lucide icons
    lucide.createIcons();

    // =========================================
    // PARTICLE SYSTEM (Canvas)
    // =========================================
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        const PARTICLE_COUNT = 60;

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        class Particle {
            constructor() {
                this.reset();
            }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.3;
                this.speedY = (Math.random() - 0.5) * 0.3;
                this.opacity = Math.random() * 0.5 + 0.1;
                this.hue = 210 + Math.random() * 40; // Blue-ish range
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                // Wrap around screen
                if (this.x < 0) this.x = canvas.width;
                if (this.x > canvas.width) this.x = 0;
                if (this.y < 0) this.y = canvas.height;
                if (this.y > canvas.height) this.y = 0;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, ${this.opacity})`;
                ctx.fill();
            }
        }

        // Create particles
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new Particle());
        }

        // Draw connecting lines between nearby particles
        function drawLines() {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 120) {
                        const opacity = (1 - dist / 120) * 0.15;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(100, 160, 255, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            drawLines();
            requestAnimationFrame(animateParticles);
        }
        animateParticles();
    }

    // =========================================
    // FLOATING GYM ICONS
    // =========================================
    const floatingBg = document.getElementById('floating-bg');
    if (floatingBg) {
        const gymIcons = ['dumbbell', 'weight', 'biceps-flexed', 'activity', 'timer', 'flame', 'trophy', 'target', 'zap', 'heart-pulse'];

        for (let i = 0; i < 12; i++) {
            const icon = document.createElement('i');
            const randomIcon = gymIcons[Math.floor(Math.random() * gymIcons.length)];
            icon.setAttribute('data-lucide', randomIcon);
            icon.classList.add('floating-item');

            const left = Math.random() * 95;
            const duration = 22 + Math.random() * 28;
            const delay = Math.random() * 20;
            const size = 50 + Math.random() * 80;

            icon.style.left = `${left}%`;
            icon.style.animationDuration = `${duration}s`;
            icon.style.animationDelay = `${delay}s`;
            icon.style.width = `${size}px`;
            icon.style.height = `${size}px`;
            icon.style.color = `rgba(148, 163, 184, 0.04)`;
            icon.style.strokeWidth = '1';

            floatingBg.appendChild(icon);
        }

        // Re-init so Lucide renders the new icons
        lucide.createIcons();
    }

    // =========================================
    // SLIDE NAVIGATION LOGIC
    // =========================================
    const slides = document.querySelectorAll('.slide');
    const dotsContainer = document.getElementById('dots-container');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    let currentSlide = 0;
    let isAnimating = false;

    // Create dots
    if (dotsContainer) {
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = i === 0
                ? 'transition-all duration-300 w-10 h-2 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]'
                : 'transition-all duration-300 w-3 h-2 rounded-full bg-slate-700 hover:bg-slate-500';
            dot.setAttribute('aria-label', `Slide ${i + 1}`);
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        });
    }

    const dots = dotsContainer ? dotsContainer.querySelectorAll('button') : [];

    function goToSlide(index) {
        if (isAnimating || index === currentSlide || index < 0 || index >= slides.length) return;
        isAnimating = true;

        const direction = index > currentSlide ? 'next' : 'prev';

        // Update dots
        dots.forEach((dot, i) => {
            dot.className = i === index
                ? 'transition-all duration-300 w-10 h-2 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]'
                : 'transition-all duration-300 w-3 h-2 rounded-full bg-slate-700 hover:bg-slate-500';
        });

        // Animate slides
        slides[currentSlide].classList.remove('active');
        if (direction === 'next') slides[currentSlide].classList.add('prev');
        else slides[currentSlide].classList.remove('prev');

        slides[index].classList.remove('prev');
        slides[index].classList.add('active');

        setTimeout(() => {
            currentSlide = index;
            isAnimating = false;
            updateButtons();
        }, 700);
    }

    function updateButtons() {
        if (prevBtn) {
            prevBtn.classList.toggle('opacity-30', currentSlide === 0);
            prevBtn.classList.toggle('pointer-events-none', currentSlide === 0);
        }
        if (nextBtn) {
            nextBtn.classList.toggle('opacity-30', currentSlide === slides.length - 1);
            nextBtn.classList.toggle('pointer-events-none', currentSlide === slides.length - 1);
        }
    }

    // Button clicks
    if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
    if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goToSlide(currentSlide + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); goToSlide(currentSlide - 1); }
    });

    // Mouse wheel (debounced)
    let wheelTimer;
    window.addEventListener('wheel', (e) => {
        if (isAnimating) return;
        clearTimeout(wheelTimer);
        wheelTimer = setTimeout(() => {
            if (e.deltaY > 50) goToSlide(currentSlide + 1);
            if (e.deltaY < -50) goToSlide(currentSlide - 1);
        }, 60);
    }, { passive: true });

    // Touch swipe
    let touchStartY = 0;
    window.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchend', e => {
        const dy = touchStartY - e.changedTouches[0].clientY;
        if (Math.abs(dy) > 50) {
            if (dy > 0) goToSlide(currentSlide + 1);
            else goToSlide(currentSlide - 1);
        }
    }, { passive: true });

    // Init
    updateButtons();
    setTimeout(() => { if (slides.length) slides[0].classList.add('active'); }, 100);
});
