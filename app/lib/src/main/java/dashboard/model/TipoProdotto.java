package dashboard.model;

public enum TipoProdotto {

		ABBONAMENTO("abbonamento"),
		PACCHETTO_ENTRATE("pacchetto entrate");

		private final String tipo;

		TipoProdotto(String tipo) {
			this.tipo = tipo;
		}

		public String getTipo() {
			return tipo;
		}

	}
