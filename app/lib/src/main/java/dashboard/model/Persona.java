package dashboard.model;

import java.sql.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

public abstract class Persona {

	private static final String TELEFONO = "telefono";
	private static final String EMAIL = "email";
	private final String codiceFiscale;
	private final String nome;
	private final String cognome;
	private final Date dataNascita;
	private Map<String, Optional<String>> contatto;
	private int id;

	protected Persona(final String codiceFiscale, final String nome, final String cognome, final Date dataNascita,
			final Optional<String> telefono, final Optional<String> email) {
		this.codiceFiscale = Objects.requireNonNull(codiceFiscale);
		this.nome = Objects.requireNonNull(nome);
		this.cognome = Objects.requireNonNull(cognome);
		this.dataNascita = Objects.requireNonNull(dataNascita);
		this.contatto = new HashMap<>();
		contatto.put(TELEFONO, Optional.of(telefono).orElse(Optional.empty()));
		contatto.put(EMAIL, Optional.of(email).orElse(Optional.empty()));
	}

	protected Persona(final String codiceFiscale, final String nome, final String cognome, final Date dataNascita) {
		this(codiceFiscale, nome, cognome, dataNascita, Optional.empty(), Optional.empty());
	}

	public String getCodiceFiscale() {
		return this.codiceFiscale;
	}

	public String getNome() {
		return this.nome;
	}

	public String getCognome() {
		return this.cognome;
	}

	public Date getDataNascita() {
		return this.dataNascita;
	}

	public Optional<String> getTelefono() {
		return this.contatto.get(TELEFONO).isEmpty() ? Optional.empty() : this.contatto.get(TELEFONO);
	}

	public Optional<String> getEmail() {
		return this.contatto.get(EMAIL).isEmpty() ? Optional.empty() : this.contatto.get(EMAIL);
	}

	public void setTelefono(final String telefono) {
		this.contatto.put(TELEFONO, Optional.of(telefono));
	}

	public void setEmail(final String email) {
		this.contatto.put(EMAIL, Optional.of(email));
	}

	public int getId() {
		return this.id;
	}

	public void setId(final int id) {
		this.id = id;
	}

	@Override
	public String toString() {
		return new StringBuilder().append("(").append(codiceFiscale).append(") ").append(nome).append(" ")
				.append(cognome).append(" - ").append(dataNascita).append(" - ").append(contatto).toString();
	}

	@Override
	public boolean equals(final Object other) {
		return (other instanceof Persona) && ((Persona) other).getCodiceFiscale().equals(this.getCodiceFiscale())
				&& ((Persona) other).getNome().equals(this.getNome())
				&& ((Persona) other).getCognome().equals(this.getCognome())
				&& ((Persona) other).getDataNascita().equals(this.getDataNascita())
				&& ((Persona) other).getTelefono().equals(this.getTelefono())
				&& ((Persona) other).getEmail().equals(this.getEmail());
	}

	@Override
	public int hashCode() {
		return Objects.hash(codiceFiscale, contatto, dataNascita, nome, cognome);
	}

}
