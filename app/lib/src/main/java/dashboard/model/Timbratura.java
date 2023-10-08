package dashboard.model;

import java.sql.Date;
import java.util.Objects;

public class Timbratura {

	private final int idDipendente;
	private final Date entrata;
	private Date uscita;

	public Timbratura(final int idDipendente, final Date entrata) {
		this.idDipendente = Objects.requireNonNull(idDipendente);
		this.entrata = Objects.requireNonNull(entrata);
	}

	public Timbratura(final int idDipendente, final Date entrata, final Date uscita) {
		this.idDipendente = Objects.requireNonNull(idDipendente);
		this.entrata = Objects.requireNonNull(entrata);
		this.uscita = Objects.requireNonNull(uscita);
	}

	public int getIdDipendente() {
		return idDipendente;
	}

	public Date getEntrata() {
		return entrata;
	}

	public Date getUscita() {
		return uscita;
	}

	public void setUscita(final Date uscita) {
		this.uscita = Objects.requireNonNull(uscita);
	}

	public Object[] toArray() {
		return new Object[] {
				getIdDipendente(),
				getEntrata(),
				getUscita()
		};
	}

	@Override
	public String toString() {
		return new StringBuilder()
				.append("(").append(getIdDipendente()).append(") ")
				.append(getEntrata()).append(" - ")
				.append(getUscita())
				.toString();
	}

	@Override
	public boolean equals(Object other) {
		return (other instanceof Timbratura)
				&& ((Timbratura) other).getIdDipendente() == this.getIdDipendente()
				&& ((Timbratura) other).getEntrata().equals(this.getEntrata())
				&& ((Timbratura) other).getUscita().equals(this.getUscita());
	}

	@Override
	public int hashCode() {
		return Objects.hash(idDipendente, entrata, uscita);
	}

}
