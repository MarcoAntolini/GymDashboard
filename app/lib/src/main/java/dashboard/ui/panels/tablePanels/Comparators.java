package dashboard.ui.panels.tablePanels;

import java.sql.Date;
import java.util.Comparator;

@SuppressWarnings({ "unused", "java:S1201" })
public final class Comparators {

	public static final Comparator<Integer> INTEGER = new Comparators().new IntComparator();
	public static final Comparator<Double> DOUBLE = new Comparators().new DoubleComparator();
	public static final Comparator<String> STRING = new Comparators().new StringComparator();
	public static final Comparator<Date> DATE = new Comparators().new DateComparator();

	private Comparators() {
	}

	private final class IntComparator implements Comparator<Integer> {

		public int compare(Integer o1, Integer o2) {
			Integer int1 = o1;
			Integer int2 = o2;
			return int1.compareTo(int2);
		}

		public boolean equals(Integer o2) {
			return this.equals(o2);
		}

	}

	private final class DoubleComparator implements Comparator<Double> {

		public int compare(Double o1, Double o2) {
			Double double1 = o1;
			Double double2 = o2;
			return double1.compareTo(double2);
		}

		public boolean equals(Double o2) {
			return this.equals(o2);
		}

	}

	private final class StringComparator implements Comparator<String> {

		public int compare(String o1, String o2) {
			String string1 = o1;
			String string2 = o2;
			return string1.compareTo(string2);
		}

		public boolean equals(String o2) {
			return this.equals(o2);
		}

	}

	private final class DateComparator implements Comparator<Date> {

		public int compare(Date o1, Date o2) {
			Date date1 = o1;
			Date date2 = o2;
			return date1.compareTo(date2);
		}

		public boolean equals(Date o2) {
			return this.equals(o2);
		}

	}

}
