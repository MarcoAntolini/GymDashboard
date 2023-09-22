package dashboard.database.tables;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import dashboard.database.DoubleKeyTable;
import dashboard.model.Abbonamento;
import dashboard.model.TipoAbbonamento;

public class TableAbbonamento extends DoubleKeyTable<Abbonamento, Integer, Date> {

	protected TableAbbonamento(Connection connection) {
		super(connection);
		this.tableName = "abbonamenti";
		this.primaryKeyNames.add("id");
		this.primaryKeyNames.add("dataAcquisto");
	}

	@Override
	public boolean createTable() {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"CREATE TABLE " + this.tableName + " (" +
						"idCliente INT NOT NULL, " +
						"dataAcquisto DATETIME NOT NULL, " +
						"durata STRING NOT NULL, " +
						"annoListino YEAR NOT NULL, " +
						"PRIMARY KEY (idCliente, dataAcquisto), " +
						"FOREIGN KEY (idCliente) REFERENCES clienti(id), " +
						"FOREIGN KEY (annoListino, durata) REFERENCES tipiAbbonamento(annoListino, durata)" +
						")")) {
			statement.executeUpdate();
			return true;
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	@Override
	public boolean save(Abbonamento abbonamento) {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"INSERT INTO " + this.tableName + " (idCliente, dataAcquisto, durata, annoListino) VALUES (?, ?, ?, ?)")) {
			statement.setInt(1, abbonamento.getIdCliente());
			statement.setDate(2, abbonamento.getDataAcquisto());
			statement.setString(3, abbonamento.getDurata().toString());
			statement.setInt(4, abbonamento.getAnnoListino().getValue());
			statement.executeUpdate();
			return true;
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	@Override
	protected List<Abbonamento> readObjectFromResultSet(ResultSet resultSet) {
		List<Abbonamento> abbonamenti = new ArrayList<>();
		try {
			while (resultSet.next()) {
				final int idCliente = resultSet.getInt("idCliente");
				final Date dataAcquisto = resultSet.getDate("dataAcquisto");
				final String durata = resultSet.getString("durata");
				final int annoListino = resultSet.getInt("annoListino");
				final TableTipoAbbonamento tableTipo = new TableTipoAbbonamento(this.connection);
				final Optional<TipoAbbonamento> tipo = tableTipo.findByPrimaryKeys(Year.of(annoListino), durata);
				if (tipo.isEmpty()) {
					break;
				}
				final Abbonamento abbonamento = new Abbonamento(idCliente, dataAcquisto, tipo.get());
				abbonamenti.add(abbonamento);
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return abbonamenti;
	}

}
