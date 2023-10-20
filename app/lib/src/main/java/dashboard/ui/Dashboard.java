package dashboard.ui;

import dashboard.ui.panels.tabbedPanels.clienti.PanelClienti;

import javax.swing.JFrame;
import javax.swing.JTabbedPane;

import static dashboard.utils.Screen.DEFAULT_SIZE;
import static dashboard.utils.Screen.MAXIMUM_SIZE;
import static dashboard.utils.Screen.MINIMUM_SIZE;
import static dashboard.utils.Screen.setIcon;

public class Dashboard extends JFrame {

	private class JWindow extends JTabbedPane {

		PanelClienti panelClienti;
		// PanelDipendenti panelDipendenti;
		// PanelListini panelListini;

		private JWindow() {
			super();
			panelClienti = new PanelClienti();
			// panelDipendenti = new PanelDipendenti();
			// panelListini = new PanelListini();
		}

		private void addPanes() {
			addTab("Clienti", panelClienti);
			// addTab("Dipendenti", panelDipendenti);
			// addTab("Listini", panelListini);
		}

	}

	private final JWindow window;

	public Dashboard() {
		setTitle("Gym Dashboard");
		setIcon(this, "logo.png");
		setDefaultCloseOperation(EXIT_ON_CLOSE);

		setSize(DEFAULT_SIZE);
		setMinimumSize(MINIMUM_SIZE);
		setMaximumSize(MAXIMUM_SIZE);
		setPreferredSize(DEFAULT_SIZE);

		window = new JWindow();
		window.addPanes();
		add(window);

		setLocationRelativeTo(null);
		setVisible(true);
	}

}
