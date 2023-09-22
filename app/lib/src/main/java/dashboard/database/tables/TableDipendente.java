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
import dashboard.model.Dipendente;

public class TableDipendente extends SingleKeyTable<Dipendente, Integer> {

	protected TableDipendente(Connection connection) {
		super(connection);
		this.tableName = "dipendenti";
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
							"dataAssunzione DATETIME NOT NULL" +
							"stipendio DOUBLE NOT NULL" +
							"PRIMARY KEY (id)" +
							")");
			return true;
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	@Override
	@SuppressWarnings("java:S3655")
	public boolean save(Dipendente dipendente) {
		try (final PreparedStatement statement = this.connection.prepareStatement("INSERT INTO " + this.tableName
				+ " (codiceFiscale, nome, cognome, dataNascita, telefono, email, dataAssunzione, stipendio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")) {
			statement.setString(1, dipendente.getCodiceFiscale());
			statement.setString(2, dipendente.getNome());
			statement.setString(3, dipendente.getCognome());
			statement.setDate(4, dipendente.getDataNascita());
			if (dipendente.getTelefono().isPresent()) {
				statement.setString(5, dipendente.getTelefono().get());
			} else {
				statement.setNull(5, Types.VARCHAR);
			}
			if (dipendente.getEmail().isPresent()) {
				statement.setString(6, dipendente.getEmail().get());
			} else {
				statement.setNull(6, Types.VARCHAR);
			}
			statement.setDate(7, dipendente.getDataAssunzione());
			statement.setDouble(8, dipendente.getStipendio());
			statement.executeUpdate();
			dipendente.setId(this.getLastId());
			return true;
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
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
				Dipendente dipendente = new Dipendente(
						codiceFiscale, nome, cognome, dataNascita, telefono, email, dataAssunzione, stipendio);
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
