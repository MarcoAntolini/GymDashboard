package dashboard.ui.panels.tabbedPanels.clienti;

import dashboard.database.tables.TableClienti;
import dashboard.model.Cliente;
import dashboard.ui.panels.Panel;
import dashboard.ui.panels.tabbedPanels.clienti.dialogs.AddCliente;
import dashboard.ui.panels.tabbedPanels.clienti.dialogs.DeleteCliente;
import dashboard.ui.panels.tabbedPanels.clienti.dialogs.UpdateCliente;

import javax.swing.JButton;
import javax.swing.JTable;
import javax.swing.table.DefaultTableCellRenderer;

import java.awt.Component;
import java.text.DecimalFormat;

import static dashboard.App.CONNECTION;
import static dashboard.ui.panels.tabbedPanels.Columns.COLUMNS_CLIENTI;

public class PanelClienti extends Panel {

	private static final String AGGIUNGI_CLIENTE = "Aggiungi cliente";
	private static final String ELIMINA_CLIENTE = "Elimina cliente";
	private static final String AGGIORNA_CLIENTE = "Aggiorna cliente";

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
		db = new TableClienti(CONNECTION.getMySQLConnection());
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
		addCliente.addActionListener(e -> new AddCliente(this, db, AGGIUNGI_CLIENTE));
		actionsPanel.add(addCliente);
		final JButton deleteCliente = new JButton(ELIMINA_CLIENTE);
		deleteCliente.addActionListener(e -> new DeleteCliente(this, db, ELIMINA_CLIENTE));
		actionsPanel.add(deleteCliente);
		final JButton updateCliente = new JButton(AGGIORNA_CLIENTE);
		updateCliente.addActionListener(e -> new UpdateCliente(this, db, AGGIORNA_CLIENTE));
		actionsPanel.add(updateCliente);

		final JButton refresh = new JButton("Ricarica");
		refresh.addActionListener(e -> refreshTable());
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

	@Override
	public void refreshTable() {
		db.findAll().forEach(cliente -> addDataToTable(cliente.toArray()));
	}

}
