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
import java.util.Objects;
import java.util.Optional;

import dashboard.database.Table;
import dashboard.model.Customer;

public final class CustomersTable implements Table<Customer, Integer> {

	public static final String TABLE_NAME = "customers";

	private final Connection connection;

	public CustomersTable(final Connection connection) {
		this.connection = Objects.requireNonNull(connection);
	}

	@Override
	public String getTableName() {
		return TABLE_NAME;
	}

	@Override
	public boolean createTable() {
		try (final Statement statement = this.connection.createStatement()) {
			statement.executeUpdate(
					"CREATE TABLE " + TABLE_NAME + " (" +
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
	public Optional<Customer> findByPrimaryKey(final Integer id) {
		try (final Statement statement = this.connection.createStatement()) {
			final ResultSet resultSet = statement.executeQuery("SELECT * FROM " + TABLE_NAME + " WHERE id = " + id);
			final List<Customer> customers = readCustomersFromResultSet(resultSet);
			return customers.isEmpty() ? Optional.empty() : Optional.of(customers.get(0));
		} catch (final SQLException e) {
			e.printStackTrace();
			return Optional.empty();
		}
	}

	/**
	 * Given a ResultSet read all the customers in it and collects them in a List
	 * 
	 * @param resultSet a ResultSet from which the Customer(s) will be extracted
	 * @return a List of all the customers in the ResultSet
	 */
	private List<Customer> readCustomersFromResultSet(final ResultSet resultSet) {
		List<Customer> customers = new ArrayList<>();
		try {
			while (resultSet.next()) {
				int id = resultSet.getInt("id");
				String firstName = resultSet.getString("firstName");
				String lastName = resultSet.getString("lastName");
				Date birthday = resultSet.getDate("birthday");
				Customer customer = new Customer(id, firstName, lastName, Optional.of(birthday));
				customers.add(customer);
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}
		return customers;
	}

	@Override
	public List<Customer> findAll() {
		try (final Statement statement = this.connection.createStatement()) {
			final ResultSet resultSet = statement.executeQuery("SELECT * FROM " + TABLE_NAME);
			return readCustomersFromResultSet(resultSet);
		} catch (final SQLException e) {
			e.printStackTrace();
			return List.of();
		}
	}

	public List<Customer> findByBirthday(final Date date) {
		try (final Statement statement = this.connection.createStatement()) {
			final ResultSet resultSet = statement
					.executeQuery("SELECT * FROM " + TABLE_NAME + " WHERE birthday = " + date);
			return readCustomersFromResultSet(resultSet);
		} catch (final SQLException e) {
			e.printStackTrace();
			return List.of();
		}
	}

	@Override
	public boolean dropTable() {
		try (final Statement statement = this.connection.createStatement()) {
			statement.executeUpdate("DROP TABLE " + TABLE_NAME);
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
				"INSERT INTO " + TABLE_NAME + " VALUES (?, ?, ?, ?)")) {
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

	@Override
	public boolean delete(final Integer id) {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"DELETE FROM " + TABLE_NAME + " WHERE id = ?")) {
			statement.setInt(1, id);
			return true;
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	@Override
	@SuppressWarnings("java:S3655")
	public boolean update(final Customer customer) {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"UPDATE " + TABLE_NAME + " SET firstName = ?, lastName = ?, birthday = ? WHERE id = ?")) {
			statement.setString(1, customer.getFirstName());
			statement.setString(2, customer.getLastName());
			if (customer.getBirthday().isPresent()) {
				statement.setDate(3, customer.getBirthday().get());
			} else {
				statement.setNull(3, Types.DATE);
			}
			statement.setInt(4, customer.getId());
			statement.executeUpdate();
			return true;
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

}
