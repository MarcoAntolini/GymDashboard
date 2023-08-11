package dashboard;

import dashboard.database.ConnectionProvider;
import dashboard.database.tables.CustomersTable;

public class App {

    static final String USERNAME = "root";
    static final String PASSWORD = "";
    static final String DATABASE_NAME = "test-db";

    final ConnectionProvider connectionProvider = new ConnectionProvider(USERNAME, PASSWORD, DATABASE_NAME);
    final CustomersTable customerTable = new CustomersTable(connectionProvider.getMySQLConnection());

    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
