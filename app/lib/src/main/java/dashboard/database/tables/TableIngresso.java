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

public class TableIngresso extends DoubleKeyTable<Ingresso, Integer, Date> {

	public TableIngresso(Connection connection) {
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
						"FOREIGN KEY (idCliente) REFERENCES clienti(id)" +
						")")) {
			statement.executeUpdate();
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	public void insert(Ingresso ingresso) {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"INSERT INTO " + this.tableName + " (idCliente, dataOra) VALUES (?, ?)")) {
			statement.setInt(1, ingresso.getIdCliente());
			statement.setDate(2, ingresso.getDataOra());
			statement.executeUpdate();
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	protected List<Ingresso> readObjectFromResultSet(ResultSet resultSet) {
		List<Ingresso> ingressi = new ArrayList<>();
		try {
			while (resultSet.next()) {
				final int idCliente = resultSet.getInt("idCliente");
				final Date dataOra = resultSet.getDate("dataOra");
				Ingresso ingresso = new Ingresso(idCliente, dataOra);
				ingressi.add(ingresso);
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return ingressi;
	}

}
