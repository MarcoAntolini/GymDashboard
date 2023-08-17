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
import dashboard.model.Cliente;

public class TableCliente extends Table<Cliente, Integer> {

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
							"id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, " +
							"codiceFiscale CHAR(16) NOT NULL, " +
							"nome CHAR(40), " +
							"cognome CHAR(40), " +
							"dataNascita DATETIME, " +
							"telefono CHAR(10), " +
							"email CHAR(40), " +
							"dataIscrizione DATETIME" +
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
				final String codiceFiscale = resultSet.getString("codiceFiscale");
				final String nome = resultSet.getString("nome");
				final String cognome = resultSet.getString("cognome");
				final Date dataNascita = resultSet.getDate("dataNascita");
				final Optional<String> telefono = resultSet.getString("telefono") == null ? Optional.empty()
						: Optional.of(resultSet.getString("telefono"));
				final Optional<String> email = resultSet.getString("email") == null ? Optional.empty()
						: Optional.of(resultSet.getString("email"));
				final Date dataIscrizione = resultSet.getDate("dataIscrizione");
				final Cliente cliente = new Cliente(codiceFiscale, nome, cognome, dataNascita, telefono, email,
						dataIscrizione);
				clienti.add(cliente);
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}
		return clienti;
	}

}
