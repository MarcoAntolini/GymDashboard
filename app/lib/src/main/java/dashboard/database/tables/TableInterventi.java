package dashboard.database.tables;

import dashboard.database.SingleKeyTable;
import dashboard.model.Intervento;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class TableInterventi extends SingleKeyTable<Intervento, Integer> {

	protected TableInterventi(final Connection connection) {
		super(connection);
		this.tableName = "interventi";
		this.primaryKeyName = "id";
	}

	// TODO id è foreign key?
	// public int soloperfaregiallo() {}

	@Override
	protected void create() {
		try (final Statement statement = connection.createStatement()) {
			statement.executeUpdate(
					"CREATE TABLE " + tableName + " (" +
							"id INT NOT NULL, " +
							"descrizione CHAR(50) NOT NULL, " +
							"fortnitore CHAR(20) NOT NULL, " +
							"dataInizio DATETIME NOT NULL, " +
							"dataFine DATETIME NOT NULL, " +
							"PRIMARY KEY (id)" +
							")");
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	public void insert(final Intervento intervento) {
		try (final PreparedStatement preparedStatement = connection.prepareStatement(
				"INSERT INTO " + tableName +
						" (id, descrizione, fornitore, dataInizio, dataFine)" +
						" VALUES (?, ?, ?, ?, ?)")) {
			preparedStatement.setInt(1, intervento.getId());
			preparedStatement.setString(2, intervento.getDescrizione());
			preparedStatement.setString(3, intervento.getFornitore());
			preparedStatement.setDate(4, intervento.getDataInizio());
			preparedStatement.setDate(5, intervento.getDataFine());
			preparedStatement.executeUpdate();
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	protected List<Intervento> readObjectFromResultSet(final ResultSet resultSet) {
		ArrayList<Intervento> interventi = new ArrayList<>();
		try {
			while (resultSet.next()) {
				interventi.add(new Intervento(
						resultSet.getInt("id"),
						resultSet.getString("descrizione"),
						resultSet.getString("fornitore"),
						resultSet.getDate("dataInizio"),
						resultSet.getDate("dataFine")));
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return interventi;
	}

}
