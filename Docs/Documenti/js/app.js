// Inizializza Icone
lucide.createIcons();

// --- STATO TAB ---
let openTabs = [];
let activeTabPath = null;

// --- GESTIONE ALBERO FILE (EXPLORER) ---
function toggleFolder(folderId, chevronId, folderIconId) {
    const folder = document.getElementById(folderId);
    const chevron = document.getElementById(chevronId);
    const folderIcon = document.getElementById(folderIconId);

    if (folder.classList.contains('hidden')) {
        folder.classList.remove('hidden');
        folder.classList.add('block');
        if (chevron) chevron.setAttribute('data-lucide', 'chevron-down');
        if (folderIcon) folderIcon.setAttribute('data-lucide', 'folder-open');
    } else {
        folder.classList.add('hidden');
        folder.classList.remove('block');
        if (chevron) chevron.setAttribute('data-lucide', 'chevron-right');
        if (folderIcon) folderIcon.setAttribute('data-lucide', 'folder');
    }
    lucide.createIcons();
}

// --- GESTIONE TAB ---
function openFile(path, title) {
    // 1. Aggiungi alle tab aperte se non esiste
    if (!openTabs.find(t => t.path === path)) {
        openTabs.push({ path, title });
    }
    activeTabPath = path;
    
    // 2. Aggiorna UI Tabs
    renderTabs();

    // 3. Evidenzia il file selezionato nell'albero
    document.querySelectorAll('.file-link').forEach(link => {
        if (link.dataset.path === path) {
            link.classList.add('bg-slate-200', 'text-[#001540]', 'font-semibold');
        } else {
            link.classList.remove('bg-slate-200', 'text-[#001540]', 'font-semibold');
        }
    });

    // 4. Carica il contenuto
    loadContent(path);

    // 5. Chiudi il menu mobile se siamo su smartphone
    if (window.innerWidth < 1024) {
        document.getElementById('sidebar').classList.add('-translate-x-full');
        setTimeout(() => { document.getElementById('sidebar').classList.add('hidden'); }, 300);
    }
}

function closeTab(event, path) {
    event.stopPropagation(); // Evita che il click chiuda anche la tab ma scateni openFile

    openTabs = openTabs.filter(t => t.path !== path);
    
    if (openTabs.length === 0) {
        activeTabPath = null;
        document.getElementById('main-content-area').innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-slate-400 mt-32">
                <i data-lucide="layout" class="w-16 h-16 mb-4 text-slate-200"></i>
                <p>Nessun file aperto. Seleziona un file dall'Explorer.</p>
            </div>
        `;
        document.querySelectorAll('.file-link').forEach(link => {
            link.classList.remove('bg-slate-200', 'text-[#001540]', 'font-semibold');
        });
        renderTabs();
    } else if (activeTabPath === path) {
        // Se chiudo la tab attiva, attivo l'ultima tab rimasta
        const lastTab = openTabs[openTabs.length - 1];
        openFile(lastTab.path, lastTab.title);
    } else {
        // Se chiudo una tab non attiva, aggiorno solo la UI
        renderTabs();
    }
}

function renderTabs() {
    const container = document.getElementById('tab-bar-container');
    if (!container) return;
    
    container.innerHTML = openTabs.map(tab => {
        const isActive = tab.path === activeTabPath;
        return `
            <div onclick="openFile('${tab.path}', '${tab.title}')" 
                 class="group flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm border-t-2 min-w-[120px] max-w-[200px] rounded-t-md transition-colors
                 ${isActive ? 'bg-white border-blue-500 text-[#001540] font-medium' : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-200'}">
                <span class="truncate flex-1 select-none">${tab.title}</span>
                <button onclick="closeTab(event, '${tab.path}')" 
                        class="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-300 text-slate-400 hover:text-slate-700 transition-opacity
                        ${isActive ? 'opacity-100' : ''}">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

// --- CARICAMENTO CONTENUTO (AJAX) ---
async function loadContent(sectionId) {
    try {
        const response = await fetch(`sections/${sectionId}.html`);
        if (!response.ok) {
            throw new Error(`Errore nel caricamento: ${response.status} ${response.statusText}`);
        }
        const html = await response.text();

        const mainContainer = document.getElementById("main-content-area");
        if (mainContainer) {
            mainContainer.innerHTML = html;
            lucide.createIcons();

            const newSection = mainContainer.querySelector('.section-content');
            if (newSection) newSection.classList.add('active');

            // Esegui gli script
            mainContainer.querySelectorAll('script').forEach(oldScript => {
                const newScript = document.createElement('script');
                if (oldScript.src) newScript.src = oldScript.src;
                else newScript.textContent = oldScript.textContent;
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });
            
            // Torna in cima
            const scrollArea = document.querySelector('main > .overflow-y-auto');
            if (scrollArea) scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
            else window.scrollTo({ top: 0, behavior: 'smooth' });
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
                    <p class="text-slate-500">Non è stato possibile caricare <code>${sectionId}.html</code>.</p>
                </div>
            </section>
            `;
            lucide.createIcons();
        }
    }
}

// --- GESTIONE MENU MOBILE ---
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

// --- INIZIALIZZAZIONE ---
document.addEventListener("DOMContentLoaded", () => {
    openFile('landing-page', 'Home');
});
