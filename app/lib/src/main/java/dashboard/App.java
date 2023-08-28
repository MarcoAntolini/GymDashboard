package dashboard;

import dashboard.database.ConnectionProvider;
import dashboard.database.tables.TableCliente;

public class App {

    static final String USERNAME = "root";
    static final String PASSWORD = "";
    static final String DATABASE_NAME = "gym-dashboard";

    final ConnectionProvider connectionProvider = new ConnectionProvider(USERNAME, PASSWORD, DATABASE_NAME);
    final TableCliente tableCliente = new TableCliente(connectionProvider.getMySQLConnection());

    public static void main(String[] args) {
        new YearChooserExample();
        System.out.println("Hello, World!");
    }

}
