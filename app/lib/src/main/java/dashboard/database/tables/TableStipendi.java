package dashboard.database.tables;

import dashboard.database.SingleKeyTable;
import dashboard.model.Stipendio;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class TableStipendi extends SingleKeyTable<Stipendio, Integer> {

	protected TableStipendi(final Connection connection) {
		super(connection);
		this.tableName = "stipendi";
		this.primaryKeyName = "id";
	}

	@Override
	protected void create() {
		try (final Statement statement = connection.createStatement()) {
			statement.executeUpdate(
					"CREATE TABLE " + tableName + " (" +
							"id INT NOT NULL, " +
							"idDipendente INT NOT NULL, " +
							"PRIMARY KEY (id)" +
							"FROEIGN KEY (id) REFERENCES pagamenti(id) ON DELETE CASCADE ON UPDATE CASCADE" +
							"FOREIGN KEY (idDipendente) REFERENCES dipendenti(id) ON DELETE CASCADE ON UPDATE CASCADE" +
							")");
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	public void insert(final Stipendio stipendio) {
		try (final PreparedStatement preparedStatement = connection.prepareStatement(
				"INSERT INTO " + tableName +
						" (id, idDipendente)" +
						" VALUES (?, ?)")) {
			preparedStatement.setInt(1, stipendio.getId());
			preparedStatement.setInt(2, stipendio.getIdDipendente());
			preparedStatement.executeUpdate();
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	protected List<Stipendio> readObjectFromResultSet(final ResultSet resultSet) {
		ArrayList<Stipendio> stipendi = new ArrayList<>();
		try {
			while (resultSet.next()) {
				stipendi.add(new Stipendio(
						resultSet.getInt("id"),
						resultSet.getInt("idDipendente")));
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return stipendi;
	}

}
