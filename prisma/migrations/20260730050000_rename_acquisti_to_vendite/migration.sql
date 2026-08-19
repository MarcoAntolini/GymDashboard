-- Rename Acquisto/acquisti -> Vendita/vendite (domain rename).
-- Prior FK: ingressi_id_acquisto_fkey (ingressi.id_acquisto -> acquisti.id)

RENAME TABLE `acquisti` TO `vendite`;

ALTER TABLE `ingressi` DROP FOREIGN KEY `ingressi_id_acquisto_fkey`;

ALTER TABLE `ingressi` CHANGE `id_acquisto` `id_vendita` INTEGER NOT NULL;

ALTER TABLE `ingressi` ADD CONSTRAINT `ingressi_id_vendita_fkey` FOREIGN KEY (`id_vendita`) REFERENCES `vendite`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Table was renamed; MySQL keeps FK names that still carry acquisti_* prefixes.
ALTER TABLE `vendite` DROP FOREIGN KEY `acquisti_id_cliente_fkey`;
ALTER TABLE `vendite` ADD CONSTRAINT `vendite_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clienti`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `vendite` DROP FOREIGN KEY `acquisti_codice_prodotto_fkey`;
ALTER TABLE `vendite` ADD CONSTRAINT `vendite_codice_prodotto_fkey` FOREIGN KEY (`codice_prodotto`) REFERENCES `prodotti`(`codice`) ON DELETE RESTRICT ON UPDATE CASCADE;
