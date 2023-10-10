package dashboard.database.tables;

import dashboard.database.SingleKeyTable;
import dashboard.model.Pagamento;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class TablePagamenti extends SingleKeyTable<Pagamento, Integer> {

	protected TablePagamenti(final Connection connection) {
		super(connection);
		this.tableName = "pagamenti";
		this.primaryKeyName = "id";
	}

	@Override
	protected void create() {
		try (final Statement statement = this.connection.createStatement()) {
			statement.executeUpdate(
					"CREATE TABLE " + this.tableName + " (" +
							"id INT NOT NULL, " +
							"dataOra DATETIME NOT NULL, " +
							"importo DOUBLE NOT NULL, " +
							"tipo ENUM('stipendio', 'bolletta', 'attrezzatura, 'intervento'') NOT NULL, " +
							"PRIMARY KEY (id)" +
							")");
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	public void insert(final Pagamento pagamento) {
		try (final PreparedStatement preparedStatement = this.connection.prepareStatement(
				"INSERT INTO " + this.tableName +
						" (id, dataOra, importo, tipo)" +
						" VALUES (?, ?, ?, ?)")) {
			preparedStatement.setInt(1, pagamento.getId());
			preparedStatement.setDate(2, pagamento.getDataOra());
			preparedStatement.setDouble(3, pagamento.getImporto());
			preparedStatement.setString(4, pagamento.getTipo());
			preparedStatement.executeUpdate();
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	protected List<Pagamento> readObjectFromResultSet(final ResultSet resultSet) {
		ArrayList<Pagamento> pagamenti = new ArrayList<>();
		try {
			while (resultSet.next()) {
				pagamenti.add(new Pagamento(
						resultSet.getInt("id"),
						resultSet.getDate("dataOra"),
						resultSet.getDouble("importo"),
						resultSet.getString("tipo")));
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return pagamenti;
	}

	/**
	 * Insert a new {@link Pagamento} and return its id.
	 * 
	 * @param pagamento the {@link Pagamento} to insert
	 * @return the id of the inserted {@link Pagamento}
	 */
	public int insertAndGetId(final Pagamento pagamento) {
		try (final PreparedStatement preparedStatement = this.connection.prepareStatement(
				"INSERT INTO " + this.tableName +
						" (dataOra, importo, tipo)" +
						" VALUES (?, ?, ?)",
				Statement.RETURN_GENERATED_KEYS)) {
			preparedStatement.setDate(1, pagamento.getDataOra());
			preparedStatement.setDouble(2, pagamento.getImporto());
			preparedStatement.setString(3, pagamento.getTipo());
			preparedStatement.executeUpdate();
			try (final ResultSet resultSet = preparedStatement.getGeneratedKeys()) {
				if (resultSet.next()) {
					return resultSet.getInt(1);
				}
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return -1;
	}

}
