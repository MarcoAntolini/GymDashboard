package dashboard.database.tables;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import dashboard.database.Table;
import dashboard.model.Customer;

public final class CustomersTable extends Table<Customer, Integer> {

	public CustomersTable(final Connection connection) {
		super(connection);
		this.tableName = "customers";
		this.primaryKeyName = "id";
	}

	@Override
	public boolean createTable() {
		try (final Statement statement = this.connection.createStatement()) {
			statement.executeUpdate(
					"CREATE TABLE " + this.tableName + " (" +
							"id INT NOT NULL PRIMARY KEY," +
							"firstName CHAR(40)," +
							"lastName CHAR(40)," +
							"birthday DATETIME" +
							")");
			return true;
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	@Override
	@SuppressWarnings("java:S3655")
	public boolean save(final Customer customer) {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"INSERT INTO " + this.tableName + " VALUES (?, ?, ?, ?)")) {
			statement.setInt(1, customer.getId());
			statement.setString(2, customer.getFirstName());
			statement.setString(3, customer.getLastName());
			if (customer.getBirthday().isPresent()) {
				statement.setDate(4, customer.getBirthday().get());
			} else {
				statement.setNull(4, Types.DATE);
			}
			statement.executeUpdate();
			return true;
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	public List<Customer> findByBirthday(final Date date) {
		try (final PreparedStatement statement = this.connection
				.prepareStatement("SELECT * FROM " + this.tableName + " WHERE birthday = ?")) {
			statement.setDate(1, date);
			final ResultSet resultSet = statement.executeQuery();
			return readObjectFromResultSet(resultSet);
		} catch (final SQLException e) {
			e.printStackTrace();
			return List.of();
		}
	}

	@Override
	protected List<Customer> readObjectFromResultSet(final ResultSet resultSet) {
		List<Customer> customers = new ArrayList<>();
		try {
			while (resultSet.next()) {
				int id = resultSet.getInt("id");
				String firstName = resultSet.getString("firstName");
				String lastName = resultSet.getString("lastName");
				Optional<Date> birthday = resultSet.getDate("birthday") == null ? Optional.empty()
						: Optional.of(resultSet.getDate("birthday"));
				Customer customer = new Customer(id, firstName, lastName, birthday);
				customers.add(customer);
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}
		return customers;
	}

}
