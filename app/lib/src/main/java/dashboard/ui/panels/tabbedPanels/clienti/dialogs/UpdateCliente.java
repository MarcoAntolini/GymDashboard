package dashboard.ui.panels.tabbedPanels.clienti.dialogs;

import dashboard.database.tables.TableClienti;
import dashboard.ui.components.dialog.JFormDialog;
import dashboard.ui.components.inputs.datePicker.JNewDatePicker;
import dashboard.ui.components.inputs.datePicker.JOldDatePicker;
import dashboard.ui.components.inputs.textFields.JIntegerInput;
import dashboard.ui.components.inputs.textFields.JTextInput;
import dashboard.ui.panels.Panel;

import javax.swing.JButton;
import javax.swing.JLabel;
import javax.swing.JPanel;

import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;

public class UpdateCliente extends JFormDialog<TableClienti> {

	private JTextInput nome;
	private JTextInput cognome;
	private JTextInput codiceFiscale;
	private JOldDatePicker dataNascita;
	private JTextInput via;
	private JTextInput numero;
	private JTextInput citta;
	private JTextInput provincia;
	private JTextInput telefono;
	private JTextInput email;
	private JNewDatePicker dataIscrizione;
	private JIntegerInput entrateRimaste;

	public UpdateCliente(final Panel parent, final TableClienti db, final String title) {
		super(parent, db, title);
	}

	@Override
	public void addComponents() {
		final JPanel anagrafica = new JPanel(new GridBagLayout());
		nome = new JTextInput(20);
		cognome = new JTextInput(20);
		codiceFiscale = new JTextInput(16);
		dataNascita = new JOldDatePicker();
		addLabeledComponent(anagrafica, new JLabel("Nome"), nome, 0, 0);
		addLabeledComponent(anagrafica, new JLabel("Cognome"), cognome, 0, 1);
		addLabeledComponent(anagrafica, new JLabel("Codice fiscale"), codiceFiscale, 2, 0);
		addLabeledComponent(anagrafica, new JLabel("Data di nascita"), dataNascita, 2, 1);
		final JPanel indirizzo = new JPanel(new GridBagLayout());
		via = new JTextInput(30);
		numero = new JTextInput(5);
		citta = new JTextInput(30);
		provincia = new JTextInput(2);
		addLabeledComponent(indirizzo, new JLabel("Via"), via, 0, 0);
		addLabeledComponent(indirizzo, new JLabel("N°"), numero, 2, 0);
		addLabeledComponent(indirizzo, new JLabel("Città"), citta, 0, 1);
		addLabeledComponent(indirizzo, new JLabel("Provincia"), provincia, 2, 1);
		final JPanel contatto = new JPanel(new GridBagLayout());
		telefono = new JTextInput(15);
		email = new JTextInput(30);
		addLabeledComponent(contatto, new JLabel("Telefono"), telefono, 0, 0);
		addLabeledComponent(contatto, new JLabel("Email"), email, 2, 0);
		final JPanel tessera = new JPanel(new GridBagLayout());
		dataIscrizione = new JNewDatePicker();
		entrateRimaste = new JIntegerInput(3);
		addLabeledComponent(tessera, new JLabel("Data iscrizione"), dataIscrizione, 0, 0);
		addLabeledComponent(tessera, new JLabel("Entrate rimaste"), entrateRimaste, 2, 0);
		c.gridx = 0;
		c.gridy = 0;
		panel.add(anagrafica, c);
		c.gridy = 1;
		panel.add(indirizzo, c);
		c.gridy = 2;
		panel.add(contatto, c);
		c.gridy = 3;
		panel.add(tessera, c);
		final JButton aggiungi = new JButton("Aggiungi");
		aggiungi.addActionListener(e -> handleFormSubmission());
		c.gridy = 4;
		c.fill = GridBagConstraints.NONE;
		c.anchor = GridBagConstraints.SOUTHEAST;
		panel.add(aggiungi, c);
	}

	@Override
	public boolean performAction() {
		return db.update(null, null);
	}

}
