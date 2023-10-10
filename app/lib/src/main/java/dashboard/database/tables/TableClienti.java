package dashboard.database.tables;

import dashboard.database.SingleKeyTable;
import dashboard.model.Cliente;
import dashboard.model.Persona.Contatto;
import dashboard.model.Persona.Indirizzo;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class TableClienti extends SingleKeyTable<Cliente, Integer> {

	public TableClienti(final Connection connection) {
		super(connection);
		this.tableName = "clienti";
		this.primaryKeyName = "id";
	}

	@Override
	protected void create() {
		try (final Statement statement = this.connection.createStatement()) {
			statement.executeUpdate(
					"CREATE TABLE " + this.tableName + " (" +
							"id INT NOT NULL AUTO_INCREMENT, " +
							"codiceFiscale CHAR(16) NOT NULL, " +
							"nome CHAR(20) NOT NULL, " +
							"cognome CHAR(20) NOT NULL, " +
							"dataNascita DATETIME NOT NULL, " +
							"via CHAR(30), " +
							"numero CHAR(5), " +
							"città CHAR(30), " +
							"provincia CHAR(2), " +
							"telefono CHAR(15), " +
							"email CHAR(30), " +
							"dataIscrizione DATETIME NOT NULL, " +
							"entrateRimaste INT NOT NULL, " +
							"PRIMARY KEY (id)" +
							")");
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	public void insert(final Cliente cliente) {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"INSERT INTO " + this.tableName +
						" (codiceFiscale, nome, cognome, dataNascita, via, numero, città, provincia," +
						"  telefono, email, dataIscrizione, entrateRimaste)" +
						" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
				Statement.RETURN_GENERATED_KEYS)) {
			statement.setString(1, cliente.getCodiceFiscale());
			statement.setString(2, cliente.getNome());
			statement.setString(3, cliente.getCognome());
			statement.setDate(4, cliente.getDataNascita());
			statement.setString(5, cliente.getIndirizzo().getVia());
			statement.setString(6, cliente.getIndirizzo().getNumero());
			statement.setString(7, cliente.getIndirizzo().getCitta());
			statement.setString(8, cliente.getIndirizzo().getProvincia());
			statement.setString(9, cliente.getContatto().getTelefono());
			statement.setString(10, cliente.getContatto().getEmail());
			statement.setDate(11, cliente.getDataIscrizione());
			statement.setInt(12, cliente.getEntrateRimaste());
			statement.executeUpdate();
			try (final ResultSet generatedKeys = statement.getGeneratedKeys()) {
				if (generatedKeys.next()) {
					cliente.setId(generatedKeys.getInt(1));
				}
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
	}

	@Override
	protected List<Cliente> readObjectFromResultSet(final ResultSet resultSet) {
		List<Cliente> clienti = new ArrayList<>();
		try {
			while (resultSet.next()) {
				clienti.add(new Cliente(
						resultSet.getInt("id"),
						resultSet.getString("codiceFiscale"),
						resultSet.getString("nome"),
						resultSet.getString("cognome"),
						resultSet.getDate("dataNascita"),
						new Indirizzo(
								resultSet.getString("via"),
								resultSet.getString("numero"),
								resultSet.getString("città"),
								resultSet.getString("provincia")),
						new Contatto(
								resultSet.getString("telefono"),
								resultSet.getString("email")),
						resultSet.getDate("dataIscrizione"),
						resultSet.getInt("entrateRimaste")));
			}
		} catch (SQLException e) {
			e.printStackTrace();
		}
		return clienti;
	}

	private List<Cliente> getClientiIscrittiQuando(final Date data, final boolean isDopo) {
		List<Cliente> clienti = new ArrayList<>();
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"SELECT * FROM " + this.tableName +
						" WHERE dataIscrizione " + (isDopo ? ">" : "<") + "= ?")) {
			statement.setDate(1, data);
			try (final ResultSet resultSet = statement.executeQuery()) {
				clienti = this.readObjectFromResultSet(resultSet);
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return clienti;
	}

	private List<Cliente> getClientiLivingIn(final String posto, final boolean isCitta) {
		List<Cliente> clienti = new ArrayList<>();
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"SELECT * FROM " + this.tableName +
						" WHERE " + (isCitta ? "città" : "provincia") + " = ?")) {
			statement.setString(1, posto);
			try (final ResultSet resultSet = statement.executeQuery()) {
				clienti = this.readObjectFromResultSet(resultSet);
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return clienti;
	}

	// TODO serve? idem per dipendenti
	// public List<Cliente> getClienteLikeNomeAndCognome(final String nome, final
	// String cognome) {
	// List<Cliente> clienti = new ArrayList<>();
	// try (final PreparedStatement statement = this.connection.prepareStatement(
	// "SELECT * FROM " + this.tableName +
	// " WHERE nome LIKE ? AND cognome LIKE ?")) {
	// statement.setString(1, "%" + nome + "%");
	// statement.setString(2, "%" + cognome + "%");
	// try (final ResultSet resultSet = statement.executeQuery()) {
	// clienti = this.readObjectFromResultSet(resultSet);
	// }
	// } catch (final SQLException e) {
	// e.printStackTrace();
	// }
	// return clienti;
	// }

	public List<Cliente> getClientiIscrittiDopo(final Date data) {
		return this.getClientiIscrittiQuando(data, true);
	}

	public List<Cliente> getClientiIscrittiPrima(final Date data) {
		return this.getClientiIscrittiQuando(data, false);
	}

	public List<Cliente> getClientiIscrittiInPeriodo(final Date dataInizio, final Date dataFine) {
		return this.getClientiIscrittiDopo(dataInizio).stream()
				.filter(cliente -> cliente.getDataIscrizione().before(dataFine))
				.toList();
	}

	public List<Cliente> getClientiIscrittiInAnno(final int anno) {
		return this.getClientiIscrittiInPeriodo(
				Date.valueOf(anno + "-01-01"),
				Date.valueOf(anno + "-12-31"));
	}

	public List<Cliente> getClientiIscrittiInMese(final int anno, final int mese) {
		return this.getClientiIscrittiInPeriodo(
				Date.valueOf(anno + "-" + mese + "-01"),
				Date.valueOf(anno + "-" + mese + "-31"));
	}

	public List<Cliente> getClientiLivingInCitta(final String citta) {
		return this.getClientiLivingIn(citta, true);
	}

	public List<Cliente> getClientiLivingInProvincia(final String provincia) {
		return this.getClientiLivingIn(provincia, false);
	}

	@SuppressWarnings("java:S2479")
	public List<Cliente> getClientiConAbbonamento() {
		List<Cliente> clienti = new ArrayList<>();
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"SELECT * FROM " + this.tableName + """
						INNER JOIN
							acquisti ON clienti.id = acquisti.idCliente
						INNER JOIN
							abbonamenti ON acquisti.codice = abbonamenti.codice
						WHERE
							acquisti.tipo = 'abbonamento' AND
							acquisti.dataOra + INTERVAL abbonamenti.durata YEAR > NOW()
						""")) {
			try (final ResultSet resultSet = statement.executeQuery()) {
				clienti = this.readObjectFromResultSet(resultSet);
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return clienti;
	}

	public List<Cliente> getClientiConEntrate() {
		List<Cliente> clienti = new ArrayList<>();
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"SELECT * FROM " + this.tableName + " WHERE entrateRimaste > 0")) {
			try (final ResultSet resultSet = statement.executeQuery()) {
				clienti = this.readObjectFromResultSet(resultSet);
			}
		} catch (final SQLException e) {
			e.printStackTrace();
		}
		return clienti;
	}

}
