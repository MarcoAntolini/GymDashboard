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

	public Object[] toArray() {
		return new Object[] {
				getPrezzo(),
				getNumeroEntrate(),
				getAnnoListino()
		};
	}

	@Override
	public String toString() {
		return new StringBuilder().append(annoListino).append(" - ").append(numeroEntrate).append(" - ").append(prezzo)
				.toString();
	}

	@Override
	public boolean equals(Object other) {
		return (other instanceof TipoPacchettoEntrate)
				&& ((TipoPacchettoEntrate) other).getAnnoListino().equals(this.getAnnoListino())
				&& ((TipoPacchettoEntrate) other).getNumeroEntrate().equals(this.getNumeroEntrate())
				&& ((TipoPacchettoEntrate) other).getPrezzo() == this.getPrezzo();
	}

	@Override
	public int hashCode() {
		return Objects.hash(annoListino, numeroEntrate, prezzo);
	}

}
