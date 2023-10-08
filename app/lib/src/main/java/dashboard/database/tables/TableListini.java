package dashboard.database.tables;

import dashboard.database.TripleKeyTable;
import dashboard.model.Listino;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;

public class TableListini extends TripleKeyTable<Listino, Year, String, String> {

	protected TableListini(final Connection connection) {
		super(connection);
		this.tableName = "listini";
		this.primaryKeyNames.add("anno");
		this.primaryKeyNames.add("tipo");
		this.primaryKeyNames.add("codice");
	}

	// TODO come le faccio le foreign key
	// private void soloperilgiallo() {}

	@Override
	protected void create() {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"CREATE TABLE " + this.tableName + " (" +
						"anno INT NOT NULL, " +
						"tipo CHAR(20) NOT NULL, " +
						"codice CHAR(4) NOT NULL, " +
						"prezzo FLOAT NOT NULL, " +
						"PRIMARY KEY (anno, tipo, codice), " +
						// "FOREIGN KEY (tipo) REFERENCES tipi(tipo) ON DELETE CASCADE ON UPDATE
						// CASCADE, " +
						// "FOREIGN KEY (codice) REFERENCES abbonamenti(codice) ON DELETE CASCADE ON
						// UPDATE CASCADE" +
						")")) {
			statement.executeUpdate();
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	public void insert(final Listino listino) {
		try (final PreparedStatement preparedStatement = this.connection.prepareStatement(
				"INSERT INTO " + this.tableName +
						" (anno, tipo, codice, prezzo)" +
						" VALUES (?, ?, ?, ?)")) {
			preparedStatement.setInt(1, listino.getAnno().getValue());
			preparedStatement.setString(2, listino.getTipoProdotto());
			preparedStatement.setString(3, listino.getCodiceProdotto());
			preparedStatement.setDouble(4, listino.getPrezzo());
			preparedStatement.executeUpdate();
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	protected List<Listino> readObjectFromResultSet(final ResultSet resultSet) {
		ArrayList<Listino> listini = new ArrayList<>();
		try {
			while (resultSet.next()) {
				listini.add(new Listino(
						Year.of(resultSet.getInt("anno")),
						resultSet.getString("tipo"),
						resultSet.getString("codice"),
						resultSet.getDouble("prezzo")));
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return listini;
	}

}
