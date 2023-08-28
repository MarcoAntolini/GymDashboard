package dashboard.model;

import java.time.Year;
import java.util.Objects;

public class Listino {

	private final Year anno;

	public Listino(int anno) {
		this.anno = Year.of(Objects.requireNonNull(anno));
	}

	public Year getAnno() {
		return anno;
	}

}
