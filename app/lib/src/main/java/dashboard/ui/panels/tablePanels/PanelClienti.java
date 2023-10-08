package dashboard.ui.panels.tablePanels;

import dashboard.database.tables.TableClienti;
import dashboard.model.Cliente;
import dashboard.ui.panels.Panel;

import static dashboard.App.CONNECTION;
import static dashboard.ui.panels.tablePanels.ColumnNames.COLUMNS_CLIENTI;

public class PanelClienti extends Panel {

	private final transient TableClienti db;

	public PanelClienti() {
		super();
		this.db = new TableClienti(CONNECTION.getMySQLConnection());
		db.createTable();
		setupTablePanel();

		test();
	}

	@Override
	protected void setupTablePanel() {
		columnNames = COLUMNS_CLIENTI;
		super.setupTablePanel();
	}

	private void test() {
		db.insert(new Cliente("NTLMRC099BLJKLG7", "Marco", "Antolini", new java.sql.Date(0),
				new Cliente.Indirizzo("Via Innocenzo Golfarelli", "7", "Domodossola", "BO"),
				new Cliente.Contatto("3403771129", "marco.antolini2001@gmail.com"),
				new java.sql.Date(0)));
		db.findAll().forEach(cliente -> addDataToTable(cliente.toArray()));
	}

}
