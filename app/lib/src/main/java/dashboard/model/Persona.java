package dashboard.model;

import java.sql.Date;
import java.util.Objects;
import java.util.Optional;

public abstract class Persona {

	public class Indirizzo {

		private final String via;
		private final String numero;
		private final String citta;
		private final String provincia;

		public Indirizzo(final String via, final String numero, final String citta, final String provincia) {
			this.via = Objects.requireNonNull(via);
			this.numero = Objects.requireNonNull(numero);
			this.citta = Objects.requireNonNull(citta);
			this.provincia = Objects.requireNonNull(provincia);
		}

		public String getVia() {
			return this.via;
		}

		public String getNumero() {
			return this.numero;
		}

		public String getCitta() {
			return this.citta;
		}

		public String getProvincia() {
			return this.provincia;
		}

		@Override
		public String toString() {
			return new StringBuilder().append(via).append(" ").append(numero).append(" - ").append(citta).append(" (")
					.append(provincia).append(")").toString();
		}

		@Override
		public boolean equals(final Object other) {
			return (other instanceof Indirizzo)
					&& ((Indirizzo) other).getVia().equals(this.getVia())
					&& ((Indirizzo) other).getNumero().equals(this.getNumero())
					&& ((Indirizzo) other).getCitta().equals(this.getCitta())
					&& ((Indirizzo) other).getProvincia().equals(this.getProvincia());
		}

		@Override
		public int hashCode() {
			return Objects.hash(via, numero, citta, provincia);
		}

	}

	public class Contatto {

		private Optional<String> telefono;
		private Optional<String> email;

		public Contatto(final String telefono, final String email) {
			this.telefono = Optional.ofNullable(telefono);
			this.email = Optional.ofNullable(email);
		}

		public Contatto() {
			this.telefono = Optional.empty();
			this.email = Optional.empty();
		}

		public Contatto addTelefono(final String telefono) {
			setTelefono(telefono);
			return this;
		}

		public Contatto addEmail(final String email) {
			setEmail(email);
			return this;
		}

		public void setTelefono(final String telefono) {
			this.telefono = Optional.ofNullable(telefono);
		}

		public void setEmail(final String email) {
			this.email = Optional.ofNullable(email);
		}

		public boolean removeTelefono() {
			if (this.email.isPresent()) {
				this.telefono = Optional.empty();
				return true;
			}
			return false;
		}

		public boolean removeEmail() {
			if (this.telefono.isPresent()) {
				this.email = Optional.empty();
				return true;
			}
			return false;
		}

		public String getTelefono() {
			return this.telefono.get();
		}

		public String getEmail() {
			return this.email.get();
		}

		public boolean isValid() {
			return this.telefono.isPresent() || this.email.isPresent();
		}

		@Override
		public String toString() {
			return new StringBuilder().append(telefono).append(" - ").append(email).toString();
		}

		@Override
		public boolean equals(final Object other) {
			return (other instanceof Contatto)
					&& ((Contatto) other).getTelefono().equals(this.getTelefono())
					&& ((Contatto) other).getEmail().equals(this.getEmail());
		}

		@Override
		public int hashCode() {
			return Objects.hash(telefono, email);
		}

	}

	private final String codiceFiscale;
	private final String nome;
	private final String cognome;
	private final Date dataNascita;
	private Indirizzo indirizzo;
	private Contatto contatto;
	private int id;

	protected Persona(final String codiceFiscale, final String nome, final String cognome, final Date dataNascita,
			final Indirizzo indirizzo, final Contatto contatto) {
		this.codiceFiscale = Objects.requireNonNull(codiceFiscale);
		this.nome = Objects.requireNonNull(nome);
		this.cognome = Objects.requireNonNull(cognome);
		this.dataNascita = Objects.requireNonNull(dataNascita);
		this.indirizzo = Objects.requireNonNull(indirizzo);
		this.contatto = Objects.requireNonNull(contatto);
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

	public Contatto getContatto() {
		return this.contatto;
	}

	public Indirizzo getIndirizzo() {
		return this.indirizzo;
	}

	public void setIndirizzo(final Indirizzo indirizzo) {
		this.indirizzo = Objects.requireNonNull(indirizzo);
	}

	public int getId() {
		return this.id;
	}

	public void setId(final int id) {
		this.id = Objects.requireNonNull(id);
	}

	@Override
	public String toString() {
		return new StringBuilder().append("(").append(getCodiceFiscale()).append(") ").append(getNome()).append(" ")
				.append(getCognome()).append(" - ").append(getDataNascita()).append(" - ").append(getContatto())
				.toString();
	}

	@Override
	public boolean equals(final Object other) {
		return (other instanceof Persona)
				&& ((Persona) other).getCodiceFiscale().equals(this.getCodiceFiscale())
				&& ((Persona) other).getNome().equals(this.getNome())
				&& ((Persona) other).getCognome().equals(this.getCognome())
				&& ((Persona) other).getDataNascita().equals(this.getDataNascita())
				&& ((Persona) other).getContatto().equals(this.getContatto());
	}

	@Override
	public int hashCode() {
		return Objects.hash(codiceFiscale, nome, cognome, dataNascita, contatto);
	}

}
