package dashboard.database.tables;

import dashboard.database.DoubleKeyTable;
import dashboard.model.TipoPacchettoEntrate;
import dashboard.model.TipoPacchettoEntrate.NumeroEntrate;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;

public class TableTipoPacchettoEntrate extends DoubleKeyTable<TipoPacchettoEntrate, Year, Integer> {

	public TableTipoPacchettoEntrate(Connection connection) {
		super(connection);
		this.tableName = "tipiPacchettoEntrate";
		this.primaryKeyNames.add("annoListino");
		this.primaryKeyNames.add("numeroEntrate");
	}

	@Override
	protected void create() {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"CREATE TABLE " + this.tableName + " (" +
						"annoListino YEAR NOT NULL, " +
						"numeroEntrate INT NOT NULL, " +
						"prezzo DOUBLE NOT NULL, " +
						"PRIMARY KEY (annoListino, numeroEntrate), " +
						"FOREIGN KEY (annoListino) REFERENCES listini(anno)" +
						")")) {
			statement.executeUpdate();
		} catch (final Exception e) {
			e.printStackTrace();
		}
	}

	@Override
	public void insert(TipoPacchettoEntrate tipoPacchettoEntrate) {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"INSERT INTO " + this.tableName + " (annoListino, numeroEntrate, prezzo) VALUES (?, ?, ?)")) {
			statement.setInt(1, tipoPacchettoEntrate.getAnnoListino().getValue());
			statement.setInt(2, tipoPacchettoEntrate.getNumeroEntrate().getNumero());
			statement.setDouble(3, tipoPacchettoEntrate.getPrezzo());
			statement.executeUpdate();
		} catch (final Exception e) {
			e.printStackTrace();
		}
	}

	@Override
	protected List<TipoPacchettoEntrate> readObjectFromResultSet(ResultSet resultSet) {
		List<TipoPacchettoEntrate> tipiPacchettoEntrate = new ArrayList<>();
		try {
			while (resultSet.next()) {
				final Year annoListino = Year.of(resultSet.getInt("annoListino"));
				final NumeroEntrate numeroEntrate = NumeroEntrate.findNumero(resultSet.getInt("numeroEntrate"));
				final double prezzo = resultSet.getDouble("prezzo");
				final TipoPacchettoEntrate tipoPacchettoEntrate = new TipoPacchettoEntrate(annoListino, numeroEntrate, prezzo);
				tipiPacchettoEntrate.add(tipoPacchettoEntrate);
			}
		} catch (final Exception e) {
			e.printStackTrace();
		}
		return tipiPacchettoEntrate;
	}

}
