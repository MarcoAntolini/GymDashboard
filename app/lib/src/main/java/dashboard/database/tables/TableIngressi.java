package dashboard.database.tables;

import dashboard.database.DoubleKeyTable;
import dashboard.model.Ingresso;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class TableIngressi extends DoubleKeyTable<Ingresso, Integer, Date> {

	public TableIngressi(final Connection connection) {
		super(connection);
		this.tableName = "ingressi";
		this.primaryKeyNames.add("idCliente");
		this.primaryKeyNames.add("dataOra");
	}

	@Override
	protected void create() {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"CREATE TABLE " + this.tableName + " (" +
						"idCliente INT NOT NULL, " +
						"dataOra DATETIME NOT NULL, " +
						"PRIMARY KEY (idCliente, dataOra), " +
						"FOREIGN KEY (idCliente) REFERENCES clienti(id) ON DELETE CASCADE ON UPDATE CASCADE" +
						")")) {
			statement.executeUpdate();
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	public void insert(final Ingresso ingresso) {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"INSERT INTO " + this.tableName +
						" (idCliente, dataOra)" +
						" VALUES (?, ?)")) {
			statement.setInt(1, ingresso.getIdCliente());
			statement.setDate(2, ingresso.getDataOra());
			statement.executeUpdate();
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	protected List<Ingresso> readObjectFromResultSet(final ResultSet resultSet) {
		List<Ingresso> ingressi = new ArrayList<>();
		try {
			while (resultSet.next()) {
				ingressi.add(new Ingresso(
						resultSet.getInt("idCliente"),
						resultSet.getDate("dataOra")));
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return ingressi;
	}

}
