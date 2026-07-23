-- AlterTable: add Owner (Proprietario) to account.ruolo; multiple Owners allowed.
ALTER TABLE `account` MODIFY COLUMN `ruolo` ENUM('Proprietario', 'Amministratore', 'Dipendente') NOT NULL DEFAULT 'Dipendente';
