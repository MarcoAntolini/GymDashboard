package dashboard.model;

import java.sql.Date;
import java.util.Objects;

public class Ingresso {

	private final int idCliente;
	private final Date dataOra;

	public Ingresso(final int idCliente, final Date dataOra) {
		this.idCliente = Objects.requireNonNull(idCliente);
		this.dataOra = Objects.requireNonNull(dataOra);
	}

	public int getIdCliente() {
		return idCliente;
	}

	public Date getDataOra() {
		return dataOra;
	}

	public Object[] toArray() {
		return new Object[] {
				getIdCliente(),
				getDataOra()
		};
	}

	@Override
	public String toString() {
		return new StringBuilder().append("(").append(getIdCliente()).append(") ").append(getDataOra()).toString();
	}

	@Override
	public boolean equals(Object other) {
		return (other instanceof Ingresso) && ((Ingresso) other).getIdCliente() == this.getIdCliente()
				&& ((Ingresso) other).getDataOra().equals(this.getDataOra());
	}

	@Override
	public int hashCode() {
		return Objects.hash(idCliente, dataOra);
	}

}
