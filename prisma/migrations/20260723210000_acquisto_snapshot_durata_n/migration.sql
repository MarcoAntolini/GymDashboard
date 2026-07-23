-- Snapshot durata (Abbonamento) e numero_ingressi (Pacchetto) sull'Acquisto alla vendita.
-- Cambiare il Prodotto non altera titoli già venduti; residuo/validità usano queste colonne.

ALTER TABLE `acquisti` ADD COLUMN `durata` INTEGER NULL;
ALTER TABLE `acquisti` ADD COLUMN `numero_ingressi` INTEGER NULL;
