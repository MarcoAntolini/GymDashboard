package dashboard.ui.panels.tablePanels;

public final class ColumnNames {

	private ColumnNames() {
	}

	protected static final String[] COLUMNS_ABBONAMENTI = new String[] {
			"Codice",
			"Durata"
	};

	protected static final String[] COLUMNS_ACQUISTI = new String[] {
			"Id cliente",
			"Data e ora",
			"Importo",
			"Tipo",
			"Codice"
	};

	protected static final String[] COLUMNS_ATTREZZATURE = new String[] {
			"Id",
			"Descrizione",
			"Fornitore"
	};

	protected static final String[] COLUMNS_BOLLETTE = new String[] {
			"Id",
			"Descrizione",
			"Fornitore"
	};

	protected static final String[] COLUMNS_CLIENTI = new String[] {
			"Id",
			"Codice fiscale",
			"Nome",
			"Cognome",
			"Data di nascita",
			"Via",
			"N°",
			"Città",
			"Provincia",
			"Telefono",
			"Email",
			"Data di iscrizione",
			"Entrate rimaste"
	};

	protected static final String[] COLUMNS_CONTRATTI = new String[] {
			"Id dipendente",
			"Tipo",
			"Costo orario",
			"Data di inizio",
			"Data di fine"
	};

	protected static final String[] COLUMNS_DIPENDENTI = new String[] {
			"Id",
			"Codice fiscale",
			"Nome",
			"Cognome",
			"Data di nascita",
			"Via",
			"N°",
			"Città",
			"Provincia",
			"Telefono",
			"Email",
			"Data di assunzione"
	};

	protected static final String[] COLUMNS_INGRESSI = new String[] {
			"Id cliente",
			"Data e ora"
	};

	protected static final String[] COLUMNS_INTERVENTI = new String[] {
			"Id",
			"Descrizione",
			"Fornitore",
			"Data di inizio",
			"Data di fine"
	};

	protected static final String[] COLUMNS_LISTINI = new String[] {
			"Anno",
			"Tipo",
			"Codice",
			"Prezzo"
	};

	protected static final String[] COLUMNS_PACCHETTI_ENTRATE = new String[] {
			"Codice",
			"Numero di entrate",
	};

	protected static final String[] COLUMNS_PAGAMENTI = new String[] {
			"Id",
			"Data e ora",
			"Importo",
			"Tipo"
	};

	protected static final String[] COLUMNS_STIPENDI = new String[] {
			"Id",
			"Id dipendente"
	};

	protected static final String[] COLUMNS_TIMBRATURE = new String[] {
			"Id dipendente",
			"Entrata",
			"Uscita"
	};

}
