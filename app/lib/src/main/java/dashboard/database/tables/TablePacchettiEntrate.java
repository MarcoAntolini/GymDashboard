package dashboard.database.tables;

import dashboard.database.SingleKeyTable;
import dashboard.model.PacchettoEntrate;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class TablePacchettiEntrate extends SingleKeyTable<PacchettoEntrate, String> {

	protected TablePacchettiEntrate(final Connection connection) {
		super(connection);
		this.tableName = "pacchettiEntrate";
		this.primaryKeyName = "codice";
	}

	@Override
	protected void create() {
		try (final Statement statement = this.connection.createStatement()) {
			statement.executeUpdate(
					"CREATE TABLE " + this.tableName + " (" +
							"codice CHAR(4) NOT NULL, " +
							"numeroEntrate INT NOT NULL, " +
							"PRIMARY KEY (codice)" +
							")");
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	public void insert(final PacchettoEntrate pacchettoEntrate) {
		try (final PreparedStatement preparedStatement = this.connection.prepareStatement(
				"INSERT INTO " + this.tableName +
						" (codice, numeroEntrate)" +
						" VALUES (?, ?)")) {
			preparedStatement.setString(1, pacchettoEntrate.getCodice());
			preparedStatement.setInt(2, pacchettoEntrate.getNumeroEntrate());
			preparedStatement.executeUpdate();
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	protected List<PacchettoEntrate> readObjectFromResultSet(final ResultSet resultSet) {
		ArrayList<PacchettoEntrate> pacchettiEntrate = new ArrayList<>();
		try {
			while (resultSet.next()) {
				pacchettiEntrate.add(new PacchettoEntrate(
						resultSet.getString("codice"),
						resultSet.getInt("numeroEntrate")));
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return pacchettiEntrate;
	}

}
