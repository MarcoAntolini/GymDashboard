package dashboard.database.tables;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

import dashboard.database.Table;
import dashboard.model.Dipendente;

public class TableDipendente extends Table<Dipendente, Integer> {

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
							"id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, " +
							"codiceFiscale CHAR(16) NOT NULL, " +
							"nome CHAR(40), " +
							"cognome CHAR(40), " +
							"dataNascita DATETIME, " +
							"telefono CHAR(10), " +
							"email CHAR(40), " +
							"dataAssunzione DATETIME" +
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
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"INSERT INTO " + this.tableName
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
			statement.setInt(8, dipendente.getStipendio());
			statement.executeUpdate();
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
				final Dipendente dipendente = new Dipendente(
						resultSet.getString("codiceFiscale"),
						resultSet.getString("nome"),
						resultSet.getString("cognome"),
						resultSet.getDate("dataNascita"),
						resultSet.getDate("dataAssunzione"),
						resultSet.getInt("stipendio"));
				if (resultSet.getString("telefono") != null) {
					dipendente.setTelefono(resultSet.getString("telefono"));
				}
				if (resultSet.getString("email") != null) {
					dipendente.setEmail(resultSet.getString("email"));
				}
				dipendente.setId(resultSet.getInt("id"));
				dipendenti.add(dipendente);
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return dipendenti;
	}

}
