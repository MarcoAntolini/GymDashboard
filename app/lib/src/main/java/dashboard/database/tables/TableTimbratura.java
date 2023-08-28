package dashboard.database.tables;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import dashboard.database.DoubleKeyTable;
import dashboard.model.Timbratura;

public class TableTimbratura extends DoubleKeyTable<Timbratura, Integer, Date> {

	protected TableTimbratura(Connection connection) {
		super(connection);
		this.tableName = "timbrature";
		this.primaryKeyNames.add("idDipendente");
		this.primaryKeyNames.add("entrata");
	}

	@Override
	public boolean createTable() {
		try (final Statement statement = this.connection.createStatement()) {
			statement.executeUpdate(
					"CREATE TABLE " + this.tableName + " (" +
							"idDipendente INT NOT NULL, " +
							"entrata DATETIME NOT NULL, " +
							"uscita DATETIME, " +
							"PRIMARY KEY (idDipendente, entrata), " +
							"FOREIGN KEY (idDipendente) REFERENCES dipendenti(id)" +
							")");
			return true;
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	@Override
	public boolean save(Timbratura value) {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"INSERT INTO " + this.tableName + " (idDipendente, entrata) VALUES (?, ?)")) {
			statement.setInt(1, value.getIdDipendente());
			statement.setDate(2, value.getEntrata());
			statement.executeUpdate();
			return true;
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	@Override
	protected List<Timbratura> readObjectFromResultSet(ResultSet resultSet) {
		List<Timbratura> timbrature = new ArrayList<>();
		try {
			while (resultSet.next()) {
				int idDipendente = resultSet.getInt("idDipendente");
				Date entrata = resultSet.getDate("entrata");
				Date uscita = resultSet.getDate("uscita");
				Timbratura timbratura = new Timbratura(idDipendente, entrata);
				if (uscita != null) {
					timbratura.setUscita(uscita);
				}
				timbrature.add(timbratura);
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}
		return timbrature;
	}

	public boolean updateUscita(int idDipendente) {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"UPDATE " + this.tableName + " SET uscita = NOW() WHERE idDipendente = ? AND entrata = (" +
						"SELECT MAX(entrata) FROM timbrature WHERE idDipendente = ? AND uscita IS NULL" +
						");")) {
			statement.setInt(1, idDipendente);
			statement.setInt(2, idDipendente);
			statement.executeUpdate();
			return true;
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

}
