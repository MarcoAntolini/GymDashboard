package dashboard.database;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.Objects;

/**
 * The abstract Table class represents a database table and provides basic CRUD
 * operations.
 *
 * @param <V> the type of objects stored in the table
 * @param <K> the type of the primary key of the table
 */
@SuppressWarnings("java:S2326")
public abstract class Table<V, K> {

	protected final Connection connection;
	protected String tableName;

	/**
	 * Constructs a new Table object with the given database connection.
	 *
	 * @param connection the database connection to use
	 */
	protected Table(final Connection connection) {
		this.connection = Objects.requireNonNull(connection);
	}

	/**
	 * Returns the name of the table.
	 *
	 * @return the name of the table
	 */
	public String getTableName() {
		return this.tableName;
	}

	/**
	 * Returns true if the table exists in the database, false otherwise.
	 * 
	 * @return true if the table exists in the database, false otherwise
	 */
	public boolean exists() {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?")) {
			statement.setString(1, this.connection.getCatalog());
			statement.setString(2, this.tableName);
			try (final ResultSet resultSet = statement.executeQuery()) {
				if (resultSet.next()) {
					return resultSet.getInt(1) > 0;
				} else {
					return false;
				}
			}
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	/**
	 * Creates the table if it does not already exist.
	 */
	public void createTable() {
		if (!exists()) {
			create();
		}
	}

	/**
	 * Drops the table from the database.
	 */
	public void dropTable() {
		try (final Statement statement = this.connection.createStatement()) {
			statement.executeUpdate("DROP TABLE " + this.tableName);
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	/**
	 * Returns a list of all objects in the table.
	 *
	 * @return a list of all objects in the table
	 */
	public List<V> findAll() {
		try (final PreparedStatement statement = this.connection.prepareStatement("SELECT * FROM " + this.tableName)) {
			final ResultSet resultSet = statement.executeQuery();
			return readObjectFromResultSet(resultSet);
		} catch (final SQLException e) {
			e.printStackTrace();
			return List.of();
		}
	}

	/**
	 * Creates the table in the database.
	 */
	protected abstract void create();

	/**
	 * Inserts the given object into the table.
	 *
	 * @param value the object to save
	 */
	public abstract void insert(final V value);

	/**
	 * Reads objects from the given ResultSet and returns them as a list.
	 *
	 * @param resultSet the ResultSet to read objects from
	 * @return a list of objects read from the ResultSet
	 * @throws SQLException if an error occurs while reading from the ResultSet
	 */
	protected abstract List<V> readObjectFromResultSet(final ResultSet resultSet);

}
