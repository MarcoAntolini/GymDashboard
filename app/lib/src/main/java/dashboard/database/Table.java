package dashboard.database;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

public abstract class Table<V, K> {

	protected String tableName;
	protected String primaryKeyName;

	protected final Connection connection;

	protected Table(final Connection connection) {
		this.connection = Objects.requireNonNull(connection);
	}

	public String getTableName() {
		return this.tableName;
	}

	public boolean dropTable() {
		try (final Statement statement = this.connection.createStatement()) {
			statement.executeUpdate("DROP TABLE " + this.tableName);
			return true;
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	public List<V> findAll() {
		try (final PreparedStatement statement = this.connection.prepareStatement("SELECT * FROM " + this.tableName)) {
			final ResultSet resultSet = statement.executeQuery();
			return readObjectFromResultSet(resultSet);
		} catch (final SQLException e) {
			e.printStackTrace();
			return List.of();
		}
	}

	public Optional<V> findByPrimaryKey(final K primaryKey) {
		try (final PreparedStatement statement = this.connection
				.prepareStatement("SELECT * FROM " + this.tableName + " WHERE " + this.primaryKeyName + " = ?")) {
			statement.setObject(1, primaryKey);
			final ResultSet resultSet = statement.executeQuery();
			final List<V> object = readObjectFromResultSet(resultSet);
			return object.isEmpty() ? Optional.empty() : Optional.of(object.get(0));
		} catch (final SQLException e) {
			e.printStackTrace();
			return Optional.empty();
		}
	}

	public boolean update(int objectPrimaryKey, Map<String, Object> updatedFields) {
		StringBuilder sql = new StringBuilder("UPDATE " + this.tableName + " SET ");
		boolean firstField = true;
		for (String fieldName : updatedFields.keySet()) {
			if (!firstField) {
				sql.append(", ");
			}
			sql.append(fieldName).append(" = ?");
			firstField = false;
		}
		sql.append(" WHERE " + this.primaryKeyName + " = ?");
		try (PreparedStatement statement = this.connection.prepareStatement(sql.toString())) {
			int parameterIndex = 1;
			for (Object value : updatedFields.values()) {
				statement.setObject(parameterIndex++, value);
			}
			statement.setObject(parameterIndex, objectPrimaryKey);
			statement.executeUpdate();
			return true;
		} catch (SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	public boolean delete(final K primaryKey) {
		try {
			if (this.findByPrimaryKey(primaryKey).isEmpty()) {
				return false;
			}
			try (final PreparedStatement statement = this.connection.prepareStatement(
					"DELETE FROM " + this.tableName + " WHERE id = ?")) {
				statement.setObject(1, primaryKey);
				statement.executeUpdate();
				return true;
			}
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	public abstract boolean createTable();

	public abstract boolean save(final V value);

	protected abstract List<V> readObjectFromResultSet(final ResultSet resultSet);

}
