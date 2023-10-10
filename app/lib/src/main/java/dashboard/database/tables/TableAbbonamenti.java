package dashboard.database.tables;

import dashboard.database.SingleKeyTable;
import dashboard.model.Abbonamento;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class TableAbbonamenti extends SingleKeyTable<Abbonamento, String> {

	protected TableAbbonamenti(final Connection connection) {
		super(connection);
		this.tableName = "abbonamenti";
		this.primaryKeyName = "codice";
	}

	@Override
	protected void create() {
		try (final Statement statement = this.connection.createStatement()) {
			statement.executeUpdate(
					"CREATE TABLE " + this.tableName + " (" +
							"codice CHAR(4) NOT NULL, " +
							"durata INT NOT NULL, " +
							"PRIMARY KEY (codice)" +
							"FOREIGN KEY (codice) REFERENCES prodotti(codice) ON DELETE CASCADE ON UPDATE CASCADE" +
							")");
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	public void insert(final Abbonamento abbonamento) {
		try (final PreparedStatement preparedStatement = this.connection.prepareStatement(
				"INSERT INTO " + this.tableName +
						" (codice, durata)" +
						" VALUES (?, ?)")) {
			preparedStatement.setString(1, abbonamento.getCodice());
			preparedStatement.setInt(2, abbonamento.getDurata());
			preparedStatement.executeUpdate();
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	protected List<Abbonamento> readObjectFromResultSet(final ResultSet resultSet) {
		ArrayList<Abbonamento> abbonamenti = new ArrayList<>();
		try {
			while (resultSet.next()) {
				abbonamenti.add(new Abbonamento(
						resultSet.getString("codice"),
						resultSet.getInt("durata")));
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return abbonamenti;
	}

}
