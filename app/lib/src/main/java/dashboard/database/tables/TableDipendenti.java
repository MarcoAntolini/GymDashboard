package dashboard.database.tables;

import dashboard.database.SingleKeyTable;
import dashboard.model.Dipendente;
import dashboard.model.Persona.Contatto;
import dashboard.model.Persona.Indirizzo;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class TableDipendenti extends SingleKeyTable<Dipendente, Integer> {

	public TableDipendenti(final Connection connection) {
		super(connection);
		this.tableName = "dipendenti";
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
							"dataAssunzione DATETIME NOT NULL, " +
							"PRIMARY KEY (id)" +
							")");
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	@SuppressWarnings("java:S3655")
	public void insert(final Dipendente dipendente) {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"INSERT INTO " + this.tableName +
						" (codiceFiscale, nome, cognome, dataNascita, via, numero, città, provincia," +
						" telefono, email, dataAssunzione)" +
						" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
				Statement.RETURN_GENERATED_KEYS)) {
			statement.setString(1, dipendente.getCodiceFiscale());
			statement.setString(2, dipendente.getNome());
			statement.setString(3, dipendente.getCognome());
			statement.setDate(4, dipendente.getDataNascita());
			statement.setString(5, dipendente.getIndirizzo().getVia());
			statement.setString(6, dipendente.getIndirizzo().getNumero());
			statement.setString(7, dipendente.getIndirizzo().getCitta());
			statement.setString(8, dipendente.getIndirizzo().getProvincia());
			statement.setString(9, dipendente.getContatto().getTelefono());
			statement.setString(10, dipendente.getContatto().getEmail());
			statement.setDate(11, dipendente.getDataAssunzione());
			statement.executeUpdate();
			try (final ResultSet generatedKeys = statement.getGeneratedKeys()) {
				if (generatedKeys.next()) {
					dipendente.setId(generatedKeys.getInt(1));
				}
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	protected List<Dipendente> readObjectFromResultSet(final ResultSet resultSet) {
		List<Dipendente> dipendenti = new ArrayList<>();
		try {
			while (resultSet.next()) {
				dipendenti.add(new Dipendente(
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
						resultSet.getDate("dataAssunzione")));
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return dipendenti;
	}

}
