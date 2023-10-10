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
							"tipo ENUM('abbonamento', 'pacchetto entrate') NOT NULL, " +
							"codice CHAR(4) NOT NULL, " +
							"PRIMARY KEY (idCliente, dataOra), " +
							"FOREIGN KEY (idCliente) REFERENCES clienti(id) ON DELETE CASCADE ON UPDATE CASCADE, " +
							"FOREIGN KEY (codice) REFERENCES prodotti(codice) ON DELETE CASCADE ON UPDATE CASCADE" +
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

	private List<Acquisto> getAcquistiByParameters(final int idCliente, final Integer year, final Integer month) {
		try {
			final StringBuilder query = new StringBuilder("SELECT * FROM " + tableName + " WHERE idCliente = ?");
			if (year != null) {
				query.append(" AND YEAR(dataOra) = ?");
			}
			if (month != null) {
				query.append(" AND MONTH(dataOra) = ?");
			}
			try (final PreparedStatement preparedStatement = connection.prepareStatement(query.toString())) {
				int parameterIndex = 1;
				preparedStatement.setInt(parameterIndex++, idCliente);
				if (year != null) {
					preparedStatement.setInt(parameterIndex++, year);
				}
				if (month != null) {
					preparedStatement.setInt(parameterIndex++, month);
				}
				return readObjectFromResultSet(preparedStatement.executeQuery());
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return List.of();
	}

	private List<Acquisto> getTipoInYear(final String tipo, final int year) {
		try (final PreparedStatement preparedStatement = connection.prepareStatement(
				"SELECT * FROM " + tableName + " WHERE" +
						" tipo = ? AND" +
						" YEAR(dataOra) = ?")) {
			preparedStatement.setString(1, tipo);
			preparedStatement.setInt(2, year);
			return readObjectFromResultSet(preparedStatement.executeQuery());
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return List.of();
	}

	private List<Acquisto> getTipoInYearMonth(final String tipo, final int year, final int month) {
		try (final PreparedStatement preparedStatement = connection.prepareStatement(
				"SELECT * FROM " + tableName + " WHERE" +
						" tipo = ? AND" +
						" YEAR(dataOra) = ? AND" +
						" MONTH(dataOra) = ?")) {
			preparedStatement.setString(1, tipo);
			preparedStatement.setInt(2, year);
			preparedStatement.setInt(3, month);
			return readObjectFromResultSet(preparedStatement.executeQuery());
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return List.of();
	}

	public List<Acquisto> getAcquistiCliente(final int idCliente) {
		return getAcquistiByParameters(idCliente, null, null);
	}

	public List<Acquisto> getAcquistiClienteInYear(final int idCliente, final int year) {
		return getAcquistiByParameters(idCliente, year, null);
	}

	public List<Acquisto> getAcquistiClienteInYearMonth(final int idCliente, final int year, final int month) {
		return getAcquistiByParameters(idCliente, year, month);
	}

	public List<Acquisto> getAbbonamentiInYear(final int year) {
		return getTipoInYear("abbonamento", year);
	}

	public List<Acquisto> getAbbonamentiInYearMonth(final int year, final int month) {
		return getTipoInYearMonth("abbonamento", year, month);
	}

	public List<Acquisto> getPacchettiInYear(final int year) {
		return getTipoInYear("pacchetto entrate", year);
	}

	public List<Acquisto> getPacchettiInYearMonth(final int year, final int month) {
		return getTipoInYearMonth("pacchetto entrate", year, month);
	}

	public List<Acquisto> filterByCodice(final List<Acquisto> acquisti, final String codice) {
		return acquisti.stream().filter(acquisto -> acquisto.getCodiceProdotto().equals(codice)).toList();
	}

}
