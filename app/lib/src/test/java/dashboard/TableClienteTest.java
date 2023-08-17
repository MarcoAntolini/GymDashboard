package dashboard;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import dashboard.database.ConnectionProvider;
import dashboard.database.tables.TableCliente;
import dashboard.model.Cliente;
import dashboard.utils.Utils;

class TableClienteTest {

	static final String USERNAME = "root";
	static final String PASSWORD = "";
	static final String DATABASE_NAME = "gym-dashboard";

	static final ConnectionProvider connectionProvider = new ConnectionProvider(USERNAME, PASSWORD, DATABASE_NAME);
	static final TableCliente table = new TableCliente(connectionProvider.getMySQLConnection());

	final Cliente cliente1 = new Cliente("123456789012345", "John", "Doe", Utils.buildSqlDate(1990, 1, 1),
			Utils.buildSqlDate(2021, 1, 1));
	final Cliente cliente2 = new Cliente("987654321098765", "Jane", "Smith", Utils.buildSqlDate(1995, 5, 10),
			Optional.of("1234567890"), Optional.of("janesmith@gmail.com"), Utils.buildSqlDate(2021, 1, 1));

	@BeforeEach
	void setUp() throws Exception {
		table.dropTable();
		table.createTable();
	}

	@AfterEach
	void tearDown() throws Exception {
		table.dropTable();
	}

	@Test
	void creationAndDropTest() {
		assertTrue(table.dropTable());
		assertFalse(table.dropTable());
		assertTrue(table.createTable());
		assertFalse(table.createTable());
	}

	@Test
	void saveTest() {
		assertTrue(table.save(cliente1));
		// assertFalse(table.save(cliente1));
		assertTrue(table.save(cliente2));
	}

	// @Test
	// void findByPrimaryKeyTest() {
	// Cliente cliente = new Cliente("1234567890123456", "John", "Doe",
	// Utils.buildSqlDate(1990, 1, 1));
	// assertTrue(table.save(cliente));

	// assertEquals(cliente,
	// table.findByPrimaryKey(cliente.getCodiceFiscale()).orElse(null));
	// }

	// @Test
	// void findAllTest() {
	// Cliente cliente1 = new Cliente("1234567890123456", "John", "Doe",
	// Utils.buildSqlDate(1990, 1, 1));
	// Cliente cliente2 = new Cliente("9876543210987654", "Jane", "Smith",
	// Utils.buildSqlDate(1995, 5, 10));
	// assertTrue(table.save(cliente1));
	// assertTrue(table.save(cliente2));

	// assertIterableEquals(
	// List.of(cliente1, cliente2),
	// table.findAll());
	// }

}
