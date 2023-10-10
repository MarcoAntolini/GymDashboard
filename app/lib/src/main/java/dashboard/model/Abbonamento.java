package dashboard.model;

import java.util.Objects;

public class Abbonamento extends Prodotto {

	private final int durata;

	public Abbonamento(final int durata) {
		super("A_".concat(
				durata < 10
						? "0".concat(String.valueOf(durata))
						: String.valueOf(durata)));
		this.durata = Objects.requireNonNull(durata);
	}

	public Abbonamento(final String codice, final int durata) {
		super(codice);
		this.durata = Objects.requireNonNull(durata);
	}

	public int getDurata() {
		return durata;
	}

	@Override
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
		return Objects.hash(getCodice(), getDurata());
	}

}
