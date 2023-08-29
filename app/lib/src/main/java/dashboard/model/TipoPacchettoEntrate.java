package dashboard.model;

import java.time.Year;
import java.util.Objects;

public class TipoPacchettoEntrate {

	public enum NumeroEntrate {

		UNA(1), CINQUE(5), DIECI(10), VENTI(20), TRENTA(30), CINQUANTA(50);

		private final int numero;

		NumeroEntrate(final int numero) {
			this.numero = numero;
		}

		public int getNumero() {
			return numero;
		}

		public static NumeroEntrate findNumero(final int numero) {
			for (NumeroEntrate enumValue : NumeroEntrate.values()) {
				if (enumValue.getNumero() == numero) {
					return enumValue;
				}
			}
			return null;
		}

	}

	private final Year annoListino;
	private final NumeroEntrate numeroEntrate;
	private final double prezzo;

	public TipoPacchettoEntrate(final Year annoListino, final NumeroEntrate numeroEntrate, final double prezzo) {
		this.annoListino = Objects.requireNonNull(annoListino);
		this.numeroEntrate = Objects.requireNonNull(numeroEntrate);
		this.prezzo = Objects.requireNonNull(prezzo);
	}

	public Year getAnnoListino() {
		return annoListino;
	}

	public NumeroEntrate getNumeroEntrate() {
		return numeroEntrate;
	}

	public double getPrezzo() {
		return prezzo;
	}

	@Override
	public String toString() {
		return new StringBuilder().append(annoListino).append(" - ").append(numeroEntrate).append(" - ").append(prezzo)
				.toString();
	}

	@Override
	public boolean equals(Object other) {
		if (other instanceof TipoPacchettoEntrate) {
			TipoPacchettoEntrate otherTipoPacchettoEntrate = (TipoPacchettoEntrate) other;
			return annoListino.equals(otherTipoPacchettoEntrate.annoListino)
					&& numeroEntrate.equals(otherTipoPacchettoEntrate.numeroEntrate)
					&& prezzo == otherTipoPacchettoEntrate.prezzo;
		}
		return false;
	}

	@Override
	public int hashCode() {
		return Objects.hash(annoListino, numeroEntrate, prezzo);
	}

}
