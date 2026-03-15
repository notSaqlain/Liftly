// Inizializza Icone
lucide.createIcons();

// Funzione per Aprire/Chiudere i sottomenu (Accordion)
function toggleMenu(menuId, iconId) {
    const menu = document.getElementById(menuId);
    const icon = document.getElementById(iconId);

    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        menu.classList.add('block');
        icon.classList.add('rotate-180');
    } else {
        menu.classList.add('hidden');
        menu.classList.remove('block');
        icon.classList.remove('rotate-180');
    }
}

// Funzione per mostrare i contenuti principali caricandoli da file esterni (AJAX)
async function showSection(sectionId, clickedElement, isSubmenu) {

    // 1. Carica il contenuto dal file HTML esterno in sections/
    try {
        const response = await fetch(`sections/${sectionId}.html`);
        if (!response.ok) {
            throw new Error(`Errore nel caricamento della sezione: ${response.status} ${response.statusText}`);
        }
        const html = await response.text();

        // Inserisci il contenuto nel main container
        const mainContainer = document.getElementById("main-content-area");
        if (mainContainer) {
            mainContainer.innerHTML = html;
            // Reinizializza le icone lucide nel nuovo HTML appena caricato
            lucide.createIcons();

            // Applica l'animazione
            const newSection = mainContainer.querySelector('.section-content');
            if (newSection) newSection.classList.add('active');
        }

    } catch (error) {
        console.error("Si è verificato un errore: ", error);
        const mainContainer = document.getElementById("main-content-area");
        if (mainContainer) {
            mainContainer.innerHTML = `
            <section class="section-content active">
                <div class="flex flex-col items-center justify-center py-20 text-center">
                    <div class="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                        <i data-lucide="alert-triangle" class="w-12 h-12"></i>
                    </div>
                    <h1 class="text-3xl font-black text-[#001540] mb-2">Errore di Caricamento</h1>
                    <p class="text-slate-500">Non è stato possibile caricare la sezione richiesta (<code>${sectionId}.html</code>).</p>
                    <p class="text-xs text-slate-400 mt-4">Nota: il caricamento dinamico AJAX richiede un server web locale (come Live Server). Non funzionerà aprendo il file direttamente dal filesystem (file://).</p>
                </div>
            </section>
            `;
            lucide.createIcons();
        }
    }


    // 2. Reset stili link
    document.querySelectorAll('.submenu-link').forEach(link => {
        link.classList.remove('active-link');
    });
    document.querySelectorAll('.main-link').forEach(link => {
        link.classList.remove('active-link', 'bg-[#001540]', 'text-white');
        link.classList.add('text-slate-700', 'hover:bg-slate-50');
    });

    // 3. Applica stile al link cliccato
    if (clickedElement) {
        if (isSubmenu) {
            clickedElement.classList.add('active-link');
        } else {
            clickedElement.classList.remove('text-slate-700', 'hover:bg-slate-50');
            clickedElement.classList.add('active-link');
        }
    }

    // 4. Chiudi il menu mobile se siamo su smartphone
    if (window.innerWidth < 1024) {
        document.getElementById('sidebar').classList.add('-translate-x-full');
        setTimeout(() => { document.getElementById('sidebar').classList.add('hidden'); }, 300);
    }

    // 5. Torna in cima alla pagina
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Gestione Menu Mobile
const sidebar = document.getElementById('sidebar');
if (document.getElementById('mobile-menu-btn')) {
    document.getElementById('mobile-menu-btn').onclick = () => {
        sidebar.classList.remove('hidden', '-translate-x-full');
        sidebar.classList.add('translate-x-0');
    };
}
if (document.getElementById('close-menu-btn')) {
    document.getElementById('close-menu-btn').onclick = () => {
        sidebar.classList.add('-translate-x-full');
        setTimeout(() => sidebar.classList.add('hidden'), 300);
    };
}

// Carica la landing page iniziale all'avvio
document.addEventListener("DOMContentLoaded", () => {
    showSection('landing-page', null, false);
});
