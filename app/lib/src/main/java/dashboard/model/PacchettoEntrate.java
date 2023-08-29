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

	@Override
	public String toString() {
		return new StringBuilder().append(idCliente).append(" - ").append(dataAcquisto).append(" - ").append(tipo)
				.append(" - ").append(entrateRimaste).toString();
	}

	@Override
	public boolean equals(Object other) {
		if (other instanceof PacchettoEntrate) {
			PacchettoEntrate otherPacchettoEntrate = (PacchettoEntrate) other;
			return idCliente == otherPacchettoEntrate.idCliente
					&& dataAcquisto.equals(otherPacchettoEntrate.dataAcquisto)
					&& tipo.equals(otherPacchettoEntrate.tipo)
					&& entrateRimaste == otherPacchettoEntrate.entrateRimaste;
		}
		return false;
	}

	@Override
	public int hashCode() {
		return Objects.hash(idCliente, dataAcquisto, tipo, entrateRimaste);
	}

}
