# 🏋️‍♂️ Guida Completa al Progetto Liftly (Per la Presentazione)

Questo documento è stato creato per aiutarti a capire **ogni singolo dettaglio** del progetto Liftly, in modo da essere preparato a rispondere a qualsiasi domanda del professore durante la presentazione.

---

## 1. Panoramica del Progetto
**Liftly** è un'applicazione web e mobile (tramite APK Android) dedicata al tracciamento degli allenamenti in palestra, con una forte componente **Social e Community**. Gli utenti possono registrare i propri allenamenti, guadagnare punti, competere nelle classifiche e chattare con altri utenti a livello globale o ristretto alla propria palestra.

---

## 2. Lo Stack Tecnologico (Con cosa è stato fatto?)
Se il professore ti chiede "Che tecnologie avete usato?", questa è la risposta:

### **Frontend (Lato Utente)**
*   **React.js**: La libreria principale utilizzata per costruire l'interfaccia utente. L'app è divisa in "Componenti" riutilizzabili (es. un bottone, la navbar, la singola riga della classifica).
*   **Vite**: Il sistema di build (più veloce del vecchio Webpack/Create React App) che impacchetta il codice.
*   **Tailwind CSS**: Il framework CSS utilizzato per il design. Tutto il design "premium" e scuro (dark mode), con effetti traslucidi ("glassmorphism"), è fatto tramite classi di utilità Tailwind.
*   **Lucide React**: La libreria usata per tutte le icone dell'app.
*   **Capacitor**: È lo strumento che ci permette di prendere l'app web React e "impacchettarla" in un'app mobile vera e propria (APK per Android), dandoci accesso a funzionalità native del telefono.

### **Backend & Database (Lato Server)**
Non abbiamo scritto un backend da zero (niente Node.js/Express personalizzato), ma abbiamo utilizzato **Firebase (di Google)** come Backend-as-a-Service (BaaS).
*   **Firebase Authentication**: Gestisce la registrazione, il login (email/password) e il login nativo con Google. Invece di salvare noi le password (che è rischioso), Firebase gestisce tutto in modo sicuro e ci restituisce un "Token" o un ID utente.
*   **Cloud Firestore**: È il nostro database. È un database **NoSQL in tempo reale**. Invece di tabelle (come in MySQL), usa **Collezioni e Documenti**. 

---

## 3. Come funzionano le funzionalità principali?

### A. La Chat e Chat di Gruppo (`GroupChat.jsx` / `DMConversation.jsx`)
Il professore ti chiederà sicuramente: *"Come avete implementato la chat in tempo reale?"*

**Spiegazione:**
1.  **Tempo reale grazie a Firebase**: Usiamo una funzione di Firestore chiamata `onSnapshot`. Invece di fare una richiesta ogni volta per vedere se ci sono nuovi messaggi, `onSnapshot` "ascolta" i cambiamenti nel database. Appena qualcuno scrive un messaggio, Firestore avvisa automaticamente tutti gli altri telefoni collegati e la chat si aggiorna all'istante.
2.  **Architettura delle stanze**:
    *   **Chat Globale**: I messaggi vengono salvati in una singola collezione chiamata `gym_chat`. Tutti gli utenti vedono questi messaggi.
    *   **Chat della Palestra (Gym Mode)**: I messaggi vengono salvati in `gym_chats/{ID_DELLA_PALESTRA}/messages`. In questo modo, solo chi fa parte di quella specifica palestra scarica e vede quei messaggi.
3.  **Chi è Online (`gym_presence`)**: Quando un utente apre l'app, scriviamo nel database (nella collezione `gym_presence`) che è online. C'è un "event listener" sul telefono (`window.addEventListener('beforeunload')`) che, appena l'utente chiude l'app, aggiorna il database mettendo `isOnline: false`. Esiste anche una "Modalità Incognito" che permette di nascondere questo status.

### B. La Leaderboard (Classifica) (`Leaderboard.jsx`)
*"Come fate a calcolare chi è primo e come filtrate i dati?"*

**Spiegazione:**
La classifica è dinamica e permette di filtrare i giocatori in 3 modalità (Globale, La Mia Palestra, Solo Amici) e per 5 categorie diverse (Punti, Volume sollevato, Massimale Panca, Stacco, Squat).
1.  **Query al Database**: Facciamo una richiesta (Query) alla collezione `users`. Se l'utente seleziona "Globale" e "Punti", chiediamo a Firestore: *"Dammi i primi 50 utenti ordinati per Punti dal più alto al più basso"*.
2.  **Filtro per Palestra**: Se l'utente seleziona "My Gym", aggiungiamo semplicemente una condizione alla query: `where('gymId', '==', id_palestra_utente)`. Firestore fa il lavoro duro e ci restituisce solo gli iscritti a quella palestra, sempre ordinati.
3.  **Sistema dei Punti (XP)**: Inizialmente c'erano gli "streak" (giorni consecutivi), ma siamo passati a un sistema a **Punti**. Ogni volta che l'utente completa un allenamento, il sistema aggiorna il campo `points` nel suo documento utente.

### C. Onboarding e Gestione dello Stato dell'App
*"Come vi assicurate che un utente appena iscritto capisca come usare l'app?"*

**Spiegazione:**
*   Abbiamo implementato un **Onboarding Tutorial** interattivo. Appena l'account viene creato, l'app mostra una procedura guidata ("spotlight") che evidenzia i bottoni principali (es. "Start Workout").
*   Per evitare che il tutorial compaia ogni volta, salviamo una variabile nel `localStorage` del browser/telefono (es. `tutorialCompleted: true`).

### D. Il Sistema di Recupero Password (Email Integration)
*"Come funziona il reset della password se l'utente se la dimentica?"*

**Spiegazione:**
*   Non abbiamo dovuto configurare complessi server SMTP (come SendGrid o Mailgun) partendo da zero. Utilizziamo la funzione integrata di **Firebase Authentication**: `sendPasswordResetEmail`.
*   **Flusso dell'utente**: Quando l'utente inserisce la sua email nella schermata di login e preme "Password Dimenticata?", l'app di React fa una chiamata (API) a Firebase passando quell'indirizzo email.
*   **Sicurezza**: Firebase verifica che l'email esista nel suo sistema. Se esiste, Firebase si occupa in autonomia di inviare un'email all'utente. Questa email contiene un link sicuro, generato temporaneamente con un token unico.
*   **Reset effettivo**: Cliccando sul link, l'utente viene portato su una pagina web sicura (ospitata da Firebase) dove può digitare la sua nuova password e salvarla direttamente nel sistema. Nessuna password "in chiaro" transita mai attraverso il nostro codice React, garantendo la massima sicurezza (cifratura hash).

---

## 4. Struttura del Database (Firestore)
Se il prof vuole scendere nei dettagli tecnici, digli che il database è strutturato a collezioni. Ecco le principali:
*   `users`: Contiene un documento per ogni utente registrato. (Dati: nome, punti, ID palestra, foto, best records).
*   `users/{userId}/friends`: Sotto-collezione per gestire le amicizie.
*   `gym_chat`: Messaggi della community globale. (Campi: testo, autore, timestamp).
*   `gym_presence`: Tracking per gli utenti online (utilizzato dalla chat per mostrare il contatore in alto a destra).

---

## 5. Possibili Domande "Trappola" del Professore (e come rispondere)

**🔴 Domanda 1: "Cosa succede se due persone mandano un messaggio contemporaneamente?"**
*   **Risposta**: Firebase gestisce automaticamente la concorrenza. Ogni messaggio riceve un `serverTimestamp` ufficiale generato dal server di Google, non dall'orologio del telefono (che potrebbe essere sbagliato). I messaggi verranno ordinati cronologicamente in modo perfetto.

**🔴 Domanda 2: "Se non avete un backend in Node/Python, come fate a fare operazioni sicure e complesse o impedire che un utente modifichi i punti di un altro?"**
*   **Risposta**: Utilizziamo le **Firestore Security Rules** (Regole di sicurezza di Firebase). Queste regole risiedono sul server e bloccano le operazioni illegali. Ad esempio, una regola impone che un utente possa modificare solo i documenti che hanno il suo stesso `userId`. Nessuno può falsificare il punteggio altrui.

**🔴 Domanda 3: "Come fate a mantenere l'app fluida se ci sono migliaia di messaggi nella chat?"**
*   **Risposta**: Non scarichiamo mai tutto il database. Nelle query di Firebase utilizziamo il comando `limit(100)` per la chat e `limit(50)` per la Leaderboard. Quando si scorre verso l'alto (nella chat), si potrebbero caricare i messaggi precedenti (paginazione).

**🔴 Domanda 4: "Perché usare React invece di puro HTML/JS?"**
*   **Risposta**: Perché React ci permette di creare un'applicazione a singola pagina (SPA - Single Page Application). Quando l'utente naviga tra Profilo, Chat e Allenamenti, l'app non ricarica mai la pagina nel browser, rendendo l'esperienza identica a quella di un'app nativa. Inoltre, il concetto di "Stato" (es. `useState`) di React aggiorna in automatico l'interfaccia non appena arrivano nuovi dati da Firebase, senza dover manipolare manualmente il DOM (niente `document.getElementById`).

**🔴 Domanda 5: "Come avete gestito l'estetica e la responsività (adattamento ai vari schermi)?"**
*   **Risposta**: Utilizzando Tailwind CSS. Abbiamo usato le classi di utilità (es. `flex`, `p-4`, `md:w-1/2`) che ci permettono di avere un'interfaccia completamente responsiva. Il design system è incentrato su un tema scuro (#040810) con accenti "teal", utilizzando bordi semi-trasparenti per dare un effetto premium (glassmorfismo).

---

## Suggerimento finale per l'esposizione:
*   Sii sicuro e tranquillo. Quando parli della chat, sottolinea la parola **"Tempo Reale con Firestore onSnapshot"**, fa sempre molta scena.
*   Quando parli della leaderboard, cita il fatto che è **"Dinamica e Scalabile"** grazie ai filtri integrati nelle query NoSQL di Firebase.
*   Buona fortuna! Spacca tutto! 🚀
