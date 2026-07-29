import { faker } from "./faker";

/**
 * Nomi di battesimo frequenti / contemporanei (mix generazioni).
 * Liste curate: evita i entry corrotti `\uFFFD` del locale fakerIT.
 */
export const ITALIAN_FIRST_NAMES = [
	"Alessandro",
	"Andrea",
	"Angela",
	"Anna",
	"Antonio",
	"Beatrice",
	"Bianca",
	"Carlo",
	"Caterina",
	"Chiara",
	"Christian",
	"Claudia",
	"Davide",
	"Elena",
	"Elisa",
	"Emanuele",
	"Emma",
	"Federica",
	"Federico",
	"Francesca",
	"Francesco",
	"Gabriel",
	"Gabriele",
	"Giada",
	"Giorgia",
	"Giorgio",
	"Giulia",
	"Giuseppe",
	"Greta",
	"Ilaria",
	"Leonardo",
	"Lorenzo",
	"Luca",
	"Lucia",
	"Marco",
	"Maria",
	"Martina",
	"Matilde",
	"Matteo",
	"Mattia",
	"Michele",
	"Nicolò",
	"Noemi",
	"Paolo",
	"Rebecca",
	"Riccardo",
	"Roberta",
	"Roberto",
	"Sara",
	"Simone",
	"Sofia",
	"Stefano",
	"Tommaso",
	"Valentina",
	"Valerio",
	"Vittoria",
] as const;

/** Cognomi italiani comuni (UTF-8 corretto, accenti validi). */
export const ITALIAN_LAST_NAMES = [
	"Bianchi",
	"Bruno",
	"Caputo",
	"Caruso",
	"Colombo",
	"Conte",
	"Conti",
	"Costa",
	"De Luca",
	"Esposito",
	"Ferrari",
	"Ferri",
	"Fontana",
	"Gallo",
	"Galli",
	"Giordano",
	"Greco",
	"Leone",
	"Lombardi",
	"Mancini",
	"Mariani",
	"Marchetti",
	"Martini",
	"Moretti",
	"Neri",
	"Ricci",
	"Rinaldi",
	"Rizzo",
	"Romano",
	"Rossi",
	"Russo",
	"Sala",
	"Santoro",
	"Serra",
	"Valentini",
	"Villa",
	"Barbieri",
	"Basile",
	"Bernardi",
	"Carbone",
	"Castelli",
	"Cattaneo",
	"Coppola",
	"D'Amico",
	"De Angelis",
	"Farina",
	"Fiorentini",
	"Gentile",
	"Longo",
	"Marino",
	"Monti",
	"Orlando",
	"Pellegrini",
	"Piras",
	"Sanna",
	"Testa",
	"Vitale",
] as const;

/** Sigle province italiane (coerenza anagrafiche). */
export const ITALIAN_PROVINCES = [
	"AG",
	"AL",
	"AN",
	"AO",
	"AR",
	"AP",
	"AT",
	"AV",
	"BA",
	"BT",
	"BL",
	"BN",
	"BG",
	"BI",
	"BO",
	"BZ",
	"BS",
	"BR",
	"CA",
	"CL",
	"CB",
	"CE",
	"CT",
	"CZ",
	"CH",
	"CO",
	"CS",
	"CR",
	"KR",
	"CN",
	"EN",
	"FM",
	"FE",
	"FI",
	"FG",
	"FC",
	"FR",
	"GE",
	"GO",
	"GR",
	"IM",
	"IS",
	"SP",
	"AQ",
	"LT",
	"LE",
	"LC",
	"LI",
	"LO",
	"LU",
	"MC",
	"MN",
	"MS",
	"MT",
	"ME",
	"MI",
	"MO",
	"MB",
	"NA",
	"NO",
	"NU",
	"OR",
	"PD",
	"PA",
	"PR",
	"PV",
	"PG",
	"PU",
	"PE",
	"PC",
	"PI",
	"PT",
	"PN",
	"PZ",
	"PO",
	"RG",
	"RA",
	"RC",
	"RE",
	"RI",
	"RN",
	"RM",
	"RO",
	"SA",
	"SS",
	"SV",
	"SI",
	"SR",
	"SO",
	"SU",
	"TA",
	"TE",
	"TR",
	"TO",
	"TP",
	"TN",
	"TV",
	"TS",
	"UD",
	"VA",
	"VE",
	"VB",
	"VC",
	"VR",
	"VV",
	"VI",
	"VT",
] as const;

const BILL_DESCRIPTIONS = [
	"Bolletta energia elettrica palestra",
	"Fornitura gas naturale sede",
	"Canone acqua e fognatura",
	"Connessione internet fibra",
	"Assicurazione RC struttura",
	"Servizio smaltimento rifiuti speciali",
	"Canone affitto locali",
	"Manutenzione caldaia annuale",
];

const EQUIPMENT_DESCRIPTIONS = [
	"Tapis roulant professionale",
	"Cyclette spin bike",
	"Panca piana olimpica",
	"Rack squat multiposizione",
	"Set manubri gommato",
	"Cavo crossover dual",
	"Ellittica crosstrainer",
	"Palla medica e kettlebell",
];

const INTERVENTION_DESCRIPTIONS = [
	"Sostituzione cinghia tapis roulant",
	"Taratura bilance e macchinari",
	"Riparazione climatizzatore sala pesi",
	"Manutenzione ordinaria attrezzi cardio",
	"Sostituzione cuscinetti cyclette",
	"Controllo impianto elettrico spogliatoi",
	"Pulizia filtri aerazione",
	"Allineamento guida cavi pulley",
];

const PROVIDERS = [
	"Enel Energia",
	"Hera Comm",
	"TIM Business",
	"Technogym Service",
	"Panatta Sport",
	"Life Fitness Italia",
	"Manutenzione Impianti Rossi",
	"Clima Service Milano",
	"Ferramenta Sportiva Bianchi",
	"ElettroService Nord",
];

/**
 * Rimuove replacement char (`U+FFFD`) e normalizza Unicode (NFC).
 * Difesa contro dataset faker corrotti e stringhe mojibake.
 */
export function sanitizeItalianText(value: string): string {
	return value.replaceAll("\uFFFD", "").normalize("NFC").trim();
}

export function italianFirstName(): string {
	return sanitizeItalianText(faker.helpers.arrayElement(ITALIAN_FIRST_NAMES));
}

export function italianLastName(): string {
	return sanitizeItalianText(faker.helpers.arrayElement(ITALIAN_LAST_NAMES));
}

/** Codice fiscale fittizio a 16 caratteri (formato CF, non validato). */
export function fakeCodiceFiscale(): string {
	const letters = () => faker.string.alpha({ length: 1, casing: "upper" });
	const digits = (n: number) => faker.string.numeric(n);
	return (
		letters() +
		letters() +
		letters() +
		letters() +
		letters() +
		letters() +
		digits(2) +
		letters() +
		digits(2) +
		letters() +
		digits(3) +
		letters()
	);
}

export function italianPhone(): string {
	return `+39 3${faker.string.numeric(2)} ${faker.string.numeric(7)}`;
}

export function italianProvince(): string {
	return faker.helpers.arrayElement(ITALIAN_PROVINCES);
}

/** Città/via da fakerIT, sanificate (no `\uFFFD` in UI). */
export function italianCity(): string {
	return sanitizeItalianText(faker.location.city());
}

export function italianStreet(): string {
	return sanitizeItalianText(faker.location.street());
}

export function italianBillDescription(): string {
	return faker.helpers.arrayElement(BILL_DESCRIPTIONS);
}

export function italianEquipmentDescription(): string {
	return faker.helpers.arrayElement(EQUIPMENT_DESCRIPTIONS);
}

export function italianInterventionDescription(): string {
	return faker.helpers.arrayElement(INTERVENTION_DESCRIPTIONS);
}

export function italianProvider(): string {
	return faker.helpers.arrayElement(PROVIDERS);
}

/** Codici prodotto palestra (prefisso IT + alfanumerico). */
export function italianProductCode(index: number): string {
	const prefix = faker.helpers.arrayElement(["ABB", "PAC", "CRT", "FIT"]);
	return `${prefix}${String(index + 1).padStart(3, "0")}`;
}
