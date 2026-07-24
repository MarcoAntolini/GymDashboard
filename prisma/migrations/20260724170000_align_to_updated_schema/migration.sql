-- CreateTable
CREATE TABLE `account` (
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `ruolo` ENUM('Amministratore', 'Dipendente') NOT NULL DEFAULT 'Dipendente',
    `approvato` BOOLEAN NOT NULL DEFAULT false,
    `id_dipendente` INTEGER NOT NULL,

    UNIQUE INDEX `account_id_dipendente_key`(`id_dipendente`),
    PRIMARY KEY (`username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dipendenti` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codice_fiscale` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `cognome` VARCHAR(191) NOT NULL,
    `data_nascita` DATETIME(3) NOT NULL,
    `via` VARCHAR(191) NOT NULL,
    `civico` VARCHAR(191) NOT NULL,
    `città` VARCHAR(191) NOT NULL,
    `provincia` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `data_assunzione` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `dipendenti_codice_fiscale_key`(`codice_fiscale`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contratti` (
    `id_dipendente` INTEGER NOT NULL,
    `tipo` ENUM('Tempo determinato', 'Tempo indeterminato') NOT NULL,
    `costo_orario` DECIMAL(10, 2) NOT NULL,
    `data_inizio` DATETIME(3) NOT NULL,
    `data_fine` DATETIME(3) NULL,

    PRIMARY KEY (`id_dipendente`, `data_inizio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `timbrature` (
    `id_dipendente` INTEGER NOT NULL,
    `entrata` DATETIME(3) NOT NULL,
    `uscita` DATETIME(3) NULL,

    PRIMARY KEY (`id_dipendente`, `entrata`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stipendi` (
    `id_pagamento` INTEGER NOT NULL,
    `id_dipendente` INTEGER NOT NULL,

    PRIMARY KEY (`id_pagamento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attrezzature` (
    `id_pagamento` INTEGER NOT NULL,
    `descrizione` VARCHAR(191) NOT NULL,
    `fornitore` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id_pagamento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bollette` (
    `id_pagamento` INTEGER NOT NULL,
    `descrizione` VARCHAR(191) NOT NULL,
    `fornitore` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id_pagamento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `interventi` (
    `id_pagamento` INTEGER NOT NULL,
    `descrizione` VARCHAR(191) NOT NULL,
    `attuatore` VARCHAR(191) NOT NULL,
    `data_inizio` DATETIME(3) NOT NULL,
    `data_fine` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_pagamento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagamenti` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `importo` DECIMAL(10, 2) NOT NULL,
    `tipo` ENUM('Stipendio', 'Bolletta', 'Attrezzatura', 'Intervento') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clienti` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codice_fiscale` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `cognome` VARCHAR(191) NOT NULL,
    `data_nascita` DATETIME(3) NOT NULL,
    `via` VARCHAR(191) NOT NULL,
    `civico` VARCHAR(191) NOT NULL,
    `città` VARCHAR(191) NOT NULL,
    `provincia` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `data_iscrizione` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `clienti_codice_fiscale_key`(`codice_fiscale`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ingressi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `id_acquisto` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `acquisti` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_cliente` INTEGER NOT NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `importo` DECIMAL(10, 2) NOT NULL,
    `codice_prodotto` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prodotti` (
    `codice` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`codice`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `abbonamenti` (
    `codice_prodotto` VARCHAR(191) NOT NULL,
    `durata` INTEGER NOT NULL,

    PRIMARY KEY (`codice_prodotto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pacchetti_ingressi` (
    `codice_prodotto` VARCHAR(191) NOT NULL,
    `numero_ingressi` INTEGER NOT NULL,

    PRIMARY KEY (`codice_prodotto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `listini` (
    `anno` INTEGER NOT NULL,
    `codice_prodotto` VARCHAR(191) NOT NULL,
    `prezzo` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`anno`, `codice_prodotto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `account` ADD CONSTRAINT `account_id_dipendente_fkey` FOREIGN KEY (`id_dipendente`) REFERENCES `dipendenti`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contratti` ADD CONSTRAINT `contratti_id_dipendente_fkey` FOREIGN KEY (`id_dipendente`) REFERENCES `dipendenti`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timbrature` ADD CONSTRAINT `timbrature_id_dipendente_fkey` FOREIGN KEY (`id_dipendente`) REFERENCES `dipendenti`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stipendi` ADD CONSTRAINT `stipendi_id_pagamento_fkey` FOREIGN KEY (`id_pagamento`) REFERENCES `pagamenti`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stipendi` ADD CONSTRAINT `stipendi_id_dipendente_fkey` FOREIGN KEY (`id_dipendente`) REFERENCES `dipendenti`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attrezzature` ADD CONSTRAINT `attrezzature_id_pagamento_fkey` FOREIGN KEY (`id_pagamento`) REFERENCES `pagamenti`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bollette` ADD CONSTRAINT `bollette_id_pagamento_fkey` FOREIGN KEY (`id_pagamento`) REFERENCES `pagamenti`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interventi` ADD CONSTRAINT `interventi_id_pagamento_fkey` FOREIGN KEY (`id_pagamento`) REFERENCES `pagamenti`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ingressi` ADD CONSTRAINT `ingressi_id_acquisto_fkey` FOREIGN KEY (`id_acquisto`) REFERENCES `acquisti`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `acquisti` ADD CONSTRAINT `acquisti_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clienti`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `acquisti` ADD CONSTRAINT `acquisti_codice_prodotto_fkey` FOREIGN KEY (`codice_prodotto`) REFERENCES `prodotti`(`codice`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `abbonamenti` ADD CONSTRAINT `abbonamenti_codice_prodotto_fkey` FOREIGN KEY (`codice_prodotto`) REFERENCES `prodotti`(`codice`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pacchetti_ingressi` ADD CONSTRAINT `pacchetti_ingressi_codice_prodotto_fkey` FOREIGN KEY (`codice_prodotto`) REFERENCES `prodotti`(`codice`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listini` ADD CONSTRAINT `listini_codice_prodotto_fkey` FOREIGN KEY (`codice_prodotto`) REFERENCES `prodotti`(`codice`) ON DELETE CASCADE ON UPDATE CASCADE;

