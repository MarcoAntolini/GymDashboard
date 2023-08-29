package dashboard.database;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * An abstract class that represents a table with two primary keys.
 * 
 * @param <V>  the type of the values stored in the table
 * @param <K1> the type of the first primary key
 * @param <K2> the type of the second primary key
 */
public abstract class DoubleKeyTable<V, K1, K2> extends Table<V, K1> {

	protected final ArrayList<String> primaryKeyNames;

	/**
	 * Constructs a new Table object with the given database connection.
	 *
	 * @param connection the database connection to use
	 */
	protected DoubleKeyTable(Connection connection) {
		super(connection);
		this.primaryKeyNames = new ArrayList<>();
	}

	/**
	 * Finds a record in the table by its primary keys.
	 *
	 * @param primaryKey1 the first primary key of the record to find
	 * @param primaryKey2 the second primary key of the record to find
	 * @return an Optional containing the record if found, or an empty Optional if
	 *         not found
	 */
	public Optional<V> findByPrimaryKeys(final K1 primaryKey1, final K2 primaryKey2) {
		String sql = "SELECT * FROM " + this.tableName + " WHERE " + this.primaryKeyNames.get(0) + " = ? AND "
				+ this.primaryKeyNames.get(1) + " = ?";
		try (final PreparedStatement statement = this.connection.prepareStatement(sql)) {
			statement.setObject(1, primaryKey1);
			statement.setObject(2, primaryKey2);
			final ResultSet resultSet = statement.executeQuery();
			final List<V> object = readObjectFromResultSet(resultSet);
			return object.isEmpty() ? Optional.empty() : Optional.of(object.get(0));
		} catch (final SQLException e) {
			e.printStackTrace();
			return Optional.empty();
		}
	}

	/**
	 * Updates the object with the given primary keys in the table with the given
	 * updated fields.
	 *
	 * @param primaryKey1   the first primary key of the object to update
	 * @param primaryKey2   the second primary key of the object to update
	 * @param updatedFields a map of field names to updated values
	 * @return true if the object was updated successfully, false otherwise
	 */
	public boolean update(final K1 primaryKey1, final K2 primaryKey2, final Map<String, Object> updatedFields) {
		StringBuilder sql = new StringBuilder("UPDATE " + this.tableName + " SET ");
		boolean firstField = true;
		for (String fieldName : updatedFields.keySet()) {
			if (!firstField) {
				sql.append(", ");
			}
			sql.append(fieldName).append(" = ?");
			firstField = false;
		}
		sql.append(" WHERE ").append(this.primaryKeyNames.get(0)).append(" = ? AND ")
				.append(this.primaryKeyNames.get(1)).append(" = ?");
		try (final PreparedStatement statement = this.connection.prepareStatement(sql.toString())) {
			int parameterIndex = 1;
			for (Object updatedFieldValue : updatedFields.values()) {
				statement.setObject(parameterIndex++, updatedFieldValue);
			}
			statement.setObject(parameterIndex++, primaryKey1);
			statement.setObject(parameterIndex, primaryKey2);
			statement.executeUpdate();
			return true;
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	/**
	 * Deletes the object with the given primary keys from the table.
	 *
	 * @param primaryKey1 the first primary key of the object to delete
	 * @param primaryKey2 the second primary key of the object to delete
	 * @return true if the object was deleted successfully, false otherwise
	 */
	public boolean delete(final K1 primaryKey1, K2 primaryKey2) {
		try {
			if (this.findByPrimaryKeys(primaryKey1, primaryKey2).isEmpty()) {
				return false;
			}
			String sql = "DELETE FROM " + this.tableName + " WHERE " + this.primaryKeyNames.get(0) + " = ? AND "
					+ this.primaryKeyNames.get(1) + " = ?";
			try (final PreparedStatement statement = this.connection.prepareStatement(sql)) {
				statement.setObject(1, primaryKey1);
				statement.setObject(2, primaryKey2);
				statement.executeUpdate();
				return true;
			}
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

}
