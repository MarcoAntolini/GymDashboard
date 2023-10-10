package dashboard.database.tables;

import dashboard.database.SingleKeyTable;
import dashboard.model.Prodotto;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class TableProdotti extends SingleKeyTable<Prodotto, String> {

	protected TableProdotti(final Connection connection) {
		super(connection);
		this.tableName = "prodotti";
		this.primaryKeyName = "codice";
	}

	@Override
	protected void create() {
		try (final Statement statement = connection.createStatement()) {
			statement.executeUpdate(
					"CREATE TABLE " + tableName + " (" +
							"codice CHAR(20) NOT NULL, " +
							"PRIMARY KEY (codice)" +
							")");
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	public void insert(final Prodotto prodotto) {
		try (final PreparedStatement preparedStatement = connection.prepareStatement(
				"INSERT INTO " + tableName +
						" (codice)" +
						" VALUES (?)")) {
			preparedStatement.setString(1, prodotto.getCodice());
			preparedStatement.executeUpdate();
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	protected List<Prodotto> readObjectFromResultSet(final ResultSet resultSet) {
		ArrayList<Prodotto> prodotti = new ArrayList<>();
		try {
			while (resultSet.next()) {
				prodotti.add(new Prodotto(
						resultSet.getString("codice")));
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return prodotti;
	}

}
