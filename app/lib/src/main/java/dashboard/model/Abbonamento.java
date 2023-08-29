package dashboard.model;

import java.sql.Date;
import java.time.Year;
import java.util.Calendar;
import java.util.Objects;

import dashboard.model.TipoAbbonamento.DurataAbbonamento;

public class Abbonamento {

	private final TipoAbbonamento tipo;
	private final int idCliente;
	private final Date dataAcquisto;

	public Abbonamento(final int idCliente, final Date dataAcquisto, final TipoAbbonamento tipo) {
		this.idCliente = Objects.requireNonNull(idCliente);
		this.dataAcquisto = Objects.requireNonNull(dataAcquisto);
		this.tipo = Objects.requireNonNull(tipo);
	}

	public int getIdCliente() {
		return idCliente;
	}

	public Date getDataAcquisto() {
		return dataAcquisto;
	}

	public Date getDataScadenza() {
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(dataAcquisto);
		switch (tipo.getDurata()) {
			case SETTIMANALE:
				calendar.add(Calendar.DAY_OF_MONTH, 7);
				break;
			case BISETTIMANALE:
				calendar.add(Calendar.DAY_OF_MONTH, 14);
				break;
			case MENSILE:
				calendar.add(Calendar.MONTH, 1);
				break;
			case BIMESTRALE:
				calendar.add(Calendar.MONTH, 2);
				break;
			case TRIMESTRALE:
				calendar.add(Calendar.MONTH, 3);
				break;
			case SEMESTRALE:
				calendar.add(Calendar.MONTH, 6);
				break;
			case ANNUALE:
				calendar.add(Calendar.YEAR, 1);
				break;
			default:
				throw new IllegalArgumentException("Invalid duration: " + tipo.getDurata());
		}
		return new Date(calendar.getTimeInMillis());
	}

	public DurataAbbonamento getDurata() {
		return tipo.getDurata();
	}

	public Year getAnnoListino() {
		return tipo.getAnnoListino();
	}

}
