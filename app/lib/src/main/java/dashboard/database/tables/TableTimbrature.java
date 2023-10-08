package dashboard.database.tables;

import dashboard.database.DoubleKeyTable;
import dashboard.model.Timbratura;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class TableTimbrature extends DoubleKeyTable<Timbratura, Integer, Date> {

	public TableTimbrature(final Connection connection) {
		super(connection);
		this.tableName = "timbrature";
		this.primaryKeyNames.add("idDipendente");
		this.primaryKeyNames.add("entrata");
	}

	@Override
	protected void create() {
		try (final Statement statement = this.connection.createStatement()) {
			statement.executeUpdate(
					"CREATE TABLE " + this.tableName + " (" +
							"idDipendente INT NOT NULL, " +
							"entrata DATETIME NOT NULL, " +
							"uscita DATETIME, " +
							"PRIMARY KEY (idDipendente, entrata), " +
							"FOREIGN KEY (idDipendente) REFERENCES dipendenti(id) ON DELETE CASCADE ON UPDATE CASCADE" +
							")");
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	public void insert(final Timbratura timbratura) {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"INSERT INTO " + this.tableName +
						" (idDipendente, entrata)" +
						" VALUES (?, ?)")) {
			statement.setInt(1, timbratura.getIdDipendente());
			statement.setDate(2, timbratura.getEntrata());
			statement.executeUpdate();
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	protected List<Timbratura> readObjectFromResultSet(final ResultSet resultSet) {
		List<Timbratura> timbrature = new ArrayList<>();
		try {
			while (resultSet.next()) {
				timbrature.add(new Timbratura(
						resultSet.getInt("idDipendente"),
						resultSet.getDate("entrata"),
						resultSet.getDate("uscita")));
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}
		return timbrature;
	}

	@SuppressWarnings("java:S2479")
	public boolean updateUscita(final int idDipendente) {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"UPDATE " + this.tableName +
						" SET uscita = NOW() WHERE" +
						" 	idDipendente = ? AND" +
						" 	entrata = (" +
						"			SELECT MAX(entrata) FROM timbrature WHERE" +
						" 			idDipendente = ? AND" +
						" 			uscita IS NULL" +
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
