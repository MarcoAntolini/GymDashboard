package dashboard.model;

import java.sql.Date;
import java.util.Objects;

public class Acquisto {

	private final int idCliente;
	private final Date dataOra;
	private final double importo;
	private final TipoProdotto tipoProdotto;
	private final String codiceProdotto;

	public Acquisto(final int idCliente, final Date dataOra, final double importo,
			final String tipoAcquisto, final String codiceProdotto) {
		this.idCliente = Objects.requireNonNull(idCliente);
		this.dataOra = Objects.requireNonNull(dataOra);
		this.importo = Objects.requireNonNull(importo);
		this.tipoProdotto = Objects.requireNonNull(TipoProdotto.valueOf(tipoAcquisto));
		this.codiceProdotto = Objects.requireNonNull(codiceProdotto);
	}

	public int getIdCliente() {
		return idCliente;
	}

	public Date getDataOra() {
		return dataOra;
	}

	public double getImporto() {
		return importo;
	}

	public String getTipoProdotto() {
		return tipoProdotto.getTipo();
	}

	public String getCodiceProdotto() {
		return codiceProdotto;
	}

	public Object[] toArray() {
		return new Object[] {
				getIdCliente(),
				getDataOra(),
				getImporto(),
				getTipoProdotto(),
				getCodiceProdotto()
		};
	}

	@Override
	public String toString() {
		return new StringBuilder()
				.append("(").append(getIdCliente()).append(") ")
				.append(getDataOra()).append(" - ")
				.append(getImporto()).append(" - ")
				.append(getTipoProdotto()).append(" - ")
				.append(getCodiceProdotto())
				.toString();
	}

	@Override
	public boolean equals(Object other) {
		return (other instanceof Acquisto)
				&& ((Acquisto) other).getIdCliente() == this.getIdCliente()
				&& ((Acquisto) other).getDataOra().equals(this.getDataOra())
				&& ((Acquisto) other).getImporto() == this.getImporto()
				&& ((Acquisto) other).getTipoProdotto().equals(this.getTipoProdotto())
				&& ((Acquisto) other).getCodiceProdotto().equals(this.getCodiceProdotto());
	}

	@Override
	public int hashCode() {
		return Objects.hash(idCliente, dataOra, importo, tipoProdotto, codiceProdotto);
	}

}
