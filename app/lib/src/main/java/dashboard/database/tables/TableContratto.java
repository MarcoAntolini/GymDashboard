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

import dashboard.database.DoubleKeyTable;
import dashboard.model.Contratto;
import dashboard.model.Contratto.TipoContratto;

public class TableContratto extends DoubleKeyTable<Contratto, Integer, Date> {

	protected TableContratto(Connection connection) {
		super(connection);
		this.tableName = "contratti";
		this.primaryKeyNames.add("idDipendente");
		this.primaryKeyNames.add("dataInizio");
	}

	@Override
	public boolean createTable() {
		try (final Statement statement = this.connection.createStatement()) {
			statement.executeUpdate(
					"CREATE TABLE " + this.tableName + " (" +
							"idDipendente INT NOT NULL, " +
							"dataInizio DATETIME NOT NULL, " +
							"dataFine DATETIME, " +
							"tipo CHAR(20) NOT NULL, " +
							"costoOrario DOUBLE NOT NULL, " +
							"PRIMARY KEY (idDipendente, dataInizio), " +
							"FOREIGN KEY (idDipendente) REFERENCES dipendenti(id)" +
							")");
			return true;
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	@Override
	@SuppressWarnings("java:S3655")
	public boolean save(Contratto contratto) {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"INSERT INTO " + this.tableName
						+ " (idDipendente, dataInizio, dataFine, tipo, costoOrario) VALUES (?, ?, ?, ?, ?)")) {
			statement.setInt(1, contratto.getIdDipendente());
			statement.setDate(2, contratto.getDataInizio());
			if (contratto.getDataFine().isPresent()) {
				statement.setDate(3, contratto.getDataFine().get());
			} else {
				statement.setNull(3, Types.DATE);
			}
			statement.setString(4, contratto.getTipo().toString());
			statement.setDouble(5, contratto.getCostoOrario());
			statement.executeUpdate();
			return true;
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	@Override
	protected List<Contratto> readObjectFromResultSet(ResultSet resultSet) {
		List<Contratto> contratti = new ArrayList<>();
		try {
			while (resultSet.next()) {
				final int idDipendente = resultSet.getInt("idDipendente");
				final Date dataInizio = resultSet.getDate("dataInizio");
				final Date dataFine = resultSet.getDate("dataFine");
				final TipoContratto tipoContratto = TipoContratto.valueOf(resultSet.getString("tipo"));
				final double costoOrario = resultSet.getDouble("costoOrario");
				final Contratto contratto = new Contratto(idDipendente, dataInizio, dataFine, tipoContratto, costoOrario);
				contratti.add(contratto);
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return contratti;
	}

}
