// Inizializza Icone Lucide
lucide.createIcons();

document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const nextText = document.getElementById('nextText');
    const nextIcon = document.getElementById('nextIcon');
    const dotsContainer = document.getElementById('dots-container');
    let currentSlide = 0;

    // Genera i dots di navigazione
    slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = `w-3 h-3 rounded-full transition-all duration-500 cursor-pointer ${index === 0 ? 'bg-blue-500 w-8' : 'bg-slate-600 hover:bg-slate-400'}`;
        dot.onclick = () => goToSlide(index);
        dotsContainer.appendChild(dot);
    });
    const dots = dotsContainer.querySelectorAll('button');

    function updateUI() {
        if (currentSlide === 0) {
            prevBtn.style.opacity = '0.3';
            prevBtn.style.pointerEvents = 'none';
        } else {
            prevBtn.style.opacity = '1';
            prevBtn.style.pointerEvents = 'auto';
        }

        if (currentSlide === slides.length - 1) {
            nextText.innerText = 'Fine';
            nextIcon.setAttribute('data-lucide', 'check');
            nextBtn.classList.replace('bg-blue-600', 'bg-emerald-600');
            nextBtn.classList.replace('hover:bg-blue-500', 'hover:bg-emerald-500');
            nextBtn.classList.replace('shadow-[0_0_20px_rgba(59,130,246,0.5)]', 'shadow-[0_0_20px_rgba(16,185,129,0.5)]');
        } else {
            nextText.innerText = 'Prossimo';
            nextIcon.setAttribute('data-lucide', 'arrow-right');
            nextBtn.classList.replace('bg-emerald-600', 'bg-blue-600');
            nextBtn.classList.replace('hover:bg-emerald-500', 'hover:bg-blue-500');
            nextBtn.classList.replace('shadow-[0_0_20px_rgba(16,185,129,0.5)]', 'shadow-[0_0_20px_rgba(59,130,246,0.5)]');
        }
        lucide.createIcons();
    }

    function goToSlide(index) {
        if (index < 0 || index >= slides.length) return;

        slides[currentSlide].classList.remove('active');
        dots[currentSlide].className = 'w-3 h-3 rounded-full transition-all duration-500 cursor-pointer bg-slate-600 hover:bg-slate-400';

        currentSlide = index;

        slides[currentSlide].classList.add('active');
        dots[currentSlide].className = 'w-3 h-3 rounded-full transition-all duration-500 cursor-pointer bg-blue-500 w-8';

        updateUI();
    }

    nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
    prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ') goToSlide(currentSlide + 1);
        if (e.key === 'ArrowLeft') goToSlide(currentSlide - 1);
    });

    updateUI();
});
