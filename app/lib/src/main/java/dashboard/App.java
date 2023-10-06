package dashboard;

import dashboard.database.ConnectionProvider;
import dashboard.ui.Dashboard;

import javax.swing.SwingUtilities;

public class App {

	static final String USERNAME = "root";
	static final String PASSWORD = "";
	static final String DATABASE_NAME = "gym-dashboard";

	public static final ConnectionProvider CONNECTION = new ConnectionProvider(USERNAME, PASSWORD, DATABASE_NAME);

	public static void main(String[] args) {
		SwingUtilities.invokeLater(Dashboard::new);
	}

}
