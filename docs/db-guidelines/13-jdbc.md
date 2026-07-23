# Accesso ai dati da applicazione (JDBC e principi)

**Fonte:** `13-JDBC.pdf` — Corso di Basi di Dati (Annalisa Franco, Dario Maio, Università di Bologna)

## Quando usare questo documento

Progettando il data-access layer di GymDashboard (anche se lo stack non è Java): principi di connessione, statement, mapping risultati, gestione risorse e SQL injection.

## Contesto del corso

JDBC = API Java per accesso a RDBMS. I pattern valgono in generale:

1. Ottenere una **connessione** (URL, credenziali, driver).
2. Creare uno **statement** / prepared statement.
3. Eseguire SQL (query o update).
4. Iterare il **result set** / leggere update count.
5. Gestire errori; **chiudere** risorse (connection, statement, result set).
6. Usare **transazioni** esplicite quando serve atomicità (auto-commit off → commit/rollback).

## Linee guida trasferibili

| Principio | Perché |
|---|---|
| **PreparedStatement / parametri bind** | Evita SQL injection; consente riuso piani |
| **Non concatenare input utente in SQL** | Stesso rischio in qualsiasi linguaggio |
| **Transazioni esplicite** per multi-write | Allineato a `11-transazioni.md` |
| **Chiudere/poolare connessioni** | Connection leak e saturazione pool |
| **Mappare tipi SQL ↔ tipi linguaggio** | NULL, date, decimali |
| **Separare SQL di schema da SQL applicativo** | Migrazioni DDL vs query runtime |

## Collegamento a GymDashboard

Stack attuale tipicamente TypeScript/Next: usare client SQL o ORM rispettando gli stessi principi (parametri, transazioni, pool). JDBC resta riferimento metodologico del corso, non vincolo tecnologico dell’elaborato.
