// assets/js/script.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inizializza Icone Lucide
    lucide.createIcons();

    // 2. Genera Sfondo con Icone Palestra Fluttuanti
    const backgroundContainer = document.getElementById('floating-bg');
    if (backgroundContainer) {
        const gymIcons = [
            'dumbbell',      // Manubrio base
            'weight',        // Peso/Disco
            'biceps-flexed', // Bicipite
            'activity',      // Battito
            'timer',         // Cronometro
            'flame',         // Calorie/Fuoco
            'trophy',        // Trofeo
            'target',        // Obiettivo
            'zap'            // Energia
        ];

        // Creiamo gli elementi fluttuanti dinamicamente per averne di più senza ingombrare l'HTML
        for (let i = 0; i < 15; i++) {
            const iconElement = document.createElement('i');
            
            // Scegli icona casuale
            const randomIcon = gymIcons[Math.floor(Math.random() * gymIcons.length)];
            iconElement.setAttribute('data-lucide', randomIcon);
            
            // Aggiungi classe base
            iconElement.classList.add('floating-item');
            
            // Posizione e animazione casuali inline per sovrascrivere il CSS e dare più varianza
            const leftPos = Math.random() * 95; // 0% - 95%
            const duration = 20 + Math.random() * 25; // 20s - 45s
            const delay = Math.random() * 15; // 0s - 15s
            const size = 60 + Math.random() * 100; // 60px - 160px
            const opacity = 0.02 + Math.random() * 0.04; // 0.02 - 0.06
            
            iconElement.style.left = `${leftPos}%`;
            iconElement.style.animationDuration = `${duration}s`;
            iconElement.style.animationDelay = `${delay}s`;
            iconElement.style.width = `${size}px`;
            iconElement.style.height = `${size}px`;
            iconElement.style.opacity = `${opacity}`;
            
            // Per permettere a Lucide di renderizzare l'icona e mantenere le dimensioni personalizzate
            iconElement.style.strokeWidth = "1";
            
            backgroundContainer.appendChild(iconElement);
        }
        
        // Re-inizializza per renderizzare le nuove icone inserite
        lucide.createIcons();
    }

    // 3. Logica Presentazione (Slide Navigation)
    const slides = document.querySelectorAll('.slide');
    const dotsContainer = document.getElementById('dots-container');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    let currentSlide = 0;
    let isAnimating = false;

    // Crea Navigation Dots
    if (dotsContainer) {
        slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = `transition-all duration-300 ease-out ${index === 0 ? 'w-12 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'w-4 h-2 rounded-full bg-slate-700 hover:bg-slate-500'}`;
            dot.setAttribute('aria-label', `Vai alla slide ${index + 1}`);
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        });
    }

    const dots = dotsContainer ? dotsContainer.querySelectorAll('button') : [];

    function goToSlide(index) {
        if (isAnimating || index === currentSlide || index < 0 || index >= slides.length) return;
        isAnimating = true;

        const current = slides[currentSlide];
        const next = slides[index];
        const direction = index > currentSlide ? 'next' : 'prev';

        // Aggiorna Dots
        dots.forEach((dot, i) => {
            if (i === index) {
                dot.className = 'transition-all duration-300 ease-out w-12 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
            } else {
                dot.className = 'transition-all duration-300 ease-out w-4 h-2 rounded-full bg-slate-700 hover:bg-slate-500';
            }
        });

        // Applica classi per animazione in entrata/uscita
        current.classList.remove('active');
        if (direction === 'next') {
            current.classList.add('prev');
        } else {
            current.classList.remove('prev');
        }

        next.classList.remove('prev');
        next.classList.add('active');

        // Sblocca navigazione a fine transizione CSS (0.6s)
        setTimeout(() => {
            currentSlide = index;
            isAnimating = false;
            updateButtons();
        }, 600);
    }

    // Aggiorna stato pulsanti
    function updateButtons() {
        if (prevBtn) {
            if (currentSlide === 0) {
                prevBtn.classList.add('opacity-30', 'pointer-events-none');
            } else {
                prevBtn.classList.remove('opacity-30', 'pointer-events-none');
            }
        }
        
        if (nextBtn) {
            if (currentSlide === slides.length - 1) {
                nextBtn.classList.add('opacity-30', 'pointer-events-none');
            } else {
                nextBtn.classList.remove('opacity-30', 'pointer-events-none');
            }
        }
    }

    // Event Listeners Pulsanti
    if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
    if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));

    // Navigazione Tastiera
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'Space') {
            e.preventDefault();
            goToSlide(currentSlide + 1);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goToSlide(currentSlide - 1);
        }
    });

    // Navigazione Rotellina (Debounced)
    let wheelTimeout;
    window.addEventListener('wheel', (e) => {
        if (isAnimating) return;
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
            if (e.deltaY > 50) goToSlide(currentSlide + 1);
            if (e.deltaY < -50) goToSlide(currentSlide - 1);
        }, 50);
    }, {passive: true});

    // Navigazione Touch (Swipe)
    let touchStartY = 0;
    
    window.addEventListener('touchstart', e => {
        touchStartY = e.touches[0].clientY;
    }, {passive: true});

    window.addEventListener('touchend', e => {
        const touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchStartY - touchEndY;

        if (Math.abs(deltaY) > 50) {
            if (deltaY > 0) goToSlide(currentSlide + 1); // Up
            else goToSlide(currentSlide - 1); // Down
        }
    }, {passive: true});

    // Inizializzazione finale
    updateButtons();
    setTimeout(() => {
        if(slides.length > 0) {
            slides[0].classList.add('active');
        }
    }, 100);
});
