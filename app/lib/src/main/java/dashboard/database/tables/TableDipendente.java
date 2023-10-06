package dashboard.database.tables;

import dashboard.database.SingleKeyTable;
import dashboard.model.Dipendente;
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

public class TableDipendente extends SingleKeyTable<Dipendente, Integer> {

	public TableDipendente(Connection connection) {
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
							"nome CHAR(40) NOT NULL, " +
							"cognome CHAR(40) NOT NULL, " +
							"dataNascita DATETIME NOT NULL, " +
							"telefono CHAR(10), " +
							"email CHAR(40), " +
							"via CHAR(40), " +
							"numero CHAR(5), " +
							"città CHAR(40), " +
							"provincia CHAR(2), " +
							"dataAssunzione DATETIME NOT NULL" +
							"stipendio DOUBLE NOT NULL" +
							"PRIMARY KEY (id)" +
							")");
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	@SuppressWarnings("java:S3655")
	public void insert(Dipendente dipendente) {
		try (final PreparedStatement statement = this.connection.prepareStatement("INSERT INTO " + this.tableName +
				" (codiceFiscale, nome, cognome, dataNascita, telefono, email, via, numero, città, provincia, dataAssunzione, stipendio)"
				+ " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")) {
			statement.setString(1, dipendente.getCodiceFiscale());
			statement.setString(2, dipendente.getNome());
			statement.setString(3, dipendente.getCognome());
			statement.setDate(4, dipendente.getDataNascita());
			statement.setString(5, dipendente.getContatto().getTelefono());
			statement.setString(6, dipendente.getContatto().getEmail());
			statement.setString(7, dipendente.getIndirizzo().getVia());
			statement.setString(8, dipendente.getIndirizzo().getNumero());
			statement.setString(9, dipendente.getIndirizzo().getCitta());
			statement.setString(10, dipendente.getIndirizzo().getProvincia());
			statement.setDate(11, dipendente.getDataAssunzione());
			statement.setDouble(12, dipendente.getStipendio());
			statement.executeUpdate();
			dipendente.setId(this.getLastId());
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	protected List<Dipendente> readObjectFromResultSet(ResultSet resultSet) {
		List<Dipendente> dipendenti = new ArrayList<>();
		try {
			while (resultSet.next()) {
				final int id = resultSet.getInt("id");
				final String codiceFiscale = resultSet.getString("codiceFiscale");
				final String nome = resultSet.getString("nome");
				final String cognome = resultSet.getString("cognome");
				final Date dataNascita = resultSet.getDate("dataNascita");
				final Date dataAssunzione = resultSet.getDate("dataAssunzione");
				final double stipendio = resultSet.getDouble("stipendio");
				final String telefono = resultSet.getString("telefono");
				final String email = resultSet.getString("email");
				final Contatto contatto = new Contatto(telefono, email);
				final String via = resultSet.getString("via");
				final String numero = resultSet.getString("numero");
				final String citta = resultSet.getString("città");
				final String provincia = resultSet.getString("provincia");
				final Indirizzo indirizzo = new Indirizzo(via, numero, citta, provincia);
				final Dipendente dipendente = new Dipendente(
						codiceFiscale, nome, cognome, dataNascita, indirizzo, contatto, dataAssunzione, stipendio);
				dipendente.setId(id);
				dipendenti.add(dipendente);
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return dipendenti;
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
