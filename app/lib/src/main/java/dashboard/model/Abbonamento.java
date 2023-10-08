package dashboard.model;

import java.util.Objects;

public class Abbonamento {

	private final String codice;
	private final int durata;

	public Abbonamento(final int durata) {
		this.codice = "A_".concat(
				durata < 10
						? "0".concat(String.valueOf(durata))
						: String.valueOf(durata));
		this.durata = Objects.requireNonNull(durata);
	}

	public Abbonamento(final String codice, final int durata) {
		this.codice = Objects.requireNonNull(codice);
		this.durata = Objects.requireNonNull(durata);
	}

	public String getCodice() {
		return codice;
	}

	public int getDurata() {
		return durata;
	}

	public Object[] toArray() {
		return new Object[] {
				getCodice(),
				getDurata(),
		};
	}

	@Override
	public String toString() {
		return new StringBuilder()
				.append(getDurata()).append(" mesi")
				.append(" (").append(getCodice()).append(")")
				.toString();
	}

	@Override
	public boolean equals(Object other) {
		return (other instanceof Abbonamento)
				&& ((Abbonamento) other).getCodice().equals(this.getCodice())
				&& ((Abbonamento) other).getDurata() == this.getDurata();
	}

	@Override
	public int hashCode() {
		return Objects.hash(codice, durata);
	}

}
