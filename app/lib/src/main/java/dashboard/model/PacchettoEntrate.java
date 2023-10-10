package dashboard.model;

import java.util.Objects;

public class PacchettoEntrate extends Prodotto {

	private final int numeroEntrate;

	public PacchettoEntrate(final int numeroEntrate) {
		super("E_".concat(
				numeroEntrate < 10
						? "0".concat(String.valueOf(numeroEntrate))
						: String.valueOf(numeroEntrate)));
		this.numeroEntrate = Objects.requireNonNull(numeroEntrate);
	}

	public PacchettoEntrate(final String codice, final int numeroEntrate) {
		super(codice);
		this.numeroEntrate = Objects.requireNonNull(numeroEntrate);
	}

	public int getNumeroEntrate() {
		return numeroEntrate;
	}

	@Override
	public Object[] toArray() {
		return new Object[] {
				getCodice(),
				getNumeroEntrate(),
		};
	}

	@Override
	public String toString() {
		return new StringBuilder()
				.append(getNumeroEntrate()).append(" entrate")
				.append(" (").append(getCodice()).append(")")
				.toString();
	}

	@Override
	public boolean equals(Object other) {
		return other instanceof PacchettoEntrate
				&& ((PacchettoEntrate) other).getCodice().equals(this.getCodice())
				&& ((PacchettoEntrate) other).getNumeroEntrate() == this.getNumeroEntrate();
	}

	@Override
	public int hashCode() {
		return Objects.hash(getCodice(), getNumeroEntrate());
	}

}
