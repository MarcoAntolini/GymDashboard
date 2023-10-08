package dashboard.model;

import java.util.Objects;

public class Stipendio {

	private final int id;
	private final int idDipendente;

	public Stipendio(final int id, final int idDipendente) {
		this.id = Objects.requireNonNull(id);
		this.idDipendente = Objects.requireNonNull(idDipendente);
	}

	public int getId() {
		return id;
	}

	public int getIdDipendente() {
		return idDipendente;
	}

	public Object[] toArray() {
		return new Object[] {
				getId(),
				getIdDipendente()
		};
	}

	@Override
	public String toString() {
		return new StringBuilder()
				.append("(").append(getId()).append(") ")
				.append(getIdDipendente())
				.toString();
	}

	@Override
	public boolean equals(Object other) {
		return (other instanceof Stipendio)
				&& ((Stipendio) other).getId() == this.getId()
				&& ((Stipendio) other).getIdDipendente() == this.getIdDipendente();
	}

	@Override
	public int hashCode() {
		return Objects.hash(id, idDipendente);
	}

}
