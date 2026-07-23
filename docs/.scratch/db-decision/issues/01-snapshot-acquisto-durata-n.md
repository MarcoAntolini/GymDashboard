# 01 — Snapshot durata e N ingressi su Acquisto

**What to build:** Alla vendita di un Prodotto, durata (Abbonamento) e numero ingressi (Pacchetto) restano fissati sull’Acquisto. Cambiare il Prodotto in listino non altera titoli già venduti; giustificazione Ingressi e residuo pacchetto usano lo snapshot.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Schema e create Acquisto memorizzano durata e/o N ingressi allo snapshot di vendita (oltre all’importo già presente)
- [ ] Giustificazione Ingressi e Ingressi rimanenti leggono lo snapshot dell’Acquisto, non i valori correnti del Prodotto
- [ ] Update di durata/N sul Prodotto non cambia Acquisti/Ingressi già registrati
- [ ] Tabella/DTO Acquisto (e viste derivate) espongono i valori snapshot in sola lettura dove serve
