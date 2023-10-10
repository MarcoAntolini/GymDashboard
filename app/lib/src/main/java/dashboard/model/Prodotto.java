package dashboard.model;

import java.util.Objects;

public class Prodotto {

	private final String codice;

	public Prodotto(final String codice) {
		this.codice = Objects.requireNonNull(codice);
	}

	public String getCodice() {
		return codice;
	}

	public Object[] toArray() {
		return new Object[] {
				getCodice()
		};
	}

	@Override
	public String toString() {
		return new StringBuilder()
				.append("(").append(getCodice()).append(") ")
				.toString();
	}

	@Override
	public boolean equals(final Object other) {
		return (other instanceof Prodotto)
				&& ((Prodotto) other).getCodice().equals(this.getCodice());
	}

	@Override
	public int hashCode() {
		return Objects.hash(codice);
	}

}
