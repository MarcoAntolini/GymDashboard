package dashboard.ui.components.dialog;

import dashboard.database.Table;
import dashboard.ui.panels.Panel;

import javax.swing.BorderFactory;
import javax.swing.JComponent;
import javax.swing.JDialog;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JTextField;

import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;

@SuppressWarnings({ "java:S1104", "rawtypes" })
public abstract class JFormDialog<T extends Table> extends JDialog {

	private Panel parent;
	public JPanel panel;
	public GridBagConstraints c;
	public final transient T db;
	private static final String ERROR_MESSAGE = "Tutti i campi sono obbligatori";

	public JFormDialog(final Panel parent, final T db, final String title) {
		super(parent.frame, title, true);
		this.parent = parent;
		this.db = db;
		setDefaultCloseOperation(DISPOSE_ON_CLOSE);
		initPanel();
		addComponents();
		pack();
		setResizable(false);
		setLocationRelativeTo(parent.frame);
		setVisible(true);
	}

	private void initPanel() {
		panel = new JPanel(new GridBagLayout());
		panel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
		add(panel);
		c = new GridBagConstraints();
		c.fill = GridBagConstraints.HORIZONTAL;
		c.weightx = 0.5;
		c.weighty = 0.5;
		c.insets.set(2, 2, 2, 2);
	}

	public abstract void addComponents();

	public void addLabeledComponent(
			final JPanel panel, final JLabel label, final JComponent component,
			final int x, final int y, final int width) {
		c.gridwidth = width;
		c.gridx = x;
		c.gridy = y;
		panel.add(label, c);
		c.gridx = x + 1;
		c.gridy = y;
		panel.add(component, c);
	}

	public void addLabeledComponent(
			final JPanel panel, final JLabel label, final JComponent component,
			final int x, final int y) {
		addLabeledComponent(panel, label, component, x, y, 1);
	}

	public void handleFormSubmission() {
		if (validateForm(panel)) {
			if (performAction()) {
				dispose();
				parent.clearTable();
				parent.refreshTable();
			}
		} else {
			JOptionPane.showMessageDialog(this, ERROR_MESSAGE, "Errore", JOptionPane.ERROR_MESSAGE);
		}
	}

	public boolean validateForm(final JPanel panel) {
		for (int i = 0; i < panel.getComponentCount(); i++) {
			if (panel.getComponent(i) instanceof JComponent) {
				final JComponent component = (JComponent) panel.getComponent(i);
				if (component instanceof JTextField) {
					if (((JTextField) component).getText().isEmpty()) {
						return false;
					}
				} else if (component instanceof JPanel) {
					return validateForm((JPanel) component);
				}
			}
		}
		return true;
	}

	public abstract boolean performAction();
}
