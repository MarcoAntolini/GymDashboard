package dashboard.database.tables;

import dashboard.database.SingleKeyTable;
import dashboard.model.Attrezzatura;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class TableAttrezzature extends SingleKeyTable<Attrezzatura, Integer> {

	protected TableAttrezzature(final Connection connection) {
		super(connection);
		this.tableName = "attrezzature";
		this.primaryKeyName = "id";
	}

	@Override
	protected void create() {
		try (final Statement statement = connection.createStatement()) {
			statement.executeUpdate(
					"CREATE TABLE " + tableName + " (" +
							"id INT NOT NULL, " +
							"descrizione CHAR(50) NOT NULL, " +
							"fortnitore CHAR(30) NOT NULL, " +
							"PRIMARY KEY (id)" +
							"FROEIGN KEY (id) REFERENCES pagamenti(id) ON DELETE CASCADE ON UPDATE CASCADE" +
							")");
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	public void insert(final Attrezzatura attrezzatura) {
		try (final PreparedStatement preparedStatement = connection.prepareStatement(
				"INSERT INTO " + tableName +
						" (id, descrizione, fornitore)" +
						" VALUES (?, ?, ?)")) {
			preparedStatement.setInt(1, attrezzatura.getId());
			preparedStatement.setString(2, attrezzatura.getDescrizione());
			preparedStatement.setString(3, attrezzatura.getFornitore());
			preparedStatement.executeUpdate();
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	protected List<Attrezzatura> readObjectFromResultSet(final ResultSet resultSet) {
		ArrayList<Attrezzatura> attrezzature = new ArrayList<>();
		try {
			while (resultSet.next()) {
				attrezzature.add(new Attrezzatura(
						resultSet.getInt("id"),
						resultSet.getString("descrizione"),
						resultSet.getString("fornitore")));
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return attrezzature;
	}

}
