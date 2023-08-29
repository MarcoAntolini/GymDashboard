package dashboard.database;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * This abstract class represents a database table. It provides methods for
 * creating, dropping, saving, updating,
 * deleting, and finding objects in the table.
 *
 * @param <V> the type of object stored in the table
 * @param <K> the type of the primary key of the table
 */
public abstract class SingleKeyTable<V, K> extends Table<V, K> {

	protected String primaryKeyName;

	/**
	 * Constructs a new Table object with the given database connection.
	 *
	 * @param connection the database connection to use
	 */
	protected SingleKeyTable(final Connection connection) {
		super(connection);
	}

	/**
	 * Finds a record in the table by its primary key.
	 *
	 * @param primaryKey the primary key of the record to find
	 * @return an Optional containing the record if found, or an empty Optional if
	 *         not found
	 */
	public Optional<V> findByPrimaryKey(final K primaryKey) {
		String sql = "SELECT * FROM " + this.tableName + " WHERE " + this.primaryKeyName + " = ?";
		try (final PreparedStatement statement = this.connection.prepareStatement(sql)) {
			statement.setObject(1, primaryKey);
			final ResultSet resultSet = statement.executeQuery();
			final List<V> object = readObjectFromResultSet(resultSet);
			return object.isEmpty() ? Optional.empty() : Optional.of(object.get(0));
		} catch (final SQLException e) {
			e.printStackTrace();
			return Optional.empty();
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
		StringBuilder sql = new StringBuilder("UPDATE " + this.tableName + " SET ");
		boolean firstField = true;
		for (String fieldName : updatedFields.keySet()) {
			if (!firstField) {
				sql.append(", ");
			}
			sql.append(fieldName).append(" = ?");
			firstField = false;
		}
		sql.append(" WHERE ").append(this.primaryKeyName).append(" = ?");
		try (final PreparedStatement statement = this.connection.prepareStatement(sql.toString())) {
			int parameterIndex = 1;
			for (Object updatedFieldValue : updatedFields.values()) {
				statement.setObject(parameterIndex++, updatedFieldValue);
			}
			statement.setObject(parameterIndex, primaryKey);
			statement.executeUpdate();
			return true;
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
		try {
			if (this.findByPrimaryKey(primaryKey).isEmpty()) {
				return false;
			}
			String sql = "DELETE FROM " + this.tableName + " WHERE " + this.primaryKeyName + " = ?";
			try (final PreparedStatement statement = this.connection.prepareStatement(sql)) {
				statement.setObject(1, primaryKey);
				statement.executeUpdate();
				return true;
			}
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

}
