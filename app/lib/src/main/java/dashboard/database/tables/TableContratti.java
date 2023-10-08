package dashboard.database.tables;

import dashboard.database.DoubleKeyTable;
import dashboard.model.Contratto;
import dashboard.model.Contratto.TipoContratto;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

public class TableContratti extends DoubleKeyTable<Contratto, Integer, Date> {

	public TableContratti(final Connection connection) {
		super(connection);
		this.tableName = "contratti";
		this.primaryKeyNames.add("idDipendente");
		this.primaryKeyNames.add("dataInizio");
	}

	@Override
	protected void create() {
		try (final Statement statement = this.connection.createStatement()) {
			statement.executeUpdate(
					"CREATE TABLE " + this.tableName + " (" +
							"idDipendente INT NOT NULL, " +
							"tipo CHAR(20) NOT NULL, " +
							"costoOrario DOUBLE NOT NULL, " +
							"dataInizio DATETIME NOT NULL, " +
							"dataFine DATETIME, " +
							"PRIMARY KEY (idDipendente, dataInizio), " +
							"FOREIGN KEY (idDipendente) REFERENCES dipendenti(id) ON DELETE CASCADE ON UPDATE CASCADE" +
							")");
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	public void insert(final Contratto contratto) {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"INSERT INTO " + this.tableName +
						" (idDipendente, tipo, costoOrario, dataInizio, dataFine)" +
						" VALUES (?, ?, ?, ?, ?)")) {
			statement.setInt(1, contratto.getIdDipendente());
			statement.setString(2, contratto.getTipo().toString());
			statement.setDouble(3, contratto.getCostoOrario());
			statement.setDate(4, contratto.getDataInizio());
			if (contratto.getDataFine() == null) {
				statement.setNull(5, Types.DATE);
			} else {
				statement.setDate(5, contratto.getDataFine());
			}
			statement.executeUpdate();
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	protected List<Contratto> readObjectFromResultSet(final ResultSet resultSet) {
		List<Contratto> contratti = new ArrayList<>();
		try {
			while (resultSet.next()) {
				contratti.add(new Contratto(
						resultSet.getInt("idDipendente"),
						resultSet.getDate("dataInizio"),
						resultSet.getDate("dataFine"),
						TipoContratto.valueOf(resultSet.getString("tipo")),
						resultSet.getDouble("costoOrario")));
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return contratti;
	}

}
