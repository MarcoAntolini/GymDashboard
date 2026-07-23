# LOOP — implement frontier (sequenziale)

Prompt operativo per implementare `docs/.scratch/todo-roadmap/issues/` **un ticket alla volta**, senza subagent paralleli sullo stesso working tree.

## Come avviarlo

**Opzione A — sessione nuova (consigliata, context pulito)**  
In una chat Agent nuova, incolla:

```text
Esegui docs/.scratch/todo-roadmap/LOOP.md — un solo ticket, poi stop.
```

Ripeti (nuova chat o stesso thread) finché la frontier è vuota.

**Opzione B — `/loop` dinamico (stessa sessione)**  
`/loop` con prompt:

```text
Esegui docs/.scratch/todo-roadmap/LOOP.md — un solo ticket per tick. Se hai chiuso un ticket, al prossimo tick prendine un altro. Se frontier vuota o HARD STOP, ferma il loop.
```

Cadenza: self-pace — dopo un ticket finito, wake quasi subito (es. 30s–2m) solo per il tick successivo; non spawnare implementazioni parallele.

**Opzione C — due ticket disgiunti (solo inizio, a mano)**  
Solo `01` e `12` possono andare in parallelo su branch/worktree **separati**, integrati a mano. Il LOOP automatico **non** lo fa.

---

## Regole HARD (non negoziabili)

1. **Un ticket per run.** Mai due implementazioni in parallelo. Mai subagent che modificano codice sullo stesso branch.
2. **Claim prima di toccare codice.** `Status: claimed` sul file del ticket, poi implementa.
3. **Rispetta i blocker.** Un ticket è eleggibile solo se ogni riferimento in `Blocked by:` è `Status: resolved` (o il ticket non ha blocker).
4. **Niente salto in avanti.** Non implementare UI power-features / analytics se i blocker non sono resolved.
5. **Dopo `19`, i ticket `20`–`35` sono sequenziali** (stessa infrastruttura liste) — anche se tutti unblocked, prendine **uno** (il numero più basso).
6. **Non modificare** le altre cartelle `docs/.scratch/*` storiche; lavora solo su `todo-roadmap`.
7. **Commit** a fine ticket (messaggio chiaro, un commit per ticket salvo eccezione motivata).
8. **HARD STOP** e non continuare se: conflitti git irrisolvibili, schema DB distruttivo senza conferma esplicita già nel ticket, o il ticket richiede una decisione di prodotto non scritta.

---

## Algoritmo (esegui in ordine)

### 1. Scansiona la frontier

Directory: `docs/.scratch/todo-roadmap/issues/`

Per ogni `NN-*.md`:

- Leggi `Status:` e `Blocked by:`.
- Tratta come **aperto**: `ready-for-agent` o `claimed` (se `claimed` da questa sessione/continua; se `claimed` stale > sospetta sessione morta, chiedi all’utente o skippa).
- Tratta come **chiuso**: `resolved` (o `done`).
- Un ticket è **unblocked** se `Blocked by` è “None — can start immediately” **oppure** ogni ticket citato ha `Status: resolved`.
- La **frontier** = aperti + unblocked + non `claimed` da altri (preferisci `ready-for-agent`).

Se frontier vuota → stampa “Frontier vuota — roadmap completa o tutto blocked/claimed” e **stop**.

### 2. Scegli il ticket

Tra la frontier, scegli il **numero `NN` più basso**.

Priorità critica path (a parità non serve: il numero basta): schema/dati (`01`–`11`, `19`–`35`) prima del polish lontano. Non riprioritizzare manualmente.

### 3. Claim

Nel file del ticket:

- Imposta `**Status:** claimed`
- Opzionale: sotto `## Comments` aggiungi una riga con data/ora e “claimed by implement loop”.

### 4. Implementa (scope stretto)

- Leggi **solo** quel ticket (What to build + acceptance criteria). Segui `/implement` + `/tdd` dove ha senso.
- Usa glossario `CONTEXT.md` / `PRODUCT.md` / `DESIGN.md`.
- Se il ticket cita skill (`/impeccable`, `/shadcn`), caricale.
- Non espandere lo scope ad altri ticket “già che ci sono”.
- Typecheck frequente; smoke minimo richiesto dagli AC.
- Brief `/code-review` sugli AC: fix P0 prima di chiudere.

### 5. Chiudi il ticket

- Spunta gli AC soddisfatti (`[x]`).
- Imposta `**Status:** resolved`
- Appendi `## Answer` (o `## Done`) con: cosa fatto (3–6 bullet), commit hash se disponibile, note/deferrals espliciti.

### 6. Commit

```text
git add -A  # solo file rilevanti; non commitare .env / segreti
git commit -m "…"  # perché del ticket NN, non dump di file
```

Esempio stile: `feat(acquisti): snapshot importo su id surrogato (ticket 05)`.

### 7. Fine run

- Stampa: ticket chiuso, prossimo candidato in frontier (solo numero/titolo, senza implementarlo).
- **Stop** (Opzione A) oppure attendi il prossimo tick (Opzione B).

---

## Mapping status

| Status | Significato |
|--------|-------------|
| `ready-for-agent` | Prendibile se unblocked |
| `claimed` | In corso — non far partire un altro agent sullo stesso |
| `resolved` | Fatto — sblocca i dipendenti |

I ticket partono tutti come `ready-for-agent`.

---

## Anti-pattern (lenti / pericolosi)

- Spawnare N agent su `20`–`35` insieme  
- Continuare 5 ticket nella stessa chat senza svuotare il focus  
- “Sistemo anche il ticket dopo” nello stesso diff  
- Ignorare Restrict/Decimal/RBAC per chiudere prima  
- Force-push / reset distruttivi non richiesti dal ticket  

---

## Checklist rapida per tick

- [ ] Frontier calcolata correttamente  
- [ ] Un solo `NN` scelto (minimo)  
- [ ] Claim scritto su disco **prima** del codice  
- [ ] AC del ticket soddisfatti  
- [ ] `Status: resolved` + `## Done`  
- [ ] Commit creato  
- [ ] Stop (niente secondo ticket nello stesso run, salvo tick `/loop` successivo)  
