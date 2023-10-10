package dashboard.database.tables;

import dashboard.database.TripleKeyTable;
import dashboard.model.Abbonamento;
import dashboard.model.Listino;
import dashboard.model.PacchettoEntrate;
import dashboard.model.Prodotto;

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

	@Override
	protected void create() {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"CREATE TABLE " + this.tableName + " (" +
						"anno INT NOT NULL, " +
						"tipo ENUM('abbonamento', 'pacchetto entrate') NOT NULL, " +
						"codice CHAR(4) NOT NULL, " +
						"prezzo FLOAT NOT NULL, " +
						"PRIMARY KEY (anno, tipo, codice), " +
						"FOREIGN KEY (codice) REFERENCES prodotti(codice) ON DELETE CASCADE ON UPDATE CASCADE" +
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

	/**
	 * Returns the {@link Prodotto} with the given {@code codice}.
	 * 
	 * @param codice the codice of the {@link Prodotto} to return
	 * @return the {@link Prodotto} with the given {@code codice}
	 */
	@SuppressWarnings("java:S2479")
	public Prodotto getProdottoByCodice(final String codice) {
		try (final PreparedStatement preparedStatement = this.connection.prepareStatement("""
				SELECT
					prodotti.codice,
					CASE
						WHEN listini.tipo = 'abbonamento' THEN abbonamenti.durata
					END AS durata,
					CASE
						WHEN listini.tipo = 'pacchetto entrate' THEN pacchetti.numeroEntrate
					END AS numeroEntrate
				FROM
					prodotti
				LEFT JOIN
					abbonamenti ON prodotti.codice = abbonamenti.codice
				LEFT JOIN
					pacchetti ON prodotti.codice = pacchetti.codice
				INNER JOIN
					listini ON prodotti.codice = listini.codice
				WHERE
					prodotti.codice = ?
					""")) {
			preparedStatement.setString(1, codice);
			try (final ResultSet resultSet = preparedStatement.executeQuery()) {
				if (resultSet.next()) {
					if (codice.charAt(0) == 'A') {
						return new Abbonamento(
								codice,
								resultSet.getInt("durata"));
					} else if (codice.charAt(0) == 'E') {
						return new PacchettoEntrate(
								codice,
								resultSet.getInt("numeroEntrate"));
					}
				}
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return null;
	}

}
