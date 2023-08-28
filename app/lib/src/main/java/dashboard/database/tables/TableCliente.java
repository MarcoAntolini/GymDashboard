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

import dashboard.database.SingleKeyTable;
import dashboard.model.Cliente;

public class TableCliente extends SingleKeyTable<Cliente, Integer> {

	public TableCliente(final Connection connection) {
		super(connection);
		this.tableName = "clienti";
		this.primaryKeyName = "id";
	}

	@Override
	public boolean createTable() {
		try (final Statement statement = this.connection.createStatement()) {
			statement.executeUpdate(
					"CREATE TABLE " + this.tableName + " (" +
							"id INT NOT NULL AUTO_INCREMENT, " +
							"codiceFiscale CHAR(16) NOT NULL, " +
							"nome CHAR(40) NOT NULL, " +
							"cognome CHAR(40) NOT NULL, " +
							"dataNascita DATETIME NOT NULL, " +
							"telefono CHAR(10), " +
							"email CHAR(40), " +
							"dataIscrizione DATETIME NOT NULL" +
							"PRIMARY KEY (id), " +
							")");
			return true;
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	@Override
	@SuppressWarnings("java:S3655")
	public boolean save(Cliente cliente) {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"INSERT INTO " + this.tableName
						+ " (codiceFiscale, nome, cognome, dataNascita, telefono, email, dataIscrizione) VALUES (?, ?, ?, ?, ?, ?, ?)")) {
			statement.setString(1, cliente.getCodiceFiscale());
			statement.setString(2, cliente.getNome());
			statement.setString(3, cliente.getCognome());
			statement.setDate(4, cliente.getDataNascita());
			if (cliente.getTelefono().isPresent()) {
				statement.setString(5, cliente.getTelefono().get());
			} else {
				statement.setNull(5, Types.VARCHAR);
			}
			if (cliente.getEmail().isPresent()) {
				statement.setString(6, cliente.getEmail().get());
			} else {
				statement.setNull(6, Types.VARCHAR);
			}
			statement.setDate(7, cliente.getDataIscrizione());
			statement.executeUpdate();
			cliente.setId(this.getLastPrimaryKeyValue());
			return true;
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	@Override
	protected List<Cliente> readObjectFromResultSet(final ResultSet resultSet) {
		List<Cliente> clienti = new ArrayList<>();
		try {
			while (resultSet.next()) {
				final int id = resultSet.getInt("id");
				final String codiceFiscale = resultSet.getString("codiceFiscale");
				final String nome = resultSet.getString("nome");
				final String cognome = resultSet.getString("cognome");
				final Date dataNascita = resultSet.getDate("dataNascita");
				final String telefono = resultSet.getString("telefono");
				final String email = resultSet.getString("email");
				final Date dataIscrizione = resultSet.getDate("dataIscrizione");
				final Cliente cliente = new Cliente(codiceFiscale, nome, cognome, dataNascita, telefono, email,
						dataIscrizione);
				cliente.setId(id);
				clienti.add(cliente);
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}
		return clienti;
	}

	public int getLastPrimaryKeyValue() {
		try (final PreparedStatement statement = this.connection
				.prepareStatement("SELECT MAX(id) FROM " + this.tableName)) {
			final ResultSet resultSet = statement.executeQuery();
			resultSet.next();
			return resultSet.getInt(1);
		} catch (final SQLException e) {
			e.printStackTrace();
			return -1;
		}
	}

}
