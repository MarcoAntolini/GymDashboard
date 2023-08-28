package dashboard.model;

import java.sql.Date;
import java.util.Objects;

public class Dipendente extends Persona {

	private final Date dataAssunzione;
	private double stipendio;

	public Dipendente(final String codiceFiscale, final String nome, final String cognome, final Date dataNascita,
			final String telefono, final String email, final Date dataAssunzione, final double stipendio) {
		super(codiceFiscale, nome, cognome, dataNascita, telefono, email);
		this.dataAssunzione = Objects.requireNonNull(dataAssunzione);
		this.stipendio = Objects.requireNonNull(stipendio);
	}

	public Dipendente(final String codiceFiscale, final String nome, final String cognome, final Date dataNascita,
			final Date dataAssunzione, final double stipendio) {
		this(codiceFiscale, nome, cognome, dataNascita, null, null, dataAssunzione, stipendio);
	}

	@Override
	public Dipendente addEmail(final String email) {
		return (Dipendente) super.addEmail(email);
	}

	@Override
	public Dipendente addTelefono(final String telefono) {
		return (Dipendente) super.addTelefono(telefono);
	}

	public Date getDataAssunzione() {
		return this.dataAssunzione;
	}

	public double getStipendio() {
		return this.stipendio;
	}

	public void setStipendio(int stipendio) {
		this.stipendio = Objects.requireNonNull(stipendio);
	}

	@Override
	public String toString() {
		return new StringBuilder().append("(").append(getCodiceFiscale()).append(") ").append(getNome()).append(" ")
				.append(getCognome()).append(" - ").append(getDataNascita()).append(" - ").append(getDataAssunzione())
				.append(" - ").append(getStipendio()).toString();
	}

	@Override
	public boolean equals(Object other) {
		return (other instanceof Dipendente) && ((Dipendente) other).getCodiceFiscale().equals(this.getCodiceFiscale())
				&& ((Dipendente) other).getNome().equals(this.getNome())
				&& ((Dipendente) other).getCognome().equals(this.getCognome())
				&& ((Dipendente) other).getDataNascita().equals(this.getDataNascita())
				&& ((Dipendente) other).getDataAssunzione().equals(this.getDataAssunzione())
				&& ((Dipendente) other).getStipendio() == this.getStipendio();
	}

	@Override
	public int hashCode() {
		return super.hashCode() + Objects.hash(dataAssunzione, stipendio);
	}

}
