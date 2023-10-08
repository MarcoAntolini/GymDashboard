package dashboard.database.tables;

import dashboard.database.SingleKeyTable;
import dashboard.model.Cliente;
import dashboard.model.Persona.Contatto;
import dashboard.model.Persona.Indirizzo;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class TableClienti extends SingleKeyTable<Cliente, Integer> {

	public TableClienti(final Connection connection) {
		super(connection);
		this.tableName = "clienti";
		this.primaryKeyName = "id";
	}

	@Override
	protected void create() {
		try (final Statement statement = this.connection.createStatement()) {
			statement.executeUpdate(
					"CREATE TABLE " + this.tableName + " (" +
							"id INT NOT NULL AUTO_INCREMENT, " +
							"codiceFiscale CHAR(16) NOT NULL, " +
							"nome CHAR(20) NOT NULL, " +
							"cognome CHAR(20) NOT NULL, " +
							"dataNascita DATETIME NOT NULL, " +
							"via CHAR(20), " +
							"numero CHAR(5), " +
							"città CHAR(20), " +
							"provincia CHAR(2), " +
							"telefono CHAR(10), " +
							"email CHAR(20), " +
							"dataIscrizione DATETIME NOT NULL, " +
							"entrateRimaste INT NOT NULL, " +
							"PRIMARY KEY (id)" +
							")");
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	public void insert(final Cliente cliente) {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"INSERT INTO " + this.tableName +
						" (codiceFiscale, nome, cognome, dataNascita, via, numero, città, provincia," +
						" telefono, email, dataIscrizione, entrateRimaste)" +
						" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
				Statement.RETURN_GENERATED_KEYS)) {
			statement.setString(1, cliente.getCodiceFiscale());
			statement.setString(2, cliente.getNome());
			statement.setString(3, cliente.getCognome());
			statement.setDate(4, cliente.getDataNascita());
			statement.setString(5, cliente.getIndirizzo().getVia());
			statement.setString(6, cliente.getIndirizzo().getNumero());
			statement.setString(7, cliente.getIndirizzo().getCitta());
			statement.setString(8, cliente.getIndirizzo().getProvincia());
			statement.setString(9, cliente.getContatto().getTelefono());
			statement.setString(10, cliente.getContatto().getEmail());
			statement.setDate(11, cliente.getDataIscrizione());
			statement.setInt(12, cliente.getEntrateRimaste());
			statement.executeUpdate();
			try (final ResultSet generatedKeys = statement.getGeneratedKeys()) {
				if (generatedKeys.next()) {
					cliente.setId(generatedKeys.getInt(1));
				}
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	// int affectedRows = statement.executeUpdate();
	// if (affectedRows == 0) {
	// throw new SQLException("Inserting data failed, no rows affected.");
	// }
	// try (ResultSet generatedKeys = statement.getGeneratedKeys()) {
	// if (generatedKeys.next()) {
	// return generatedKeys.getInt(1);
	// } else {
	// throw new SQLException("Creating data failed, no ID obtained.");
	// }
	// }
	// } catch (final SQLException e) {
	// e.printStackTrace();
	// return -1;
	// }
	// }

	@Override
	protected List<Cliente> readObjectFromResultSet(final ResultSet resultSet) {
		List<Cliente> clienti = new ArrayList<>();
		try {
			while (resultSet.next()) {
				clienti.add(new Cliente(
						resultSet.getInt("id"),
						resultSet.getString("codiceFiscale"),
						resultSet.getString("nome"),
						resultSet.getString("cognome"),
						resultSet.getDate("dataNascita"),
						new Indirizzo(
								resultSet.getString("via"),
								resultSet.getString("numero"),
								resultSet.getString("città"),
								resultSet.getString("provincia")),
						new Contatto(
								resultSet.getString("telefono"),
								resultSet.getString("email")),
						resultSet.getDate("dataIscrizione"),
						resultSet.getInt("entrateRimaste")));
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}
		return clienti;
	}

}
