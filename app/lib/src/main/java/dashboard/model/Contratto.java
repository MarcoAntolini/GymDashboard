package dashboard.model;

import java.sql.Date;
import java.util.Objects;
import java.util.Optional;

public class Contratto {

	public enum TipoContratto {

		TEMPO_INDETERMINATO("Tempo indeterminato"), TEMPO_DETERMINATO("Tempo determinato");

		private final String tipo;

		TipoContratto(String tipo) {
			this.tipo = tipo;
		}

		@Override
		public String toString() {
			return tipo;
		}

	}

	private final int idDipendente;
	private final Date dataInizio;
	private final Optional<Date> dataFine;
	private final TipoContratto tipo;
	private final double costoOrario;

	public Contratto(int idDipendente, Date dataInizio, Date dataFine, TipoContratto tipo, double costoOrario) {
		this.idDipendente = Objects.requireNonNull(idDipendente);
		this.dataInizio = Objects.requireNonNull(dataInizio);
		this.dataFine = Optional.ofNullable(dataFine);
		this.tipo = Objects.requireNonNull(tipo);
		this.costoOrario = Objects.requireNonNull(costoOrario);
	}

	public Contratto(int idDipendente, Date dataInizio, TipoContratto tipo, double costoOrario) {
		this(idDipendente, dataInizio, null, tipo, costoOrario);
	}

	public int getIdDipendente() {
		return idDipendente;
	}

	public Date getDataInizio() {
		return dataInizio;
	}

	public Optional<Date> getDataFine() {
		return dataFine;
	}

	public TipoContratto getTipo() {
		return tipo;
	}

	public double getCostoOrario() {
		return costoOrario;
	}

	@Override
	public String toString() {
		return "Contratto [idDipendente=" + idDipendente + ", dataInizio=" + dataInizio + ", dataFine=" + dataFine
				+ ", tipo=" + tipo + ", costoOrario=" + costoOrario + "]";
	}

	@Override
	public boolean equals(Object other) {
		return (other instanceof Contratto) && ((Contratto) other).getIdDipendente() == this.getIdDipendente()
				&& ((Contratto) other).getDataInizio().equals(this.getDataInizio())
				&& ((Contratto) other).getDataFine().equals(this.getDataFine())
				&& ((Contratto) other).getTipo().equals(this.getTipo())
				&& ((Contratto) other).getCostoOrario() == this.getCostoOrario();
	}

	@Override
	public int hashCode() {
		return idDipendente + dataInizio.hashCode() + dataFine.hashCode() + tipo.hashCode() + (int) costoOrario;
	}

}
