package dashboard.ui.panels.tabbedPanels;

import java.sql.Date;
import java.util.LinkedHashMap;
import java.util.Map;

@SuppressWarnings({ "java:S3599", "java:S1171", "java:S2386" })
public final class Columns {

	private Columns() {
	}

	public static final Map<String, Class<?>> COLUMNS_ABBONAMENTI = new LinkedHashMap<>() {
		{
			put("Codice", String.class);
			put("Durata", Integer.class);
		}
	};

	public static final Map<String, Class<?>> COLUMNS_ACQUISTI = new LinkedHashMap<>() {
		{
			put("Id cliente", Integer.class);
			put("Data e ora", Date.class);
			put("Importo", Double.class);
			put("Tipo", String.class);
			put("Codice", String.class);
		}
	};

	public static final Map<String, Class<?>> COLUMNS_ATTREZZATURE = new LinkedHashMap<>() {
		{
			put("Id", Integer.class);
			put("Descrizione", String.class);
			put("Fornitore", String.class);
		}
	};

	public static final Map<String, Class<?>> COLUMNS_BOLLETTE = new LinkedHashMap<>() {
		{
			put("Id", Integer.class);
			put("Descrizione", String.class);
			put("Fornitore", String.class);
		}
	};

	public static final Map<String, Class<?>> COLUMNS_CLIENTI = new LinkedHashMap<>() {
		{
			put("Id", Integer.class);
			put("Codice fiscale", String.class);
			put("Nome", String.class);
			put("Cognome", String.class);
			put("Data di nascita", Date.class);
			put("Via", String.class);
			put("N°", String.class);
			put("Città", String.class);
			put("Provincia", String.class);
			put("Telefono", String.class);
			put("Email", String.class);
			put("Data di iscrizione", Date.class);
			put("Entrate rimaste", Integer.class);
		}
	};

	public static final Map<String, Class<?>> COLUMNS_CONTRATTI = new LinkedHashMap<>() {
		{
			put("Id dipendente", Integer.class);
			put("Tipo", String.class);
			put("Costo orario", Double.class);
			put("Data di inizio", Date.class);
			put("Data di fine", Date.class);
		}
	};

	public static final Map<String, Class<?>> COLUMNS_DIPENDENTI = new LinkedHashMap<>() {
		{
			put("Id", Integer.class);
			put("Codice fiscale", String.class);
			put("Nome", String.class);
			put("Cognome", String.class);
			put("Data di nascita", Date.class);
			put("Via", String.class);
			put("N°", String.class);
			put("Città", String.class);
			put("Provincia", String.class);
			put("Telefono", String.class);
			put("Email", String.class);
			put("Data di assunzione", Date.class);
		}
	};

	public static final Map<String, Class<?>> COLUMNS_INGRESSI = new LinkedHashMap<>() {
		{
			put("Id cliente", Integer.class);
			put("Data e ora", Date.class);
		}
	};

	public static final Map<String, Class<?>> COLUMNS_INTERVENTI = new LinkedHashMap<>() {
		{
			put("Id", Integer.class);
			put("Descrizione", String.class);
			put("Fornitore", String.class);
			put("Data di inizio", Date.class);
			put("Data di fine", Date.class);
		}
	};

	public static final Map<String, Class<?>> COLUMNS_LISTINI = new LinkedHashMap<>() {
		{
			put("Anno", Integer.class);
			put("Tipo", String.class);
			put("Codice", String.class);
			put("Prezzo", Double.class);
		}
	};

	public static final Map<String, Class<?>> COLUMNS_PACCHETTI_ENTRATE = new LinkedHashMap<>() {
		{
			put("Codice", String.class);
			put("Numero di entrate", Integer.class);
		}
	};

	public static final Map<String, Class<?>> COLUMNS_PAGAMENTI = new LinkedHashMap<>() {
		{
			put("Id", Integer.class);
			put("Data e ora", Date.class);
			put("Importo", Double.class);
			put("Tipo", String.class);
		}
	};

	public static final Map<String, Class<?>> COLUMNS_STIPENDI = new LinkedHashMap<>() {
		{
			put("Id", Integer.class);
			put("Id dipendente", Integer.class);
		}
	};

	public static final Map<String, Class<?>> COLUMNS_TIMBRATURE = new LinkedHashMap<>() {
		{
			put("Id dipendente", Integer.class);
			put("Entrata", Date.class);
			put("Uscita", Date.class);
		}
	};

}
