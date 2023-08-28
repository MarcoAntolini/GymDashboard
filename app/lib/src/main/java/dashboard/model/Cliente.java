package dashboard.model;

import java.sql.Date;
import java.util.Objects;

public class Cliente extends Persona {

	private final Date dataIscrizione;

	public Cliente(final String codiceFiscale, final String nome, final String cognome, final Date dataNascita,
			final String telefono, final String email, final Date dataIscrizione) {
		super(codiceFiscale, nome, cognome, dataNascita, telefono, email);
		this.dataIscrizione = Objects.requireNonNull(dataIscrizione);
	}

	public Cliente(final String codiceFiscale, final String nome, final String cognome, final Date dataNascita,
			final Date dataIscrizione) {
		this(codiceFiscale, nome, cognome, dataNascita, null, null, dataIscrizione);
	}

	@Override
	public Cliente addEmail(final String email) {
		return (Cliente) super.addEmail(email);
	}

	@Override
	public Cliente addTelefono(final String telefono) {
		return (Cliente) super.addTelefono(telefono);
	}

	public Date getDataIscrizione() {
		return this.dataIscrizione;
	}

	@Override
	public String toString() {
		return new StringBuilder().append("(").append(getCodiceFiscale()).append(") ").append(getNome()).append(" ")
				.append(getCognome()).append(" - ").append(getDataNascita()).append(" - ").append(getDataIscrizione())
				.toString();
	}

	@Override
	public boolean equals(Object other) {
		return (other instanceof Cliente) && ((Cliente) other).getCodiceFiscale().equals(this.getCodiceFiscale())
				&& ((Cliente) other).getNome().equals(this.getNome())
				&& ((Cliente) other).getCognome().equals(this.getCognome())
				&& ((Cliente) other).getDataNascita().equals(this.getDataNascita())
				&& ((Cliente) other).getDataIscrizione().equals(this.getDataIscrizione());
	}

	@Override
	public int hashCode() {
		return super.hashCode() + Objects.hash(dataIscrizione);
	}

}
