package dashboard.ui.panels.tabbedPanels.clienti;

import dashboard.database.tables.TableClienti;
import dashboard.model.Cliente;
import dashboard.ui.panels.Panel;
import dashboard.ui.panels.tabbedPanels.clienti.dialogs.AddCliente;

import javax.swing.JButton;
import javax.swing.JTable;
import javax.swing.table.DefaultTableCellRenderer;

import java.awt.Component;
import java.text.DecimalFormat;

import static dashboard.App.CONNECTION;
import static dashboard.ui.panels.tabbedPanels.Columns.COLUMNS_CLIENTI;

public class PanelClienti extends Panel {

	public static final String AGGIUNGI_CLIENTE = "Aggiungi cliente";

	private class ClienteIdRenderer extends DefaultTableCellRenderer {

		private final DecimalFormat format = new DecimalFormat("0000");

		@Override
		public Component getTableCellRendererComponent(JTable table, Object value, boolean isSelected, boolean hasFocus,
				int row, int column) {
			if (value instanceof Integer) {
				value = format.format(value);
			}
			return super.getTableCellRendererComponent(table, value, isSelected, hasFocus, row, column);
		}

	}

	private final transient TableClienti db;

	public PanelClienti() {
		super();
		this.db = new TableClienti(CONNECTION.getMySQLConnection());
		db.dropTable();
		db.createTable();
		setupTablePanel();
		setupActionsPanel();

		test();
	}

	@Override
	protected void setupTablePanel() {
		setColumns(COLUMNS_CLIENTI);
		super.setupTablePanel();
		setIdRenderer(new ClienteIdRenderer());
	}

	@Override
	protected void setupActionsPanel() {
		final JButton addCliente = new JButton(AGGIUNGI_CLIENTE);
		addCliente.addActionListener(e -> new AddCliente(frame));
		actionsPanel.add(addCliente);

	}

	private void test() {
		for (int i = 0; i < 10; i++) {
			db.insert(new Cliente("NTLMRC099BLJKLG7", "Marco", "Antolini", new java.sql.Date(0),
					new Cliente.Indirizzo("Via Innocenzo Golfarelli", "7", "Domodossola", "BO"),
					new Cliente.Contatto("3403771129", "marco.antolini2001@gmail.com"),
					new java.sql.Date(0)));
		}
		db.findAll().forEach(cliente -> addDataToTable(cliente.toArray()));
	}

}
