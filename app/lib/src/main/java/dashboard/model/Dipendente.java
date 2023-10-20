package dashboard.model;

import java.sql.Date;
import java.util.Objects;

public class Dipendente extends Persona {

	private final Date dataAssunzione;

	public Dipendente(final String codiceFiscale, final String nome, final String cognome, final Date dataNascita,
			final Indirizzo indirizzo, final Contatto contatto, final Date dataAssunzione) {
		super(codiceFiscale, nome, cognome, dataNascita, indirizzo, contatto);
		this.dataAssunzione = Objects.requireNonNull(dataAssunzione);
	}

	public Dipendente(final int id, final String codiceFiscale, final String nome, final String cognome,
			final Date dataNascita, final Indirizzo indirizzo, final Contatto contatto, final Date dataAssunzione) {
		super(id, codiceFiscale, nome, cognome, dataNascita, indirizzo, contatto);
		this.dataAssunzione = Objects.requireNonNull(dataAssunzione);
	}

	public Date getDataAssunzione() {
		return this.dataAssunzione;
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
				getIndirizzo().getCittà(),
				getIndirizzo().getProvincia(),
				getContatto().getTelefono(),
				getContatto().getEmail(),
				getDataAssunzione(),
		};
	}

	@Override
	public String toString() {
		return new StringBuilder()
				.append("(").append(getCodiceFiscale()).append(") ")
				.append(getNome()).append(" ")
				.append(getCognome()).append(" - ")
				.append(getDataNascita()).append(" - ")
				.append(getContatto().toString()).append(" - ")
				.append(getIndirizzo().toString()).append(" - ")
				.append(getDataAssunzione())
				.toString();
	}

	@Override
	public boolean equals(Object other) {
		return (super.equals(other))
				&& (other instanceof Dipendente)
				&& ((Dipendente) other).getDataAssunzione().equals(this.getDataAssunzione());
	}

	@Override
	public int hashCode() {
		return super.hashCode() + Objects.hash(dataAssunzione);
	}

}
