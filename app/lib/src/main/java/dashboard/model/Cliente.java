package dashboard.model;

import java.sql.Date;
import java.util.Objects;

public class Cliente extends Persona {

	private final Date dataIscrizione;
	private int entrateRimaste;

	public Cliente(final String codiceFiscale, final String nome, final String cognome, final Date dataNascita,
			final Indirizzo indirizzo, final Contatto contatto, final Date dataIscrizione) {
		super(codiceFiscale, nome, cognome, dataNascita, indirizzo, contatto);
		this.dataIscrizione = Objects.requireNonNull(dataIscrizione);
		this.entrateRimaste = 0;
	}

	public Cliente(final int id, final String codiceFiscale, final String nome, final String cognome,
			final Date dataNascita, final Indirizzo indirizzo, final Contatto contatto, final Date dataIscrizione,
			final int entrateRimaste) {
		super(id, codiceFiscale, nome, cognome, dataNascita, indirizzo, contatto);
		this.dataIscrizione = Objects.requireNonNull(dataIscrizione);
		this.entrateRimaste = Objects.requireNonNull(entrateRimaste);
	}

	public Date getDataIscrizione() {
		return this.dataIscrizione;
	}

	public int getEntrateRimaste() {
		return this.entrateRimaste;
	}

	public void incrementEntrateRimaste(final int entrateRimaste) {
		this.entrateRimaste += entrateRimaste;
	}

	public void decrementEntrateRimaste() {
		this.entrateRimaste--;
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
				getDataIscrizione(),
				getEntrateRimaste()
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
				.append(getDataIscrizione()).append(" - ")
				.append(getEntrateRimaste())
				.toString();
	}

	@Override
	public boolean equals(Object other) {
		return (super.equals(other))
				&& (other instanceof Cliente)
				&& ((Cliente) other).getDataIscrizione().equals(this.getDataIscrizione())
				&& ((Cliente) other).getEntrateRimaste() == this.getEntrateRimaste();
	}

	@Override
	public int hashCode() {
		return super.hashCode() + Objects.hash(dataIscrizione, entrateRimaste);
	}

}
