package dashboard.database.tables;

import dashboard.database.DoubleKeyTable;
import dashboard.model.Acquisto;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class TableAcquisti extends DoubleKeyTable<Acquisto, Integer, Date> {

	protected TableAcquisti(final Connection connection) {
		super(connection);
		this.tableName = "acquisti";
		this.primaryKeyNames.add("idCliente");
		this.primaryKeyNames.add("dataOra");
	}

	@Override
	protected void create() {
		try (final Statement statement = connection.createStatement()) {
			statement.executeUpdate(
					"CREATE TABLE " + tableName + " (" +
							"idCliente INT NOT NULL, " +
							"dataOra DATETIME NOT NULL, " +
							"importo DOUBLE NOT NULL, " +
							"tipo CHAR(20) NOT NULL, " +
							"codice CHAR(4) NOT NULL, " +
							"PRIMARY KEY (idCliente, dataOra), " +
							"FOREIGN KEY (idCliente) REFERENCES clienti(id) ON DELETE CASCADE ON UPDATE CASCADE, " +
							"FOREIGN KEY (tipo) REFERENCES tipiAcquisti(tipo) ON DELETE CASCADE ON UPDATE CASCADE, " +
							"FOREIGN KEY (codice) REFERENCES abbonamenti(codice) ON DELETE CASCADE ON UPDATE CASCADE" +
							")");
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	public void insert(final Acquisto acquisto) {
		try (final PreparedStatement preparedStatement = connection.prepareStatement(
				"INSERT INTO " + tableName +
						" (idCliente, dataOra, importo, tipo, codice)" +
						" VALUES (?, ?, ?, ?, ?)")) {
			preparedStatement.setInt(1, acquisto.getIdCliente());
			preparedStatement.setDate(2, acquisto.getDataOra());
			preparedStatement.setDouble(3, acquisto.getImporto());
			preparedStatement.setString(4, acquisto.getTipoProdotto());
			preparedStatement.setString(5, acquisto.getCodiceProdotto());
			preparedStatement.executeUpdate();
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	protected List<Acquisto> readObjectFromResultSet(final ResultSet resultSet) {
		ArrayList<Acquisto> acquisti = new ArrayList<>();
		try {
			while (resultSet.next()) {
				acquisti.add(new Acquisto(
						resultSet.getInt("idCliente"),
						resultSet.getDate("dataOra"),
						resultSet.getDouble("importo"),
						resultSet.getString("tipo"),
						resultSet.getString("codice")));
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return acquisti;
	}

}
