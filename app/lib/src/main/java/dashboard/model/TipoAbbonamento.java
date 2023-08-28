package dashboard.model;

import java.time.Year;
import java.util.Objects;

public class TipoAbbonamento {

	public enum DurataAbbonamento {

		SETTIMANALE("Settimanale"),
		BISETTIMANALE("Bisettimanale"),
		MENSILE("Mensile"),
		BIMESTRALE("Bimestrale"),
		TRIMESTRALE("Trimestrale"),
		SEMESTRALE("Semestrale"),
		ANNUALE("Annuale");

		private final String durata;

		DurataAbbonamento(String durata) {
			this.durata = durata;
		}

		@Override
		public String toString() {
			return durata;
		}

	}

	private final Year annoListino;
	private final DurataAbbonamento durata;
	private final double prezzo;

	public TipoAbbonamento(Year annoListino, DurataAbbonamento durata, double prezzo) {
		this.annoListino = Objects.requireNonNull(annoListino);
		this.durata = Objects.requireNonNull(durata);
		this.prezzo = Objects.requireNonNull(prezzo);
	}

	public Year getAnnoListino() {
		return annoListino;
	}

	public DurataAbbonamento getDurata() {
		return durata;
	}

	public double getPrezzo() {
		return prezzo;
	}

	@Override
	public String toString() {
		return new StringBuilder().append(annoListino).append(" - ").append(durata).append(" - ").append(prezzo)
				.toString();
	}

	@Override
	public boolean equals(Object other) {
		return (other instanceof TipoAbbonamento)
				&& ((TipoAbbonamento) other).getAnnoListino().equals(this.getAnnoListino())
				&& ((TipoAbbonamento) other).getDurata().equals(this.getDurata())
				&& ((TipoAbbonamento) other).getPrezzo() == this.getPrezzo();
	}

	@Override
	public int hashCode() {
		return Objects.hash(annoListino, durata, prezzo);
	}

}
