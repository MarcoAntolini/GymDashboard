package dashboard;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertIterableEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
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
			Utils.buildSqlDate(2021, 1, 1)).addEmail("johndoe@gmail.com");
	final Cliente cliente2 = new Cliente("987654321098765", "Jane", "Smith", Utils.buildSqlDate(1995, 5, 10),
			"1234567890", "janesmith@gmail.com", Utils.buildSqlDate(2021, 1, 1));

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
		assertTrue(table.save(cliente2));
	}

	@Test
	void updateTest() {
		table.save(cliente2);
		final Cliente updatedCliente2 = new Cliente("987654321098765", "Jonny", "Smith",
				Utils.buildSqlDate(1995, 5, 10), "1234567890", "janesmith@gmail.com",
				Utils.buildSqlDate(2023, 1, 1));
		assertTrue(table.update(2,
				Map.of("codiceFiscale", "987654321098765", "nome", "Jonny", "cognome", "Smith", "dataNascita",
						Utils.buildSqlDate(1995, 5, 10), "telefono", "1234567890", "email", "janesmith@gmail.com",
						"dataIscrizione", Utils.buildSqlDate(2023, 1, 1))));
		final Optional<Cliente> foundCliente = table.findByPrimaryKey(updatedCliente2.getId());
		assertFalse(foundCliente.isEmpty());
		assertEquals(updatedCliente2.getDataNascita(), foundCliente.get().getDataNascita());
	}

	@Test
	void deleteTest() {
		table.save(cliente1);
		assertTrue(table.delete(cliente1.getId()));
		assertFalse(table.delete(cliente1.getId()));
		assertTrue(table.findByPrimaryKey(cliente1.getId()).isEmpty());
	}

	@Test
	void findByPrimaryKeyTest() {
		table.save(cliente1);
		table.save(cliente2);
		assertEquals(cliente1, table.findByPrimaryKey(cliente1.getId()).orElse(null));
		assertEquals(cliente2, table.findByPrimaryKey(cliente2.getId()).orElse(null));
	}

	@Test
	void findAllTest() {
		table.save(cliente1);
		table.save(cliente2);
		assertIterableEquals(
				List.of(cliente1, cliente2),
				table.findAll());
	}

}
