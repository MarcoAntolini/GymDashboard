package dashboard.model;

import java.util.Objects;

public class PacchettoEntrate {

	private final String codice;
	private final int numeroEntrate;

	public PacchettoEntrate(final int numeroEntrate) {
		this.numeroEntrate = Objects.requireNonNull(numeroEntrate);
		this.codice = "E_".concat(
				numeroEntrate < 10
						? "0".concat(String.valueOf(numeroEntrate))
						: String.valueOf(numeroEntrate));
	}

	public String getCodice() {
		return codice;
	}

	public int getNumeroEntrate() {
		return numeroEntrate;
	}

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
		return Objects.hash(codice, numeroEntrate);
	}

}
