// assets/js/script.js
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    const slides = document.querySelectorAll('.slide');
    const dotsContainer = document.getElementById('dots-container');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    let currentSlide = 0;
    let isAnimating = false;

    // Create Navigation Dots
    slides.forEach((_, index) => {
        const dot = document.createElement('button');
        // Initial state for dot
        dot.className = `transition-all duration-500 ease-in-out ${index === 0 ? 'w-10 h-3 rounded-full bg-blue-500 glow-box' : 'w-3 h-3 rounded-full bg-slate-600 hover:bg-slate-400'}`;
        dot.setAttribute('aria-label', `Vai alla slide ${index + 1}`);
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer.querySelectorAll('button');

    function goToSlide(index) {
        if (isAnimating || index === currentSlide || index < 0 || index >= slides.length) return;
        isAnimating = true;

        const current = slides[currentSlide];
        const next = slides[index];
        const direction = index > currentSlide ? 'next' : 'prev';

        // Update Dots styling
        dots.forEach((dot, i) => {
            if (i === index) {
                dot.className = 'transition-all duration-500 ease-in-out w-10 h-3 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]';
            } else {
                dot.className = 'transition-all duration-500 ease-in-out w-3 h-3 rounded-full bg-slate-600 hover:bg-slate-400';
            }
        });

        // Set direction classes for animation
        current.classList.remove('active');
        if (direction === 'next') {
            current.classList.add('prev');
        } else {
            current.classList.remove('prev');
        }

        next.classList.remove('prev');
        next.classList.add('active');

        // Unlock animation lock
        setTimeout(() => {
            currentSlide = index;
            isAnimating = false;
            updateButtons();
        }, 800); // matches CSS transition duration
    }

    // Update opacity and pointer-events for Next/Prev buttons
    function updateButtons() {
        if (prevBtn) {
            if (currentSlide === 0) {
                prevBtn.classList.add('opacity-30', 'pointer-events-none');
                prevBtn.classList.remove('hover:bg-white/10');
            } else {
                prevBtn.classList.remove('opacity-30', 'pointer-events-none');
                prevBtn.classList.add('hover:bg-white/10');
            }
        }
        
        if (nextBtn) {
            if (currentSlide === slides.length - 1) {
                nextBtn.classList.add('opacity-30', 'pointer-events-none');
                nextBtn.classList.remove('hover:from-blue-500', 'hover:to-indigo-500');
            } else {
                nextBtn.classList.remove('opacity-30', 'pointer-events-none');
                nextBtn.classList.add('hover:from-blue-500', 'hover:to-indigo-500');
            }
        }
    }

    // Button Listeners
    if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
    if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'Space') {
            e.preventDefault();
            goToSlide(currentSlide + 1);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goToSlide(currentSlide - 1);
        }
    });

    // Mouse Wheel / Trackpad Scroll Navigation (with debouncing/throttling)
    let wheelTimeout;
    window.addEventListener('wheel', (e) => {
        if (isAnimating) return;
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
            if (e.deltaY > 30) goToSlide(currentSlide + 1);
            if (e.deltaY < -30) goToSlide(currentSlide - 1);
        }, 50);
    }, {passive: true});

    // Swipe gestures on touch devices
    let touchStartY = 0;
    let touchStartX = 0;

    window.addEventListener('touchstart', e => {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
    }, {passive: true});

    window.addEventListener('touchend', e => {
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndX = e.changedTouches[0].clientX;
        
        const deltaX = touchStartX - touchEndX;
        const deltaY = touchStartY - touchEndY;

        // Ensure swipe distance is significant
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0) goToSlide(currentSlide + 1); // Swiped left -> Next
            else goToSlide(currentSlide - 1); // Swiped right -> Prev
        } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
            if (deltaY > 0) goToSlide(currentSlide + 1); // Swiped up -> Next
            else goToSlide(currentSlide - 1); // Swiped down -> Prev
        }
    }, {passive: true});

    // Add a custom glowing background cursor follower effect
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });
    
    // Add interaction to clickable elements to grow cursor
    const interactiveElements = document.querySelectorAll('button, a, .glass-panel');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.width = '800px';
            cursor.style.height = '800px';
            cursor.style.opacity = '0.5';
        });
        el.addEventListener('mouseleave', () => {
            cursor.style.width = '600px';
            cursor.style.height = '600px';
            cursor.style.opacity = '1';
        });
    });

    // Initial setup
    updateButtons();

    // Trigger initial animations
    setTimeout(() => {
        slides[0].classList.add('active');
    }, 100);
});
