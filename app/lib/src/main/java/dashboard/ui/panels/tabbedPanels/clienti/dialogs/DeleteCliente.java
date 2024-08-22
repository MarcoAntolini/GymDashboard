package dashboard.ui.panels.tabbedPanels.clienti.dialogs;

import dashboard.database.tables.TableClienti;
import dashboard.model.Cliente;
import dashboard.ui.components.dialog.JFormDialog;
import dashboard.ui.components.inputs.comboBox.JFilteredDropdown;
import dashboard.ui.panels.Panel;

import javax.swing.JButton;
import javax.swing.JLabel;
import javax.swing.JPanel;

import java.awt.Dimension;
import java.awt.GridBagConstraints;

public class DeleteCliente extends JFormDialog<TableClienti> {

	private JFilteredDropdown<Integer> id;

	public DeleteCliente(final Panel parent, final TableClienti db, final String title) {
		super(parent, db, title);
	}

	@Override
	public void addComponents() {
		id = new JFilteredDropdown<>(db.findAll().stream().map(Cliente::getId).toList());
		addLabeledComponent(panel, new JLabel("Id"), id, 0, 0);
		final JPanel space = new JPanel();
		space.setPreferredSize(new Dimension(150, 10));
		panel.add(space, c);
		final JButton elimina = new JButton("Elimina");
		elimina.addActionListener(e -> handleFormSubmission());
		c.gridy = 2;
		c.fill = GridBagConstraints.NONE;
		c.anchor = GridBagConstraints.SOUTHEAST;
		panel.add(elimina, c);
	}

	@Override
	public boolean performAction() {
		return db.delete(id.getSelectedItem());
	}

}
