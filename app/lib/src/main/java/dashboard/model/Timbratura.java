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

	public int getIdDipendente() {
		return idDipendente;
	}

	public Date getEntrata() {
		return entrata;
	}

	public void setUscita(final Date uscita) {
		this.uscita = Objects.requireNonNull(uscita);
	}

	public Date getUscita() {
		return uscita;
	}

}
