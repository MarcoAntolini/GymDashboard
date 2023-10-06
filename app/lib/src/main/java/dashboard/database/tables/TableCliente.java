package dashboard.database.tables;

import dashboard.database.SingleKeyTable;
import dashboard.model.Cliente;
import dashboard.model.Persona.Contatto;
import dashboard.model.Persona.Indirizzo;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class TableCliente extends SingleKeyTable<Cliente, Integer> {

	public TableCliente(final Connection connection) {
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
							"nome CHAR(40) NOT NULL, " +
							"cognome CHAR(40) NOT NULL, " +
							"dataNascita DATETIME NOT NULL, " +
							"telefono CHAR(10), " +
							"email CHAR(40), " +
							"via CHAR(40), " +
							"numero CHAR(5), " +
							"città CHAR(40), " +
							"provincia CHAR(2), " +
							"dataIscrizione DATETIME NOT NULL, " +
							"PRIMARY KEY (id)" +
							")");
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	@SuppressWarnings("java:S3655")
	public void insert(Cliente cliente) {
		try (final PreparedStatement statement = this.connection.prepareStatement("INSERT INTO " + this.tableName +
				" (codiceFiscale, nome, cognome, dataNascita, telefono, email, via, numero, città, provincia, dataIscrizione)" +
				" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", Statement.RETURN_GENERATED_KEYS)) {
			statement.setString(1, cliente.getCodiceFiscale());
			statement.setString(2, cliente.getNome());
			statement.setString(3, cliente.getCognome());
			statement.setDate(4, cliente.getDataNascita());
			statement.setString(5, cliente.getContatto().getTelefono());
			statement.setString(6, cliente.getContatto().getEmail());
			statement.setString(7, cliente.getIndirizzo().getVia());
			statement.setString(8, cliente.getIndirizzo().getNumero());
			statement.setString(9, cliente.getIndirizzo().getCitta());
			statement.setString(10, cliente.getIndirizzo().getProvincia());
			statement.setDate(11, cliente.getDataIscrizione());
			statement.executeUpdate();
			cliente.setId(this.getLastId());
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	public int insertAndGetId(Cliente cliente) {
		try (final PreparedStatement statement = this.connection.prepareStatement("INSERT INTO " + this.tableName +
				" (codiceFiscale, nome, cognome, dataNascita, telefono, email, via, numero, città, provincia, dataIscrizione)" +
				" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
				Statement.RETURN_GENERATED_KEYS)) {
			statement.setString(1, cliente.getCodiceFiscale());
			statement.setString(2, cliente.getNome());
			statement.setString(3, cliente.getCognome());
			statement.setDate(4, cliente.getDataNascita());
			statement.setString(5, cliente.getContatto().getTelefono());
			statement.setString(6, cliente.getContatto().getEmail());
			statement.setString(7, cliente.getIndirizzo().getVia());
			statement.setString(8, cliente.getIndirizzo().getNumero());
			statement.setString(9, cliente.getIndirizzo().getCitta());
			statement.setString(10, cliente.getIndirizzo().getProvincia());
			statement.setDate(11, cliente.getDataIscrizione());
			int affectedRows = statement.executeUpdate();
			if (affectedRows == 0) {
				throw new SQLException("Inserting data failed, no rows affected.");
			}
			try (ResultSet generatedKeys = statement.getGeneratedKeys()) {
				if (generatedKeys.next()) {
					return generatedKeys.getInt(1);
				} else {
					throw new SQLException("Creating data failed, no ID obtained.");
				}
			}
		} catch (final SQLException e) {
			e.printStackTrace();
			return -1;
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
				final Contatto contatto = new Contatto(telefono, email);
				final String via = resultSet.getString("via");
				final String numero = resultSet.getString("numero");
				final String citta = resultSet.getString("città");
				final String provincia = resultSet.getString("provincia");
				final Indirizzo indirizzo = new Indirizzo(via, numero, citta, provincia);
				final Date dataIscrizione = resultSet.getDate("dataIscrizione");
				Cliente cliente = new Cliente(codiceFiscale, nome, cognome, dataNascita, indirizzo, contatto, dataIscrizione);
				cliente.setId(id);
				clienti.add(cliente);
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}
		return clienti;
	}

	public int getLastId() {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"SELECT MAX(id) FROM " + this.tableName)) {
			final ResultSet resultSet = statement.executeQuery();
			resultSet.next();
			return resultSet.getInt(1);
		} catch (final SQLException e) {
			e.printStackTrace();
			return -1;
		}
	}

}
