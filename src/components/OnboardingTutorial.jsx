import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';

const TOUR_STEPS = [
  {
    selector: '.tour-start-workout',
    title: 'Log Your Session',
    content: 'Hit "Start Workout" to begin. Select your training day, track your weights and reps in real-time, and crush your records.',
    placement: 'auto'
  },
  {
    selector: '.tour-points',
    title: 'Earn XP',
    content: 'Complete daily workouts to earn points and climb the global leaderboard! Every workout counts towards your score.',
    placement: 'auto'
  },
  {
    selector: '.tour-nav-bar',
    title: 'Explore Liftly',
    content: 'Use this bar to switch between your Workout Split, personal Stats, and the Gym community features.',
    placement: 'top' // forza in alto rispetto alla navbar
  }
];

const OnboardingTutorial = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const location = useLocation();

  // controllo se l'utente ha gia visto il tutorial
  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenTutorial');
    // Mostra il tutorial solo se siamo nella Dashboard, cosi troviamo gli elementi
    if (!hasSeen && location.pathname === '/') {
      
      // Aspettiamo che il primo elemento esista nel DOM prima di mostrare
      const checkExist = setInterval(() => {
        const el = document.querySelector(TOUR_STEPS[0].selector);
        if (el) {
          clearInterval(checkExist);
          setIsVisible(true);
        }
      }, 300);

      const safetyTimeout = setTimeout(() => {
        clearInterval(checkExist);
        // se non lo trova entro 3 secondi, lo mostriamo lo stesso per evitare blocchi
        if (!hasSeen) setIsVisible(true);
      }, 3000);

      return () => {
        clearInterval(checkExist);
        clearTimeout(safetyTimeout);
      };
    }
  }, [location.pathname]);

  // chiude il tutorial e salva lo stato nel browser
  const handleCompleteOrSkip = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    setIsVisible(false);
  };

  // passa al passo successivo
  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleCompleteOrSkip();
    }
  };

  // funzione per calcolare le coordinate esatte dell'elemento da evidenziare
  const updateRect = useCallback(() => {
    if (!isVisible) return;
    const step = TOUR_STEPS[currentStep];
    const el = document.querySelector(step.selector);
    
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setTargetRect(null);
    }
  }, [currentStep, isVisible]);

  // ascoltiamo eventi di resize o scrolling per ricalcolare il buco
  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    
    // questo intervallo e un piccolo trucco per gestire animazioni CSS o layout lenti
    const interval = setInterval(updateRect, 100);
    
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
      clearInterval(interval);
    };
  }, [updateRect]);

  if (!isVisible) return null;

  const currentData = TOUR_STEPS[currentStep];
  
  // calcoliamo lo stile del tooltip (sopra o sotto l'elemento)
  let tooltipStyle = {};
  if (targetRect) {
    const isTopPlacement = currentData.placement === 'top' || (targetRect.y > window.innerHeight / 2);
    
    if (isTopPlacement) {
      // lo mettiamo sopra l'elemento
      tooltipStyle = {
        bottom: `${window.innerHeight - targetRect.y + 16}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: '320px'
      };
    } else {
      // lo mettiamo sotto l'elemento
      tooltipStyle = {
        top: `${targetRect.y + targetRect.height + 16}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: '320px'
      };
    }
  } else {
    // posizione di fallback se l'elemento non viene trovato
    tooltipStyle = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'calc(100% - 32px)',
      maxWidth: '320px'
    };
  }

  // aggiungiamo un po' di margine al buco cosi non e incollato all'elemento
  const padding = 8;
  const holeX = targetRect ? targetRect.x - padding : 0;
  const holeY = targetRect ? targetRect.y - padding : 0;
  const holeW = targetRect ? targetRect.width + (padding * 2) : 0;
  const holeH = targetRect ? targetRect.height + (padding * 2) : 0;

  return createPortal(
    <div className="fixed inset-0 z-[200] overflow-hidden pointer-events-auto">
      {/* SVG Mask per creare l'effetto "spotlight" che scurisce tutto tranne il buco */}
      <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none transition-all duration-500 ease-in-out">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect 
                x={holeX} 
                y={holeY} 
                width={holeW} 
                height={holeH} 
                rx={16} 
                fill="black" 
                className="transition-all duration-500 ease-in-out"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(4, 8, 16, 0.85)" mask="url(#spotlight-mask)" />
      </svg>

      {/* Tooltip fluttuante che punta all'elemento */}
      <div 
        className="absolute bg-[#0D1526] border border-liftly-teal/30 rounded-2xl p-4 shadow-2xl transition-all duration-500 ease-in-out pointer-events-auto"
        style={tooltipStyle}
      >
        <button 
          onClick={handleCompleteOrSkip}
          className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-2 mb-2 pr-6">
          <div className="w-2 h-2 rounded-full bg-liftly-teal animate-pulse" />
          <h3 className="text-white font-black text-[15px]">{currentData.title}</h3>
        </div>
        
        <p className="text-white/60 text-xs leading-relaxed mb-4">
          {currentData.content}
        </p>

        <div className="flex items-center justify-between mt-2">
          {/* pallini di progresso in basso a sinistra */}
          <div className="flex gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentStep ? 'bg-liftly-teal' : 'bg-white/10'}`} 
              />
            ))}
          </div>

          <button 
            onClick={nextStep}
            className="px-4 py-2 bg-liftly-teal text-[#040810] font-black text-xs rounded-xl active:scale-95 transition-transform"
          >
            {currentStep === TOUR_STEPS.length - 1 ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OnboardingTutorial;
