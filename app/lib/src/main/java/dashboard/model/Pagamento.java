package dashboard.model;

import java.sql.Date;
import java.util.Objects;

public class Pagamento {

	public enum TipoPagamento {

		STIPENDIO("stipendio"),
		ATTREZZATURA("attrezzatura"),
		BOLLETTA("bolletta"),
		INTERVENTO("intervento");

		private final String tipo;

		TipoPagamento(String tipo) {
			this.tipo = tipo;
		}

		public String getTipo() {
			return tipo;
		}

	}

	private final int id;
	private final Date dataOra;
	private final double importo;
	private final TipoPagamento tipo;

	public Pagamento(final int id, final Date dataOra, final double importo, final String tipo) {
		this.id = Objects.requireNonNull(id);
		this.dataOra = Objects.requireNonNull(dataOra);
		this.importo = Objects.requireNonNull(importo);
		this.tipo = Objects.requireNonNull(TipoPagamento.valueOf(tipo));
	}

	public int getId() {
		return id;
	}

	public Date getDataOra() {
		return dataOra;
	}

	public double getImporto() {
		return importo;
	}

	public String getTipo() {
		return tipo.getTipo();
	}

	public Object[] toArray() {
		return new Object[] {
				getId(),
				getDataOra(),
				getImporto(),
				getTipo()
		};
	}

	@Override
	public String toString() {
		return new StringBuilder()
				.append("(").append(getId()).append(") ")
				.append(getDataOra()).append(" - ")
				.append(getImporto()).append(" - ")
				.append(getTipo())
				.toString();
	}

	@Override
	public boolean equals(Object other) {
		return (other instanceof Pagamento)
				&& ((Pagamento) other).getId() == this.getId()
				&& ((Pagamento) other).getDataOra().equals(this.getDataOra())
				&& ((Pagamento) other).getImporto() == this.getImporto()
				&& ((Pagamento) other).getTipo().equals(this.getTipo());
	}

	@Override
	public int hashCode() {
		return Objects.hash(id, dataOra, importo, tipo);
	}

}
