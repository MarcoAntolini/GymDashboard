package dashboard.ui.panels.tabbedPanels.clienti.dialogs;

import dashboard.ui.panels.JDatePicker;

import javax.swing.JDialog;
import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.JTextField;

import java.awt.BorderLayout;

import static dashboard.ui.panels.tabbedPanels.clienti.PanelClienti.AGGIUNGI_CLIENTE;

public class AddCliente extends JDialog {

	public AddCliente(final JFrame frame) {
		super(frame, AGGIUNGI_CLIENTE, true);
		setDefaultCloseOperation(DISPOSE_ON_CLOSE);
		addComponents();
		pack();
		setResizable(false);
		setLocationRelativeTo(frame);
		setVisible(true);
	}

	private void addComponents() {
		JPanel panel = new JPanel(new BorderLayout());

		JTextField codiceFiscale = new JTextField(16);
		JTextField nome = new JTextField(20);
		JTextField cognome = new JTextField(20);
		JDatePicker datePicker = new JDatePicker("Data di nascita");

		panel.add(codiceFiscale, BorderLayout.NORTH);
		panel.add(nome, BorderLayout.WEST);
		panel.add(cognome, BorderLayout.EAST);
		panel.add(datePicker, BorderLayout.SOUTH);

		add(panel);
	}

}
