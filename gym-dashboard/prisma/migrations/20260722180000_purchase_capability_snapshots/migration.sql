-- AlterTable: snapshot durata / N sull'Acquisto (fissati alla vendita)
ALTER TABLE `acquisti`
	ADD COLUMN `durata_abbonamento` INTEGER NULL,
	ADD COLUMN `numero_ingressi` INTEGER NULL;

-- Backfill da specializzazione Prodotto corrente (migrazione one-shot)
UPDATE `acquisti` AS `a`
LEFT JOIN `abbonamenti` AS `m` ON `m`.`codice_prodotto` = `a`.`codice_prodotto`
LEFT JOIN `pacchetti_ingressi` AS `p` ON `p`.`codice_prodotto` = `a`.`codice_prodotto`
SET
	`a`.`durata_abbonamento` = `m`.`durata`,
	`a`.`numero_ingressi` = `p`.`numero_ingressi`;
