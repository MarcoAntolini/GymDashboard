package dashboard.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Expose a utility method to connect to a MySQL database.
 */
public final class ConnectionProvider {

	private static final String HOST_URI = "jdbc:mysql://localhost:3306/";
	private final String username;
	private final String password;
	private final String databaseName;

	/**
	 * Constructs a new ConnectionProvider object with the given username, password,
	 * and database name.
	 * 
	 * @param username     the username used to connect to the database
	 * @param password     the password used to connect to the database
	 * @param databaseName the name of the database to connect to
	 */
	public ConnectionProvider(final String username, final String password, final String databaseName) {
		this.username = username;
		this.password = password;
		this.databaseName = databaseName;
		this.createDatabase();
	}

	/**
	 * Return the connection to the database specified in the class constructor.
	 * 
	 * @return a {@link Connection} with the database specified in the class
	 *         constructor
	 * @throws IllegalStateException if the connection could not be establish
	 */
	public Connection getMySQLConnection() {
		final String dbUri = "jdbc:mysql://localhost:3306/" + this.databaseName;
		try {
			return DriverManager.getConnection(dbUri, this.username, this.password);
		} catch (SQLException e) {
			throw new IllegalStateException("Could not establish a connection with " + dbUri, e);
		}
	}

	/**
	 * Creates the database if it does not already exist.
	 * 
	 * @throws IllegalStateException if a connection to the database cannot be
	 *                               established
	 */
	private void createDatabase() {
		try (Connection connection = DriverManager.getConnection(HOST_URI, this.username, this.password);
				Statement statement = connection.createStatement()) {
			String createDatabaseQuery = String.format("CREATE DATABASE IF NOT EXISTS `%s`", this.databaseName);
			statement.executeUpdate(createDatabaseQuery);
		} catch (SQLException e) {
			throw new IllegalStateException("Could not establish a connection with " + HOST_URI, e);
		}
	}

}
