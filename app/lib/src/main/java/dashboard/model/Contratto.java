package dashboard.model;

import java.sql.Date;
import java.util.Objects;

public class Contratto {

	public enum TipoContratto {

		TEMPO_INDETERMINATO("Tempo indeterminato"), TEMPO_DETERMINATO("Tempo determinato");

		private final String tipo;

		TipoContratto(final String tipo) {
			this.tipo = tipo;
		}

		@Override
		public String toString() {
			return tipo;
		}

	}

	private final int idDipendente;
	private final Date dataInizio;
	private final Date dataFine;
	private final TipoContratto tipo;
	private final double costoOrario;

	public Contratto(final int idDipendente, final Date dataInizio, final Date dataFine, final TipoContratto tipo,
			final double costoOrario) {
		this.idDipendente = Objects.requireNonNull(idDipendente);
		this.dataInizio = Objects.requireNonNull(dataInizio);
		this.dataFine = dataFine;
		this.tipo = Objects.requireNonNull(tipo);
		this.costoOrario = Objects.requireNonNull(costoOrario);
	}

	public Contratto(final int idDipendente, final Date dataInizio, final TipoContratto tipo, final double costoOrario) {
		this(idDipendente, dataInizio, null, tipo, costoOrario);
	}

	public int getIdDipendente() {
		return idDipendente;
	}

	public Date getDataInizio() {
		return dataInizio;
	}

	public Date getDataFine() {
		return dataFine;
	}

	public TipoContratto getTipo() {
		return tipo;
	}

	public double getCostoOrario() {
		return costoOrario;
	}

	public Object[] toArray() {
		return new Object[] {
				getIdDipendente(),
				getTipo(),
				getCostoOrario(),
				getDataInizio(),
				getDataFine()
		};
	}

	@Override
	public String toString() {
		return new StringBuilder()
				.append("(").append(getIdDipendente()).append(") ")
				.append(getDataInizio()).append(" - ")
				.append(getDataFine()).append(" - ")
				.append(getTipo()).append(" - ")
				.append(getCostoOrario())
				.toString();
	}

	@Override
	public boolean equals(Object other) {
		return (other instanceof Contratto)
				&& ((Contratto) other).getIdDipendente() == this.getIdDipendente()
				&& ((Contratto) other).getDataInizio().equals(this.getDataInizio())
				&& ((Contratto) other).getDataFine().equals(this.getDataFine())
				&& ((Contratto) other).getTipo().equals(this.getTipo())
				&& ((Contratto) other).getCostoOrario() == this.getCostoOrario();
	}

	@Override
	public int hashCode() {
		return Objects.hash(idDipendente, dataInizio, dataFine, tipo, costoOrario);
	}

}
