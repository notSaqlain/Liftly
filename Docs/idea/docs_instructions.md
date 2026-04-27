# Istruzioni Dettagliate per l'Aggiornamento della Documentazione (V2 B2B)

Questo documento contiene le direttive approfondite per aggiornare l'intera documentazione di progetto in `Docs/Documenti/` per riflettere il nuovo modello di business (B2B Pivot). Ogni dettaglio dell'idea deve essere tracciato nei documenti ufficiali.

## ⚠️ STRUTTURA DELLE CARTELLE E REGOLA FONDAMENTALE
**NON ELIMINARE O SOVRASCRIVERE I FILE DELLA V1.**
Per mantenere uno storico accurato dell'evoluzione del progetto, l'architettura dei file dovrà essere riorganizzata così:
1. Crea una sottocartella `Docs/Documenti/sections/v1/` e sposta al suo interno tutti gli attuali file HTML delle sezioni (SRS, WBS, Gantt, ecc.).
2. Crea una sottocartella `Docs/Documenti/sections/v2/` dove creerai da zero (o copiando e modificando) i nuovi documenti aggiornati.
3. **Aggiorna i percorsi:** Assicurati che nel file principale `Docs/Documenti/index.html` (o `app.js`) i vecchi link puntino alla cartella `v1/` e crea nuovi link per i file nella cartella `v2/`.

---

## 💡 I Dettagli della Nuova Idea (Da inserire nei documenti)
Chiunque aggiorni la documentazione deve comprendere profondamente le nuove feature da documentare:

1. **Il Modello B2B SaaS (Software as a Service):** L'utente non scarica l'app per usare funzionalità premium a pagamento (Freemium). Invece, Liftly vende licenze (es. pacchetti da $550) alle palestre. La palestra offre Liftly PRO "gratis" ai suoi iscritti come benefit aggiuntivo dell'abbonamento fisico.
2. **Crowdsourcing Reale (Badge):** Prima si ipotizzava che gli utenti dichiarassero quando erano in palestra. Ora Liftly si interfaccia (o simula di farlo) con i tornelli/badge della palestra per avere un dato di affluenza reale e accurato al 100%.
3. **Mappatura e Stato Macchinari:** Ogni palestra ha il suo parco macchine nel database. L'utente può vedere cosa c'è, se una macchina è guasta, e filtrare la creazione di schede d'allenamento in base alle macchine effettivamente disponibili o funzionanti.
4. **Hub Personal Trainer:** Ogni palestra ha i propri PT. L'app mostra i profili dei PT della *tua* palestra, permettendoti di contattarli direttamente via chat per prenotare lezioni o fare domande.
5. **Supporto Diretto / Customer Care:** Una chat dedicata per comunicare con la reception della palestra (es. "Ho perso una felpa", "Voglio info sul rinnovo") sostituendo le vecchie email.
6. **"Il Tuo Piano" (Gestione Abbonamento):** Una sezione dove l'utente vede il suo abbonamento fisico alla palestra (inizio, scadenza, certificato medico).
7. **Gamification Locale (Sfide e Classifiche):** La leaderboard adesso è sia globale (contro tutto il mondo), che "Locale" alla palestra. Vengono introdotte le "Sfide della Palestra" per creare una community affiatata.

---

## 📄 Come Aggiornare Ogni Singolo Documento

### 1. Project Charter (`v2/charter-liftly.html`)
*   **Business Case & Vision:** Modificare la visione. Liftly non è più solo uno strumento per l'atleta, ma uno strumento di fidelizzazione (retention) per i proprietari delle palestre.
*   **Stakeholder Principali:** Oltre agli utenti finali, inserire i "Clienti B2B" (Proprietari di palestre) e gli "Operatori" (Personal Trainer, Staff di reception).
*   **Deliverables:** Inserire lo sviluppo del modulo "Gym Environment" (App) e la predisposizione al futuro Pannello Admin per la palestra.
*   **Costi/Ricavi:** Il modello di entrate cambia radicalmente (da ads/abbonamenti in-app a licenze software annuali vendute ai centri sportivi).

### 2. SRS - Requisiti Funzionali (`v2/srs-requisiti-funzionali.html`)
Ogni sezione deve specificare che i dati sono isolati per Palestra (`gymId`):
*   **Requisito Autenticazione:** Aggiungere la fase di "Selezione Palestra" o inserimento del "Codice di Attivazione" dopo la registrazione.
*   **Requisito Social/Crowdsourcing:** Specificare che il calcolo dell'affluenza ora è derivato dal numero totale di utenti attivi nella palestra fratto la capienza massima (dati gestiti dalla palestra).
*   **Requisito Workout:** Aggiungere la funzione "Filtra esercizi per macchinari disponibili e non guasti". Segnalazione guasti da parte dell'utente.
*   **Requisito Chat/Supporto:** Separare la chat tra utenti (LiftChat globale/locale), chat con i PT, e Ticket di Supporto verso l'Admin/Reception.
*   **Nota per chi scrive:** Inserire una nota esplicita che *lo sviluppo del portale Web Admin per i gestori della palestra è attualmente fuori scope per questa fase di programmazione*, ma è considerato un requisito di sistema essenziale per la logica dell'app.

### 3. SRS - Requisiti Non Funzionali e Architettura (`v2/srs-architettura.html`)
*   **Multi-tenancy e Data Isolation:** È fondamentale documentare che il database Firebase dovrà garantire la totale segregazione dei dati. Un utente iscritto alla Palestra A non deve assolutamente poter vedere i membri, le chat o le sfide della Palestra B.
*   **Scalabilità:** Il sistema di tracking dell'affluenza in tempo reale richiederà un database capace di gestire aggiornamenti frequenti.

### 4. WBS - Work Breakdown Structure (`v2/wbs.html`)
La WBS deve essere riorganizzata per includere i pacchetti di lavoro del pivot:
*   **Fase di Analisi:** Analisi dei requisiti B2B e progettazione database Multi-tenant.
*   **Fase di Sviluppo Database:** Aggiunta collezioni `gyms`, `gym_machines`, `trainers`, `tickets`.
*   **Fase Moduli Frontend (Nuovi):** Sviluppo schermata "Il Tuo Piano", "Lista Macchinari & Segnalazione Guasti", "Trainer Hub", "Assistenza Reception".
*   **Modifica Moduli Esistenti:** Adattamento Leaderboard per mostrare sia i punteggi locali che globali e adattamento della UI per mostrare l'affluenza.

### 5. RACI
*   **RACI:** I nuovi moduli della WBS (es. Sviluppo DB Multi-tenant, Sviluppo PT Hub) devono essere assegnati correttamente ai membri del team esistenti.

### 6. Diagramma di Gantt e Costi (`v2/gantt.html`)
*   **Tempistiche:** Aggiungere una milestone "Liftly V2 - B2B Pivot". Le attività di sviluppo devono riflettere la nuova WBS, inserendo i tempi necessari per riadattare l'app.
*   **Costi:** Rimuovere stime su "Marketing digitale per acquisizione utenti B2C (Facebook Ads)" e inserire stime su "Acquisizione Clienti B2B (fiere del fitness, commerciali diretti)".

---

## 🔗 Aggiornamento della Navigazione (Index)
Il file `Docs/Documenti/index.html` dovrà subire un refactoring della sidebar (menu laterale).
Invece di un solo elenco, crea due macro-categorie chiudibili a tendina (Accordion):
1. **📁 Liftly V1 (Archivio B2C)**: I cui link punteranno alla cartella `/sections/v1/...`
2. **📁 Liftly V2 (Attuale B2B)**: I cui link punteranno ai nuovi file creati nella cartella `/sections/v2/...`
Questo permetterà ai revisori di apprezzare il lavoro storico e il ragionamento dietro al cambio di rotta.
