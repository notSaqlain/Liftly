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

        if (mockupImgElement && slides[currentSlide].contains(mockupImgElement) && currentSlide !== index) {
            stopMockupSlider();
        }

        slides[currentSlide].classList.remove('active');
        dots[currentSlide].className = 'w-3 h-3 rounded-full transition-all duration-500 cursor-pointer bg-slate-600 hover:bg-slate-400';

        currentSlide = index;

        slides[currentSlide].classList.add('active');
        dots[currentSlide].className = 'w-3 h-3 rounded-full transition-all duration-500 cursor-pointer bg-blue-500 w-8';

        updateUI();

        if (mockupImgElement && slides[currentSlide].contains(mockupImgElement)) {
            stopMockupSlider();
            currentMockupIndex = 0;
            mockupImgElement.src = mockupImages[0];
            mockupImgElement.style.opacity = '1';
            startMockupSlider();
        }
    }

    nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
    prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ') goToSlide(currentSlide + 1);
        if (e.key === 'ArrowLeft') goToSlide(currentSlide - 1);
    });

    // --- Mockup Slider Logic ---
    const mockupImages = [
        'assets/mockup/mockup1.png',
        'assets/mockup/mockup2.png',
        'assets/mockup/mockup3.png',
        'assets/mockup/mockup5.png',
        'assets/mockup/mockup6.png',
        'assets/mockup/mockup7.png',
        'assets/mockup/mockup8.png',
        'assets/mockup/mockup9.png',
        'assets/mockup/mockup10.png',
        'assets/mockup/mockup11.png',
        'assets/mockup/mockup12.png',
        'assets/mockup/mockup13.png',
        'assets/mockup/mockup14.png',
        'assets/mockup/mockup15.png',
        'assets/mockup/mockup16.png'

    ];
    let currentMockupIndex = 0;
    const mockupImgElement = document.getElementById('mockupImage');
    const mockupPrevBtn = document.getElementById('mockupPrev');
    const mockupNextBtn = document.getElementById('mockupNext');
    let mockupInterval;
    let transitionTimeout;

    function updateMockup(index) {
        if (!mockupImgElement) return;
        currentMockupIndex = (index + mockupImages.length) % mockupImages.length;
        mockupImgElement.style.opacity = '0';

        clearTimeout(transitionTimeout);
        transitionTimeout = setTimeout(() => {
            const nextImg = new Image();
            nextImg.onload = () => {
                mockupImgElement.src = nextImg.src;
                mockupImgElement.style.opacity = '1';
            };
            nextImg.onerror = function () {
                mockupImgElement.src = `https://via.placeholder.com/375x812/1e293b/ffffff?text=Mockup+${currentMockupIndex + 1}`;
                mockupImgElement.style.opacity = '1';
            };
            nextImg.src = mockupImages[currentMockupIndex];
        }, 300);
    }

    function startMockupSlider() {
        mockupInterval = setInterval(() => {
            updateMockup(currentMockupIndex + 1);
        }, 8000);
    }

    function stopMockupSlider() {
        clearInterval(mockupInterval);
    }

    if (mockupImgElement) {
        if (slides[currentSlide].contains(mockupImgElement)) {
            currentMockupIndex = 0;
            mockupImgElement.src = mockupImages[0];
            mockupImgElement.style.opacity = '1';
            startMockupSlider();
        }

        if (mockupPrevBtn) {
            mockupPrevBtn.addEventListener('click', () => {
                stopMockupSlider();
                updateMockup(currentMockupIndex - 1);
                startMockupSlider();
            });
        }

        if (mockupNextBtn) {
            mockupNextBtn.addEventListener('click', () => {
                stopMockupSlider();
                updateMockup(currentMockupIndex + 1);
                startMockupSlider();
            });
        }
    }

    updateUI();
});
