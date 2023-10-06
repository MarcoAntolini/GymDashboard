package dashboard.model;

import java.sql.Date;
import java.util.Objects;

public class PacchettoEntrate {

	private final int idCliente;
	private final Date dataAcquisto;
	private final TipoPacchettoEntrate tipo;
	private int entrateRimaste;

	public PacchettoEntrate(final int idCliente, final Date dataAcquisto, final TipoPacchettoEntrate tipo) {
		this.idCliente = Objects.requireNonNull(idCliente);
		this.dataAcquisto = Objects.requireNonNull(dataAcquisto);
		this.tipo = Objects.requireNonNull(tipo);
		this.entrateRimaste = tipo.getNumeroEntrate().getNumero();
	}

	public PacchettoEntrate(final int idCliente, final Date dataAcquisto, final TipoPacchettoEntrate tipo,
			final int entrateRimaste) {
		this(idCliente, dataAcquisto, tipo);
		this.entrateRimaste = Objects.requireNonNull(entrateRimaste);
	}

	public int getIdCliente() {
		return idCliente;
	}

	public Date getDataAcquisto() {
		return dataAcquisto;
	}

	public TipoPacchettoEntrate getTipo() {
		return tipo;
	}

	public int getEntrateRimaste() {
		return entrateRimaste;
	}

	public void setEntrateRimaste(int entrateRimaste) {
		this.entrateRimaste = entrateRimaste;
	}

	public Object[] toArray() {
		return new Object[] {
				getIdCliente(),
				getTipo(),
				getDataAcquisto(),
				getEntrateRimaste()
		};
	}

	@Override
	public String toString() {
		return new StringBuilder().append("(").append(getIdCliente()).append(") ").append(getDataAcquisto())
				.append(" - ").append(getTipo()).append(" - ").append(getEntrateRimaste()).toString();
	}

	@Override
	public boolean equals(Object other) {
		return (other instanceof PacchettoEntrate)
				&& ((PacchettoEntrate) other).getIdCliente() == this.getIdCliente()
				&& ((PacchettoEntrate) other).getDataAcquisto().equals(this.getDataAcquisto())
				&& ((PacchettoEntrate) other).getTipo().equals(this.getTipo())
				&& ((PacchettoEntrate) other).getEntrateRimaste() == this.getEntrateRimaste();
	}

	@Override
	public int hashCode() {
		return Objects.hash(idCliente, dataAcquisto, tipo, entrateRimaste);
	}

}
