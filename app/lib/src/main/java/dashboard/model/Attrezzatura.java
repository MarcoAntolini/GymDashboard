package dashboard.model;

import java.util.Objects;

public class Attrezzatura {

	private final int id;
	private final String descrizione;
	private final String fornitore;

	public Attrezzatura(final int id, final String descrizione, final String fornitore) {
		this.id = Objects.requireNonNull(id);
		this.descrizione = Objects.requireNonNull(descrizione);
		this.fornitore = Objects.requireNonNull(fornitore);
	}

	public int getId() {
		return id;
	}

	public String getDescrizione() {
		return descrizione;
	}

	public String getFornitore() {
		return fornitore;
	}

	public Object[] toArray() {
		return new Object[] {
				getId(),
				getDescrizione(),
				getFornitore()
		};
	}

	@Override
	public String toString() {
		return new StringBuilder()
				.append("(").append(getId()).append(") ")
				.append(getDescrizione()).append(" - ")
				.append(getFornitore())
				.toString();
	}

	@Override
	public boolean equals(Object other) {
		return (other instanceof Attrezzatura)
				&& ((Attrezzatura) other).getId() == this.getId()
				&& ((Attrezzatura) other).getDescrizione().equals(this.getDescrizione())
				&& ((Attrezzatura) other).getFornitore().equals(this.getFornitore());
	}

	@Override
	public int hashCode() {
		return Objects.hash(id, descrizione, fornitore);
	}

}
