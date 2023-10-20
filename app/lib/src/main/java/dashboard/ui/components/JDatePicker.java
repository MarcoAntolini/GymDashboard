package dashboard.ui.components;

import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JPanel;

import java.sql.Date;
import java.util.Calendar;
import java.util.Locale;

@SuppressWarnings({ "java:S1450", "java:S1153" })
public class JDatePicker extends JPanel {

	private static final int CURRENT_YEAR = Calendar.getInstance().get(Calendar.YEAR);
	private static final int OLDEST_YEAR = CURRENT_YEAR - 100;
	private String[] years;
	private static final int CURRENT_MONTH = Calendar.getInstance().get(Calendar.MONTH);
	private static final String[] months = {
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"Dicember"
	};
	private static final int CURRENT_DAY = Calendar.getInstance().get(Calendar.DAY_OF_MONTH);
	private String[] days;
	private int daysInMonth;

	private final JLabel label;
	private JComboBox<String> yearSelector;
	private JComboBox<String> monthSelector;
	private JComboBox<String> daySelector;

	// TODO: parametro tipo: SCADENZA o NASCITA (in base al tipo di range. da oggi
	// in poi o da oggi indietro)

	public JDatePicker(final String labelText) {
		label = new JLabel(labelText);
		setupYearSelector();
		setupMonthSelector();
		setupDaySelector();
		add(label);
		add(daySelector);
		add(monthSelector);
		add(yearSelector);
	}

	private void setupYearSelector() {
		years = new String[CURRENT_YEAR - OLDEST_YEAR + 1];
		for (int i = 0; i < years.length; i++) {
			years[i] = String.valueOf(OLDEST_YEAR + i);
		}
		yearSelector = new JComboBox<>(years);
		yearSelector.setSelectedIndex(CURRENT_YEAR - OLDEST_YEAR);
		yearSelector.addActionListener(e -> updateDaysInMonth());
	}

	private void setupMonthSelector() {
		monthSelector = new JComboBox<>(months);
		monthSelector.setSelectedIndex(CURRENT_MONTH);
		monthSelector.addActionListener(e -> updateDaysInMonth());
	}

	private void setupDaySelector() {
		daysInMonth = Calendar.getInstance().getActualMaximum(Calendar.DAY_OF_MONTH);
		final Calendar calendar = Calendar.getInstance();
		calendar.set(Calendar.YEAR, Integer.parseInt(yearSelector.getSelectedItem().toString()));
		calendar.set(Calendar.MONTH, monthSelector.getSelectedIndex());
		days = new String[daysInMonth];
		for (int i = 0; i < days.length; i++) {
			calendar.set(Calendar.DAY_OF_MONTH, i + 1);
			String dayOfWeek = calendar.getDisplayName(Calendar.DAY_OF_WEEK, Calendar.SHORT, Locale.getDefault());
			days[i] = String.valueOf(i + 1) + " " + dayOfWeek;
		}
		daySelector = new JComboBox<>(days);
		daySelector.setSelectedIndex(CURRENT_DAY - 1);
	}

	private void updateDaysInMonth() {
		final int oldDaysInMonth = daysInMonth;
		final int oldSelectedIndex = daySelector.getSelectedIndex();
		final Calendar calendar = Calendar.getInstance();
		calendar.set(Calendar.YEAR, Integer.parseInt(yearSelector.getSelectedItem().toString()));
		calendar.set(Calendar.MONTH, monthSelector.getSelectedIndex());
		daysInMonth = calendar.getActualMaximum(Calendar.DAY_OF_MONTH);
		days = new String[daysInMonth];
		for (int i = 0; i < days.length; i++) {
			calendar.set(Calendar.DAY_OF_MONTH, i + 1);
			String dayOfWeek = calendar.getDisplayName(Calendar.DAY_OF_WEEK, Calendar.SHORT, Locale.getDefault());
			days[i] = String.valueOf(i + 1) + " " + dayOfWeek;
		}
		daySelector.removeAllItems();
		for (final String day : days) {
			daySelector.addItem(day);
		}
		System.out.println(oldDaysInMonth + " - " + daysInMonth);
		if (oldDaysInMonth <= daysInMonth) {
			daySelector.setSelectedIndex(oldSelectedIndex);
		} else {
			daySelector.setSelectedIndex(daysInMonth - 1);
		}
	}

	public Date getDate() {
		final Calendar calendar = Calendar.getInstance();
		calendar.set(Calendar.YEAR, Integer.parseInt(yearSelector.getSelectedItem().toString()));
		calendar.set(Calendar.MONTH, monthSelector.getSelectedIndex() + 1);
		calendar.set(Calendar.DAY_OF_MONTH, daySelector.getSelectedIndex() + 1);
		return new Date(calendar.getTimeInMillis());
	}

}
