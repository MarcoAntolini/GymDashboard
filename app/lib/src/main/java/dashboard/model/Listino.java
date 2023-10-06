package dashboard.model;

import java.time.Year;
import java.util.Objects;

public class Listino {

	private final Year anno;

	public Listino(final int anno) {
		this.anno = Year.of(Objects.requireNonNull(anno));
	}

	public Year getAnno() {
		return anno;
	}

	public Object[] toArray() {
		return new Object[] {
				getAnno()
		};
	}

	@Override
	public String toString() {
		return anno.toString();
	}

	@Override
	public boolean equals(Object other) {
		return (other instanceof Listino) && ((Listino) other).getAnno().equals(this.getAnno());
	}

	@Override
	public int hashCode() {
		return Objects.hash(anno);
	}

}
