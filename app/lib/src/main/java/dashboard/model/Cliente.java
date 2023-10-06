package dashboard.model;

import java.sql.Date;
import java.util.Objects;

public class Cliente extends Persona {

	private final Date dataIscrizione;

	public Cliente(final String codiceFiscale, final String nome, final String cognome, final Date dataNascita,
			final Indirizzo indirizzo, final Contatto contatto, final Date dataIscrizione) {
		super(codiceFiscale, nome, cognome, dataNascita, indirizzo, contatto);
		this.dataIscrizione = Objects.requireNonNull(dataIscrizione);
	}

	public Date getDataIscrizione() {
		return this.dataIscrizione;
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
				getDataIscrizione()
		};
	}

	@Override
	public String toString() {
		return new StringBuilder().append("(").append(getCodiceFiscale()).append(") ").append(getNome()).append(" ")
				.append(getCognome()).append(" - ").append(getDataNascita()).append(" - ").append(getDataIscrizione())
				.toString();
	}

	@Override
	public boolean equals(Object other) {
		return (super.equals(other))
				&& (other instanceof Cliente)
				&& ((Cliente) other).getDataIscrizione().equals(this.getDataIscrizione());
	}

	@Override
	public int hashCode() {
		return super.hashCode() + Objects.hash(dataIscrizione);
	}

}
