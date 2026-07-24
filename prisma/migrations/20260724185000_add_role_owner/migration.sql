-- AlterTable: add Owner (Proprietario) above Admin in Role enum
ALTER TABLE `account` MODIFY `ruolo` ENUM('Proprietario', 'Amministratore', 'Dipendente') NOT NULL DEFAULT 'Dipendente';
