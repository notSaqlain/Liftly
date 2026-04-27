# Istruzioni per l'Aggiornamento della Documentazione (V2 B2B)

Questo documento contiene le direttive per aggiornare tutta la documentazione di progetto presente nella cartella `Docs/Documenti/` per riflettere il nuovo modello di business (B2B Pivot).

## ⚠️ REGOLA FONDAMENTALE
**NON MODIFICARE I DOCUMENTI ESISTENTI.** I file attuali rappresentano la versione originale (V1) e vanno conservati come storico del progetto. 
Tutti i nuovi documenti dovranno essere creati nella sottocartella `v2/` all'interno di `Docs/Documenti/`.

---

## 📄 Elenco Documenti da Aggiornare e Modifiche Richieste

### 1. Project Charter (`charter-liftly_v2.html`)
*   **Obiettivo del Progetto:** Cambiare il focus da un'app fitness freemium B2C a una piattaforma SaaS B2B per palestre.
*   **Stakeholder:** Aggiungere Proprietari di Palestre, Personal Trainer della struttura e Staff di Reception.
*   **Metriche di Successo:** Inserire numero di palestre partner, numero di licenze vendute, tasso di utilizzo delle app da parte degli iscritti della singola palestra.

### 2. Documento SRS (Software Requirements Specification)
Dovrai ricreare le varie sezioni della SRS per includere i nuovi requisiti:
*   **Introduzione / Ambito:** Descrivere il modello multi-tenant in cui gli utenti sono legati a un `gymId`.
*   **Requisiti Funzionali:**
    *   *Utente App:* Associazione alla palestra tramite codice, visualizzazione affluenza, mappa stato macchinari, PT Hub, chat di supporto con la palestra, gestione abbonamento (Il Tuo Piano), Leaderboard/Sfide locali.
    *   *(Nota: Il Pannello Admin web è momentaneamente fuori scope per lo sviluppo, ma nei requisiti futuri va citato come sistema di gestione della palestra).*
*   **Requisiti Non Funzionali:** Sicurezza e isolamento dei dati tra palestre diverse (un utente non deve vedere dati di altre palestre), scalabilità del DB per gestire i picchi di affluenza in tempo reale.
*   **Definizioni/Attori:** Aggiungere i ruoli `gym_admin` e `trainer`.

### 3. WBS (Work Breakdown Structure) (`wbs_v2.html`)
Aggiungere nuovi "Work Package" per gestire il pivot:
*   Rifattorizzazione Database (Integrazione `gymId` e multi-tenancy).
*   Sviluppo Moduli App Utente V2 (Crowdsourcing Affluenza, Macchinari, PT Hub, Supporto, Profilo V2).
*   *Fase futura:* Sviluppo Pannello Admin.

### 4. OBS e RACI (`obs_v2.html` e `raci_v2.html`)
*   Se l'organizzazione del team cambia (es. inserimento di figure commerciali per vendere l'app alle palestre o supporto tecnico B2B), aggiornare l'Organigramma.
*   Aggiornare la matrice RACI includendo i nuovi task della WBS e chi ne è responsabile.

### 5. Diagramma di Gantt e Costi (`gantt_v2.html`)
*   Aggiungere una nuova fase temporale dedicata al "Pivot B2B".
*   Rimodulare le scadenze e includere le stime per lo sviluppo delle nuove feature utente e dell'aggiornamento architetturale.
*   Modificare il piano dei costi/ricavi: non più entrate da abbonamenti in-app o pubblicità B2C, ma stima di licenze mensili/annuali vendute alle palestre.

---

## 🔗 Aggiornamento della Navigazione (`index.html`)
L'interfaccia principale della documentazione (`Docs/Documenti/index.html`) dovrà essere aggiornata per permettere la consultazione di entrambe le versioni.
*   Aggiungere una voce di menu "Liftly V2 (B2B Pivot)" nella sidebar.
*   Questa nuova voce conterrà un menu a tendina per navigare verso tutti i file `_v2` creati, permettendo al team e ai professori/partner di confrontare facilmente la V1 con la V2.
