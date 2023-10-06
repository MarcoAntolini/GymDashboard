package dashboard.database.tables;

import dashboard.database.DoubleKeyTable;
import dashboard.model.PacchettoEntrate;
import dashboard.model.TipoPacchettoEntrate;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class TablePacchettoEntrate extends DoubleKeyTable<PacchettoEntrate, Integer, Date> {

	public TablePacchettoEntrate(Connection connection) {
		super(connection);
		this.tableName = "pacchettiEntrate";
		this.primaryKeyNames.add("idCliente");
		this.primaryKeyNames.add("dataAcquisto");
	}

	@Override
	protected void create() {
		try (final PreparedStatement statement = this.connection.prepareStatement(
				"CREATE TABLE " + this.tableName + " (" +
						"idCliente INT NOT NULL, " +
						"dataAcquisto DATE NOT NULL, " +
						"annoListino YEAR NOT NULL, " +
						"numeroEntrate INT NOT NULL, " +
						"entrateRimaste INT NOT NULL, " +
						"PRIMARY KEY (idCliente, dataAcquisto), " +
						"FOREIGN KEY (idCliente) REFERENCES clienti(id), " +
						"FOREIGN KEY (annoListino, numeroEntrate) REFERENCES tipiPacchettoEntrate(annoListino, numeroEntrate)"
						+ ")")) {
			statement.executeUpdate();
		} catch (final Exception e) {
			e.printStackTrace();
		}
	}

	@Override
	public void insert(PacchettoEntrate pacchettoEntrate) {
		try (final PreparedStatement statement = this.connection.prepareStatement("INSERT INTO " + this.tableName
				+ " (idCliente, dataAcquisto, annoListino, numeroEntrate, entrateRimaste) VALUES (?, ?, ?, ?, ?)")) {
			statement.setInt(1, pacchettoEntrate.getIdCliente());
			statement.setDate(2, pacchettoEntrate.getDataAcquisto());
			statement.setInt(3, pacchettoEntrate.getTipo().getAnnoListino().getValue());
			statement.setInt(4, pacchettoEntrate.getTipo().getNumeroEntrate().getNumero());
			statement.setInt(5, pacchettoEntrate.getEntrateRimaste());
			statement.executeUpdate();
		} catch (final Exception e) {
			e.printStackTrace();
		}
	}

	@Override
	protected List<PacchettoEntrate> readObjectFromResultSet(ResultSet resultSet) {
		List<PacchettoEntrate> pacchettiEntrate = new ArrayList<>();
		try {
			while (resultSet.next()) {
				final int idCliente = resultSet.getInt("idCliente");
				final Date dataAcquisto = resultSet.getDate("dataAcquisto");
				final int annoListino = resultSet.getInt("annoListino");
				final int numeroEntrate = resultSet.getInt("numeroEntrate");
				final int entrateRimaste = resultSet.getInt("entrateRimaste");
				final TableTipoPacchettoEntrate tableTipo = new TableTipoPacchettoEntrate(this.connection);
				final Optional<TipoPacchettoEntrate> tipo = tableTipo.findByPrimaryKeys(Year.of(annoListino), numeroEntrate);
				if (tipo.isEmpty()) {
					break;
				}
				final PacchettoEntrate pacchettoEntrate = new PacchettoEntrate(
						idCliente, dataAcquisto, tipo.get(), entrateRimaste);
				pacchettiEntrate.add(pacchettoEntrate);
			}
		} catch (final Exception e) {
			e.printStackTrace();
		}
		return pacchettiEntrate;
	}

}
