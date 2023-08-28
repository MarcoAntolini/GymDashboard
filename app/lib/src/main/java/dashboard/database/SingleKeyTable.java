package dashboard.database;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * This abstract class represents a database table. It provides methods for
 * creating, dropping, saving, updating,
 * deleting, and finding objects in the table.
 *
 * @param <V> the type of object stored in the table
 * @param <K> the type of the primary key of the table
 */
public abstract class SingleKeyTable<V, K> {

	protected final Connection connection;
	protected String tableName;
	protected String primaryKeyName;
	// protected ArrayList<String> primaryKeyNames;

	/**
	 * Constructs a new Table object with the given database connection.
	 *
	 * @param connection the database connection to use
	 */
	protected SingleKeyTable(final Connection connection) {
		this.connection = Objects.requireNonNull(connection);
		// this.primaryKeyNames = new ArrayList<>();
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
	 * Drops the table from the database.
	 *
	 * @return true if the table was dropped successfully, false otherwise
	 */
	public boolean dropTable() {
		try (final Statement statement = this.connection.createStatement()) {
			statement.executeUpdate("DROP TABLE " + this.tableName);
			return true;
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
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
	 * Finds a record in the table by its primary key.
	 *
	 * @param primaryKeyList a list of the primary keys of the record to find
	 * @return an Optional containing the record if found, or an empty Optional if
	 *         not found
	 */
	public Optional<V> findByPrimaryKey(final List<K> primaryKeyList) {
		StringBuilder sql = new StringBuilder("SELECT * FROM " + this.tableName + " WHERE ");
		boolean firstField = true;
		for (String primaryKeyFieldName : this.primaryKeyNames) {
			if (!firstField) {
				sql.append(" AND ");
			}
			sql.append(primaryKeyFieldName).append(" = ?");
			firstField = false;
		}
		try (final PreparedStatement statement = this.connection.prepareStatement(sql.toString())) {
			int parameterIndex = 1;
			for (K primaryKeyValue : primaryKeyList) {
				statement.setObject(parameterIndex++, primaryKeyValue);
			}
			final ResultSet resultSet = statement.executeQuery();
			final List<V> object = readObjectFromResultSet(resultSet);
			return object.isEmpty() ? Optional.empty() : Optional.of(object.get(0));
		} catch (final SQLException e) {
			e.printStackTrace();
			return Optional.empty();
		}
	}

	/**
	 * Finds a record in the table by its primary key.
	 *
	 * @param primaryKey the primary key of the record to find
	 * @return an Optional containing the record if found, or an empty Optional if
	 *         not found
	 */
	public Optional<V> findByPrimaryKey(final K primaryKey) {
		return findByPrimaryKey(List.of(primaryKey));
	}

	/**
	 * Updates the object with the given primary key in the table with the given
	 * updated fields.
	 *
	 * @param primaryKeyList a list of the primary keys of the object to update
	 * @param updatedFields  a map of field names to updated values
	 * @return true if the object was updated successfully, false otherwise
	 */
	@SuppressWarnings("java:S2583")
	public boolean update(final List<K> primaryKeyList, final Map<String, Object> updatedFields) {
		StringBuilder sql = new StringBuilder("UPDATE " + this.tableName + " SET ");
		boolean firstField = true;
		for (String fieldName : updatedFields.keySet()) {
			if (!firstField) {
				sql.append(", ");
			}
			sql.append(fieldName).append(" = ?");
			firstField = false;
		}
		sql.append(" WHERE ");
		firstField = true;
		for (String primaryKeyFieldName : this.primaryKeyNames) {
			if (!firstField) {
				sql.append(" AND ");
			}
			sql.append(primaryKeyFieldName).append(" = ?");
		}
		try (final PreparedStatement statement = this.connection.prepareStatement(sql.toString())) {
			int parameterIndex = 1;
			for (Object updatedFieldValue : updatedFields.values()) {
				statement.setObject(parameterIndex++, updatedFieldValue);
			}
			for (K primaryKeyValue : primaryKeyList) {
				statement.setObject(parameterIndex++, primaryKeyValue);
			}
			statement.executeUpdate();
			return true;
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	/**
	 * Updates the object with the given primary key in the table with the given
	 * updated fields.
	 *
	 * @param primaryKey    the primary key of the object to update
	 * @param updatedFields a map of field names to updated values
	 * @return true if the object was updated successfully, false otherwise
	 */
	public boolean update(final K primaryKey, final Map<String, Object> updatedFields) {
		return update(List.of(primaryKey), updatedFields);
	}

	/**
	 * Deletes the object with the given primary key from the table.
	 *
	 * @param primaryKeyList the list of primary keys of the object to delete
	 * @return true if the object was deleted successfully, false otherwise
	 */
	public boolean delete(final List<K> primaryKeyList) {
		try {
			if (this.findByPrimaryKey(primaryKeyList).isEmpty()) {
				return false;
			}
			StringBuilder sql = new StringBuilder("DELETE FROM " + this.tableName + " WHERE ");
			boolean firstField = true;
			for (String primaryKeyFieldName : this.primaryKeyNames) {
				if (!firstField) {
					sql.append(" AND ");
				}
				sql.append(primaryKeyFieldName).append(" = ?");
				firstField = false;
			}
			try (final PreparedStatement statement = this.connection.prepareStatement(sql.toString())) {
				int parameterIndex = 1;
				for (K primaryKeyValue : primaryKeyList) {
					statement.setObject(parameterIndex++, primaryKeyValue);
				}
				statement.executeUpdate();
				return true;
			}
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	/**
	 * Deletes the object with the given primary key from the table.
	 *
	 * @param primaryKey the primary key of the object to delete
	 * @return true if the object was deleted successfully, false otherwise
	 */
	public boolean delete(final K primaryKey) {
		return delete(List.of(primaryKey));
	}

	/**
	 * Creates the table in the database.
	 *
	 * @return true if the table was created successfully, false otherwise
	 */
	public abstract boolean createTable();

	/**
	 * Saves the given object to the table.
	 *
	 * @param value the object to save
	 * @return true if the object was saved successfully, false otherwise
	 */
	public abstract boolean save(final V value);

	/**
	 * Reads objects from the given ResultSet and returns them as a list.
	 *
	 * @param resultSet the ResultSet to read objects from
	 * @return a list of objects read from the ResultSet
	 * @throws SQLException if an error occurs while reading from the ResultSet
	 */
	protected abstract List<V> readObjectFromResultSet(final ResultSet resultSet);

}
