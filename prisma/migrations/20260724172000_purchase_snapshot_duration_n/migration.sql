-- AlterTable: snapshot durata / N ingressi sull'Acquisto (titolo di accesso immutabile dopo la vendita)
ALTER TABLE `acquisti` ADD COLUMN `durata` INTEGER NULL;
ALTER TABLE `acquisti` ADD COLUMN `numero_ingressi` INTEGER NULL;
