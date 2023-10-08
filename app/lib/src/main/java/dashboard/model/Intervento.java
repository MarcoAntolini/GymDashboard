package dashboard.model;

import java.sql.Date;
import java.util.Objects;

public class Intervento {

	private final int id;
	private final String descrizione;
	private final String fornitore;
	private final Date dataInizio;
	private final Date dataFine;

	public Intervento(final int id, final String descrizione, final String fornitore, final Date dataInizio,
			final Date dataFine) {
		this.id = Objects.requireNonNull(id);
		this.descrizione = Objects.requireNonNull(descrizione);
		this.fornitore = Objects.requireNonNull(fornitore);
		this.dataInizio = Objects.requireNonNull(dataInizio);
		this.dataFine = Objects.requireNonNull(dataFine);
	}

	public int getId() {
		return id;
	}

	public String getDescrizione() {
		return descrizione;
	}

	public String getFornitore() {
		return fornitore;
	}

	public Date getDataInizio() {
		return dataInizio;
	}

	public Date getDataFine() {
		return dataFine;
	}

	public Object[] toArray() {
		return new Object[] {
				getId(),
				getDescrizione(),
				getFornitore(),
				getDataInizio(),
				getDataFine()
		};
	}

	@Override
	public String toString() {
		return new StringBuilder()
				.append("(").append(getId()).append(") ")
				.append(getDescrizione()).append(" - ")
				.append(getFornitore()).append(" - ")
				.append(getDataInizio()).append(" - ")
				.append(getDataFine())
				.toString();
	}

	@Override
	public boolean equals(Object other) {
		return (other instanceof Intervento)
				&& ((Intervento) other).getId() == this.getId()
				&& ((Intervento) other).getDescrizione().equals(this.getDescrizione())
				&& ((Intervento) other).getFornitore().equals(this.getFornitore())
				&& ((Intervento) other).getDataInizio().equals(this.getDataInizio())
				&& ((Intervento) other).getDataFine().equals(this.getDataFine());
	}

	@Override
	public int hashCode() {
		return Objects.hash(id, descrizione, fornitore, dataInizio, dataFine);
	}

}
