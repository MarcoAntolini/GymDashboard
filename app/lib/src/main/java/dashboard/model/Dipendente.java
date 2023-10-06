package dashboard.model;

import java.sql.Date;
import java.util.Objects;

public class Dipendente extends Persona {

	private final Date dataAssunzione;
	private double stipendio;

	public Dipendente(final String codiceFiscale, final String nome, final String cognome, final Date dataNascita,
			final Indirizzo indirizzo, final Contatto contatto, final Date dataAssunzione, final double stipendio) {
		super(codiceFiscale, nome, cognome, dataNascita, indirizzo, contatto);
		this.dataAssunzione = Objects.requireNonNull(dataAssunzione);
		this.stipendio = Objects.requireNonNull(stipendio);
	}

	public Date getDataAssunzione() {
		return this.dataAssunzione;
	}

	public double getStipendio() {
		return this.stipendio;
	}

	public void setStipendio(final int stipendio) {
		this.stipendio = Objects.requireNonNull(stipendio);
	}

	public Object[] toArray() {
		return new Object[] {
				getId(),
				getCodiceFiscale(),
				getNome(),
				getCognome(),
				getDataNascita(),
				getIndirizzo().getVia(),
				getIndirizzo().getNumero(),
				getIndirizzo().getCitta(),
				getIndirizzo().getProvincia(),
				getContatto().getTelefono(),
				getContatto().getEmail(),
				getDataAssunzione(),
				getStipendio()
		};
	}

	@Override
	public String toString() {
		return new StringBuilder().append("(").append(getCodiceFiscale()).append(") ").append(getNome()).append(" ")
				.append(getCognome()).append(" - ").append(getDataNascita()).append(" - ").append(getDataAssunzione())
				.append(" - ").append(getStipendio()).toString();
	}

	@Override
	public boolean equals(Object other) {
		return (super.equals(other))
				&& (other instanceof Dipendente)
				&& ((Dipendente) other).getDataAssunzione().equals(this.getDataAssunzione())
				&& ((Dipendente) other).getStipendio() == this.getStipendio();
	}

	@Override
	public int hashCode() {
		return super.hashCode() + Objects.hash(dataAssunzione, stipendio);
	}

}
