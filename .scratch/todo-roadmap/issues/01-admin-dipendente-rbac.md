# Differenze Admin e Dipendente

**Type:** grilling

**Status:** resolved

## Question

Quali differenze tra Amministratore e Dipendente devono valere nella roadmap? Il modello RBAC attuale (nav + stesse CRUD sulle entità consentite) è sufficiente o servono permessi più fini?

## Answer

Accettare il modello attuale: differenza = **sezioni navigabili** (Admin: Personale + Stipendi; Dipendente: operazioni bancone). Stesse operazioni CRUD sulle entità consentite; niente ACL riga-per-riga. L’unica estensione RBAC da pianificare come feature è l’UX **Approvazione Account** (Admin accetta/rifiuta registrazioni).
