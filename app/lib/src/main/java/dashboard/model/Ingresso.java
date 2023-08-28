package dashboard.model;

import java.sql.Date;
import java.util.Objects;

public class Ingresso {

	private final int idCliente;
	private final Date dataOra;

	public Ingresso(int idCliente, Date dataOra) {
		this.idCliente = Objects.requireNonNull(idCliente);
		this.dataOra = Objects.requireNonNull(dataOra);
	}

	public int getIdCliente() {
		return idCliente;
	}

	public Date getDataOra() {
		return dataOra;
	}

}
