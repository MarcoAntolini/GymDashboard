package dashboard.ui;

import dashboard.ui.panels.tablePanels.PanelClienti;

import javax.swing.ImageIcon;
import javax.swing.JFrame;
import javax.swing.JTabbedPane;

import java.awt.Image;
import java.awt.Taskbar;
import java.awt.Taskbar.Feature;
import java.awt.Toolkit;

import static dashboard.utils.Screen.DEFAULT_SIZE;
import static dashboard.utils.Screen.MAXIMUM_SIZE;
import static dashboard.utils.Screen.MINIMUM_SIZE;

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
		setIcon("logo.png");
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

	private void setIcon(String fileName) {
		final ImageIcon appIcon = new ImageIcon(fileName);
		setIconImage(appIcon.getImage());
		if (Taskbar.isTaskbarSupported()) {
			final Taskbar taskbar = Taskbar.getTaskbar();
			if (taskbar.isSupported(Feature.ICON_IMAGE)) {
				final Toolkit toolkit = Toolkit.getDefaultToolkit();
				final Image dockIcon = toolkit.getImage(getClass().getClassLoader().getResource(fileName));
				taskbar.setIconImage(dockIcon);
			}
		}
	}

}
