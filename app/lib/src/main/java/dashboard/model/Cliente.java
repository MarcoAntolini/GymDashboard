package dashboard.model;

import java.sql.Date;
import java.util.Objects;
import java.util.Optional;

public class Cliente extends Persona {

	private final Date dataIscrizione;

	public Cliente(final String codiceFiscale, final String nome, final String cognome, final Date dataNascita,
			final Optional<String> telefono, final Optional<String> email, final Date dataIscrizione) {
		super(codiceFiscale, nome, cognome, dataNascita, telefono, email);
		this.dataIscrizione = Objects.requireNonNull(dataIscrizione);
	}

	public Cliente(final String codiceFiscale, final String nome, final String cognome, final Date dataNascita,
			final Date dataIscrizione) {
		this(codiceFiscale, nome, cognome, dataNascita, Optional.empty(), Optional.empty(), dataIscrizione);
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
