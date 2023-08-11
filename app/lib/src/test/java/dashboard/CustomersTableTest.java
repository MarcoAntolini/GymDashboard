package dashboard;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertIterableEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import dashboard.database.ConnectionProvider;
import dashboard.database.tables.CustomersTable;
import dashboard.model.Customer;
import dashboard.utils.Utils;

class CustomersTableTest {

	static final String USERNAME = "root";
	static final String PASSWORD = "";
	static final String DATABASE_NAME = "test-db";

	static final ConnectionProvider connectionProvider = new ConnectionProvider(USERNAME, PASSWORD, DATABASE_NAME);
	static final CustomersTable customersTable = new CustomersTable(connectionProvider.getMySQLConnection());

	final Customer customer1 = new Customer(1, "Giacomo", "Cavalieri", Utils.buildSqlDate(11, 10, 1998));
	final Customer customer2 = new Customer(2, "Tommaso", "Cavalieri");

	@BeforeEach
	void setUp() throws Exception {
		customersTable.dropTable();
		customersTable.createTable();
	}

	@AfterEach
	void tearDown() throws Exception {
		customersTable.dropTable();
	}

	@Test
	void creationAndDropTest() {
		assertTrue(customersTable.dropTable());
		assertFalse(customersTable.dropTable());
		assertTrue(customersTable.createTable());
		assertFalse(customersTable.createTable());
	}

	@Test
	void saveTest() {
		assertTrue(customersTable.save(customer1));
		assertFalse(customersTable.save(customer1));
		assertTrue(customersTable.save(customer2));
	}

	@Test
	void updateTest() {
		assertFalse(customersTable.update(customer1));
		customersTable.save(customer2);
		final Customer updatedCustomer2 = new Customer(2, "Tommaso", "Cavalieri", Utils.buildSqlDate(11, 10, 1998));
		assertTrue(customersTable.update(updatedCustomer2));
		final Optional<Customer> foundCustomer = customersTable.findByPrimaryKey(updatedCustomer2.getId());
		assertFalse(foundCustomer.isEmpty());
		assertEquals(updatedCustomer2.getBirthday(), foundCustomer.get().getBirthday());
	}

	@Test
	void deleteTest() {
		customersTable.save(customer1);
		assertTrue(customersTable.delete(customer1.getId()));
		assertFalse(customersTable.delete(customer1.getId()));
		assertTrue(customersTable.findByPrimaryKey(customer1.getId()).isEmpty());
	}

	@Test
	void findByPrimaryKeyTest() {
		customersTable.save(customer1);
		customersTable.save(customer2);
		assertEquals(customer1, customersTable.findByPrimaryKey(customer1.getId()).orElse(null));
		assertEquals(customer2, customersTable.findByPrimaryKey(customer2.getId()).orElse(null));
	}

	@Test
	void findAllTest() {
		customersTable.save(customer1);
		customersTable.save(customer2);
		assertIterableEquals(
				List.of(customer1, customer2),
				customersTable.findAll());
	}

	@Test
	void findByBirthdayTest() {
		final Customer customer3 = new Customer(3, "Pietro", "Rossi", Utils.buildSqlDate(11, 10, 1998));
		customersTable.save(customer1);
		customersTable.save(customer2);
		customersTable.save(customer3);
		assertIterableEquals(
				List.of(customer1, customer3),
				customersTable.findByBirthday(Utils.buildSqlDate(11, 10, 1998).get()));
	}

}
