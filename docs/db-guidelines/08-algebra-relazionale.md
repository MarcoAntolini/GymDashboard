# Algebra relazionale

**Fonte:** `08-AlgebraRelazionale.pdf` — Corso di Basi di Dati (Annalisa Franco, Dario Maio, Università di Bologna)

## Quando usare questo documento

Per ragionare sulle query e sulla correttezza delle decomposizioni (join senza perdita) prima/accanto a SQL. Utile anche per capire cosa l’ottimizzatore “vede”.

## Ruolo

- DML formali: **calcolo relazionale** (dichiarativo) e **algebra relazionale** (procedurale); stesso potere espressivo.
- AR = basi formali delle operazioni relazionali e della loro implementazione.
- SQL incorpora aspetti di entrambi; è relazionalmente completo rispetto all’AR.
- Non Turing-completo; **non** esprime ricorsione/chiusura transitiva (serve SQL ricorsivo / CTE).

## Operatori di base (insieme completo del corso)

`{σ, π, ρ, ∪, −, ⨝}` (join naturale). Alternativa equivalente: prodotto cartesiano `×` al posto del join.

| Operatore | Ruolo |
|---|---|
| **σ** selezione | Filtra tuple con formula booleana F (confronti Aθc, AθB; ∧ ∨ ¬) |
| **π** proiezione | Sottoinsieme attributi; elimina duplicati (relazione) |
| **ρ** ridenominazione | Rinomina attributi (ordine rilevante se multipli) |
| **∪** unione | Schemi compatibili; commutativa |
| **−** differenza | Schemi compatibili; **non** commutativa |
| **⨝** join naturale | Match su attributi omonimi; schema = unione attributi |

Operatori derivati tipici: intersezione, theta-join, equi-join, semijoin, divisione (query “universali”: “tutti i …”).

## Note operative

- Join su **superchiave** di R1 ⇒ ogni tupla di R2 matcha al più una di R1 ⇒ `|R1⨝R2| ≤ |R2|`.
- Con NULL: logica a 3 valori; `IS NULL` esplicito; `(A=c) OR (A≠c)` **non** seleziona le tuple con A NULL.
- Comporre operatori = piano di interrogazione astratto (selezione presto, proiezione, join).

## Collegamento a GymDashboard

Usare AR per specificare interrogazioni tipiche (clienti con abbonamento attivo, ingressi in un periodo, dipendenti presenti) in modo indipendente dalla sintassi SQL, poi tradurre.
