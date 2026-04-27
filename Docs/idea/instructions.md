# Liftly B2B Pivot - AI Implementation Instructions

Questo documento contiene le istruzioni dettagliate per implementare il nuovo modello B2B (Business-to-Business) di Liftly. L'obiettivo è trasformare Liftly da un'app fitness B2C freemium a una piattaforma SaaS per le palestre, offrendo agli iscritti un'esperienza premium integrata.

## 🎯 Obiettivo Principale
Implementare un sistema multi-tenant dove le "Palestre" (Gyms) sono i clienti principali. Gli utenti finali (iscritti) sono associati a una specifica palestra e sbloccano l'accesso "PRO" tramite l'abbonamento alla palestra.

---

## 🗄️ 1. Aggiornamento Database (Firestore/Firebase)

L'AI dovrà prima aggiornare e strutturare il database per supportare le palestre e le nuove funzionalità.

### Nuove Collezioni richieste:
*   `gyms`: Contiene i dati delle palestre.
    *   Campi: `id`, `name`, `address`, `branding` (colori/logo), `currentOccupancy` (numero), `maxCapacity` (numero), `adminIds` (array).
*   `gym_machines`: Macchinari associati a una palestra.
    *   Campi: `id`, `gymId`, `name`, `category` (petto, gambe, ecc.), `status` (active, broken, maintenance), `reportedBy` (userId).
*   `trainers`: Personal Trainer associati a una palestra.
    *   Campi: `id`, `gymId`, `userId`, `bio`, `specialties` (array), `contactEmail`/`phone`.
*   `support_tickets`: Richieste di assistenza inviate dagli utenti alla reception.
    *   Campi: `id`, `gymId`, `userId`, `subject`, `messages` (array), `status` (open, in-progress, closed), `createdAt`.
*   `challenges`: Sfide locali organizzate dalla palestra.
    *   Campi: `id`, `gymId`, `title`, `description`, `type` (es. distance, workouts, calories), `startDate`, `endDate`, `participants` (array).

### Modifiche alle Collezioni Esistenti (`users`):
Aggiungere i seguenti campi al documento utente:
*   `gymId`: L'ID della palestra a cui è iscritto.
*   `subscriptionType`: Tipo di piano (es. "Base", "PRO Liftly").
*   `subscriptionExpiry`: Data di scadenza dell'abbonamento.
*   `role`: "user" o "gym_admin" o "trainer".

---

## 🛠️ 2. Creazione del Pannello Admin per le Palestre (Gym Dashboard)  ---- skip this part, goal out of scope for now

L'AI dovrà creare un'area riservata (route `/admin` o interfaccia separata) accessibile solo agli utenti con `role: 'gym_admin'`.

**Funzionalità Admin:**
*   **Gestione Macchinari:** Aggiungere macchine, modificare lo stato (se un utente segnala un guasto, l'admin può confermarlo o impostarlo su risolto).
*   **Occupazione Manuale/Simulata:** Un toggle/input per aggiornare `currentOccupancy` (che in futuro sarà collegato alle API dei tornelli/badge della palestra).
*   **Gestione PT:** Aggiungere o rimuovere i Personal Trainer della struttura.
*   **Customer Care:** Rispondere ai `support_tickets` aperti dagli iscritti.
*   **Gestione Sfide:** Creare e gestire le `challenges` locali.
*   **Gestione Utenti:** Visualizzare gli utenti attivi iscritti alla propria palestra.

---

## 📱 3. Modifiche all'App Utente (Front-end Liftly)

L'AI dovrà aggiornare l'interfaccia principale dell'utente, introducendo nuove sezioni e filtrando i contenuti in base al `gymId`.

### A. Onboarding e Gestione Piano ("Il Tuo Piano")
*   Al login/registrazione, permettere all'utente di selezionare la propria palestra o inserire un "Codice Invito" fornito dalla reception.
*   Creare una pagina **"Il Tuo Piano"** nel profilo dove l'utente può vedere i dettagli del suo abbonamento, la scadenza e il livello (PRO).

### B. Crowdsourcing in Tempo Reale
*   Sulla **Dashboard** principale, mostrare un widget grafico accattivante con l'affluenza attuale della propria palestra (calcolata su `currentOccupancy` / `maxCapacity`). Mostrare stati come "Tranquillo", "Affollato", ecc.

### C. Stato Macchinari e Filtri Allenamento
*   Aggiungere una pagina **"Macchinari"**. L'utente può vedere la mappa/lista dei macchinari disponibili e il loro stato.
*   *Feature Killer:* Nella creazione della scheda di allenamento, aggiungere un filtro: "Nascondi esercizi per macchine attualmente guaste".
*   Permettere agli utenti di cliccare su una macchina e fare "Segnala Guasto".

### D. Hub Personal Trainer
*   Creare una pagina **"I Nostri Trainer"**.
*   Elencare i trainer estratti dalla collection `trainers` filtrati per `gymId`.
*   Aggiungere un pulsante "Scrivi" che apre una chat diretta con il PT (integrabile con l'attuale sistema `LiftChat`).

### E. Supporto Diretto Palestra
*   Creare una sezione **"Assistenza"** o "Contatta la Reception".
*   Interfaccia in stile chat che scrive documenti nella collection `support_tickets`. L'admin risponderà dal suo pannello.

### F. Sfide Locali & Community (Leaderboard)
*   Aggiornare la **Leaderboard** attuale affinché, per default, mostri solo gli utenti con lo stesso `gymId`. Aggiungere un tab "Globale" per vedere tutti.
*   Mostrare le `challenges` attive della palestra a cui l'utente può partecipare con un click ("Iscriviti alla sfida").

---

## 🤖 Step-by-Step Execution Plan per l'AI

Quando si avvia l'implementazione, l'AI dovrà seguire questo rigoroso ordine:

1.  **Fase 1: Auth & Data Structure**
    *   Aggiornare il contesto utente (`AuthContext.jsx`) per gestire il ruolo (admin/user) e il `gymId`.
    *   Creare servizi Firebase (`firebase/gymServices.
2.  **Fase 2: L'Ecosistema Palestra (User App)**
    *   Creare la pagina "Il Tuo Piano".
    *   Aggiungere il widget di affluenza in Dashboard (Crowdsourcing).
    *   Creare la pagina Macchinari e la logica di segnalazione guasti.
3.  **Fase 3: Connessione Umana (Hub PT & Support)**
    *   Sviluppare la pagina Trainer e integrare il messaging.
    *   Creare l'interfaccia ticket per chattare con la reception.
4.  **Fase 4: Gamification Locale**
    *   Limitare la classifica base al `gymId`.
    *   Sviluppare l'interfaccia delle Sfide Locali.

---

## 🎨 Linee Guida di Stile e UI/UX
*   **Continuità:** Mantenere il tema dark-mode, i gradienti premium e il glassmorphism.
*   **Componenti:** Usa Tailwind CSS e lucide-react per le icone, mantenendo un'interfaccia fluida e pulita come definito nell'`index.html` dell'idea.
