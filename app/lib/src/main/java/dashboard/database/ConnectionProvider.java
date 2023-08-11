package dashboard.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Expose a utility method to connect to a MySQL database.
 */
public final class ConnectionProvider {

	private final String username;
	private final String password;
	private final String databaseName;

	/**
	 * @param username     the username used to connect to the database
	 * @param password     the password used to connect to the database
	 * @param databaseName the name of the database to connect to
	 */
	public ConnectionProvider(final String username, final String password, final String databaseName) {
		this.username = username;
		this.password = password;
		this.databaseName = databaseName;
	}

	/**
	 * @return a Connection with the database specified in the class constructor
	 * @throws IllegalStateException if the connection could not be establish
	 */
	public Connection getMySQLConnection() {
		final String dbUri = "jdbc:mysql://localhost:3306/" + this.databaseName;
		try {
			return DriverManager.getConnection(dbUri, this.username, this.password);
		} catch (final SQLException e) {
			throw new IllegalStateException("Could not establish a connection with " + dbUri, e);
		}
	}

}
