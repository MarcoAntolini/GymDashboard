package dashboard.database.tables;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;

import dashboard.database.SingleKeyTable;
import dashboard.model.Listino;

public class TableListino extends SingleKeyTable<Listino, Year> {

	protected TableListino(Connection connection) {
		super(connection);
		this.tableName = "listini";
		this.primaryKeyName = "anno";
	}

	@Override
	public boolean createTable() {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"CREATE TABLE " + this.tableName + " (" +
						"anno YEAR NOT NULL, " +
						"PRIMARY KEY (anno)" +
						")")) {
			statement.executeUpdate();
			return true;
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	@Override
	public boolean save(Listino value) {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"INSERT INTO " + this.tableName + " (anno) VALUES (?)")) {
			statement.setInt(1, value.getAnno().getValue());
			statement.executeUpdate();
			return true;
		} catch (final SQLException e) {
			e.printStackTrace();
			return false;
		}
	}

	@Override
	protected List<Listino> readObjectFromResultSet(ResultSet resultSet) {
		List<Listino> listini = new ArrayList<>();
		try {
			while (resultSet.next()) {
				int anno = resultSet.getInt("anno");
				Listino listino = new Listino(anno);
				listini.add(listino);
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return listini;
	}

}
