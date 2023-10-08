package dashboard.model;

import java.time.Year;
import java.util.Objects;

public class Listino {

	private final Year anno;
	private final String codiceProdotto;
	private final TipoProdotto tipoProdotto;
	private final double prezzo;

	public Listino(final Year anno, final String codiceProdotto, final TipoProdotto tipoProdotto, final double prezzo) {
		this.anno = Objects.requireNonNull(anno);
		this.codiceProdotto = Objects.requireNonNull(codiceProdotto);
		this.tipoProdotto = Objects.requireNonNull(tipoProdotto);
		this.prezzo = Objects.requireNonNull(prezzo);
	}

	public Year getAnno() {
		return anno;
	}

	public String getCodiceProdotto() {
		return codiceProdotto;
	}

	public TipoProdotto getTipoProdotto() {
		return tipoProdotto;
	}

	public double getPrezzo() {
		return prezzo;
	}

	public Object[] toArray() {
		return new Object[] {
				getAnno(),
				getTipoProdotto().getTipo(),
				getCodiceProdotto(),
				getPrezzo()
		};
	}

	@Override
	public String toString() {
		return new StringBuilder()
				.append(getAnno()).append(" ")
				.append(getTipoProdotto()).append(" ")
				.append(getCodiceProdotto()).append(" ")
				.append(getPrezzo()).append("€")
				.toString();
	}

	@Override
	public boolean equals(Object other) {
		return (other instanceof Listino)
				&& ((Listino) other).getAnno().equals(this.getAnno())
				&& ((Listino) other).getCodiceProdotto().equals(this.getCodiceProdotto())
				&& ((Listino) other).getTipoProdotto().equals(this.getTipoProdotto())
				&& ((Listino) other).getPrezzo() == this.getPrezzo();
	}

	@Override
	public int hashCode() {
		return Objects.hash(anno, codiceProdotto, tipoProdotto, prezzo);
	}

}
