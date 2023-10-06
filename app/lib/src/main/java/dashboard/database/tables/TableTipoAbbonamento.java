package dashboard.database.tables;

import dashboard.database.DoubleKeyTable;
import dashboard.model.TipoAbbonamento;
import dashboard.model.TipoAbbonamento.DurataAbbonamento;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;

public class TableTipoAbbonamento extends DoubleKeyTable<TipoAbbonamento, Year, String> {

	public TableTipoAbbonamento(Connection connection) {
		super(connection);
		this.tableName = "tipiAbbonamento";
		this.primaryKeyNames.add("annoListino");
		this.primaryKeyNames.add("durata");
	}

	@Override
	protected void create() {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"CREATE TABLE " + this.tableName + " (" +
						"annoListino YEAR NOT NULL, " +
						"durata STRING NOT NULL, " +
						"prezzo DOUBLE NOT NULL, " +
						"PRIMARY KEY (annoListino, durata), " +
						"FOREIGN KEY (annoListino) REFERENCES listini(anno)" +
						")")) {
			statement.executeUpdate();
		} catch (final Exception e) {
			e.printStackTrace();
		}
	}

	@Override
	public void insert(TipoAbbonamento tipoAbbonamento) {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"INSERT INTO " + this.tableName + " (annoListino, durata, prezzo) VALUES (?, ?, ?)")) {
			statement.setInt(1, tipoAbbonamento.getAnnoListino().getValue());
			statement.setString(2, tipoAbbonamento.getDurata().toString());
			statement.setDouble(3, tipoAbbonamento.getPrezzo());
			statement.executeUpdate();
		} catch (final Exception e) {
			e.printStackTrace();
		}
	}

	@Override
	protected List<TipoAbbonamento> readObjectFromResultSet(ResultSet resultSet) {
		List<TipoAbbonamento> tipiAbbonamento = new ArrayList<>();
		try {
			while (resultSet.next()) {
				final Year annoListino = Year.of(resultSet.getInt("annoListino"));
				final String durata = resultSet.getString("durata");
				final double prezzo = resultSet.getDouble("prezzo");
				final TipoAbbonamento tipoAbbonamento = new TipoAbbonamento(
						annoListino, DurataAbbonamento.valueOf(durata), prezzo);
				tipiAbbonamento.add(tipoAbbonamento);
			}
		} catch (final Exception e) {
			e.printStackTrace();
		}
		return tipiAbbonamento;
	}

}
