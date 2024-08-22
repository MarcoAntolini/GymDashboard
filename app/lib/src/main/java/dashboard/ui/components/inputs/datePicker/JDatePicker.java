package dashboard.ui.components.inputs.datePicker;

import javax.swing.JComboBox;
import javax.swing.JPanel;

import java.sql.Date;
import java.util.Calendar;
import java.util.Locale;

@SuppressWarnings({ "java:S1450", "java:S1153" })
public abstract class JDatePicker extends JPanel {

	protected static final int CURRENT_YEAR = Calendar.getInstance().get(Calendar.YEAR);
	protected String[] years;
	protected static final int CURRENT_MONTH = Calendar.getInstance().get(Calendar.MONTH);
	protected static final String[] months = {
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
			"December"
	};
	protected static final int CURRENT_DAY = Calendar.getInstance().get(Calendar.DAY_OF_MONTH);
	protected String[] days;
	protected int daysInMonth;

	protected JComboBox<String> yearSelector;
	protected JComboBox<String> monthSelector;
	protected JComboBox<String> daySelector;

	protected JDatePicker() {
		fillDays();
		initSubStrings();
		setupYearSelector();
		setupMonthSelector();
		setupDaySelector();
		add(daySelector);
		add(monthSelector);
		add(yearSelector);
	}

	protected abstract void setupYearSelector();

	protected abstract void setupMonthSelector();

	protected abstract void setupDaySelector();

	protected abstract void fillMonthSelector();

	protected abstract void fillDaySelector();

	protected abstract void initSubStrings();

	protected void fillDays() {
		final Calendar calendar = Calendar.getInstance();
		calendar.set(Calendar.YEAR, CURRENT_YEAR);
		calendar.set(Calendar.MONTH, CURRENT_MONTH);
		daysInMonth = calendar.getActualMaximum(Calendar.DAY_OF_MONTH);
		days = new String[daysInMonth];
		for (int i = 0; i < days.length; i++) {
			calendar.set(Calendar.DAY_OF_MONTH, i + 1);
			String dayOfWeek = calendar.getDisplayName(Calendar.DAY_OF_WEEK, Calendar.SHORT, Locale.getDefault());
			days[i] = String.valueOf(i + 1) + " " + dayOfWeek;
		}
	}

	protected String[] addWeekDays(final int year, final int month) {
		Calendar calendar = Calendar.getInstance();
		calendar.set(Calendar.YEAR, year);
		calendar.set(Calendar.MONTH, month);
		daysInMonth = calendar.getActualMaximum(Calendar.DAY_OF_MONTH);
		String[] weekDays = new String[daysInMonth];
		for (int i = 0; i < weekDays.length; i++) {
			calendar.set(Calendar.DAY_OF_MONTH, i + 1);
			String dayOfWeek = calendar.getDisplayName(Calendar.DAY_OF_WEEK, Calendar.SHORT, Locale.getDefault());
			weekDays[i] = String.valueOf(i + 1) + " " + dayOfWeek;
		}
		return weekDays;
	}

	public Date getDate() {
		final Calendar calendar = Calendar.getInstance();
		calendar.set(Calendar.YEAR, Integer.parseInt(yearSelector.getSelectedItem().toString()));
		calendar.set(Calendar.MONTH, monthSelector.getSelectedIndex() + 1);
		calendar.set(Calendar.DAY_OF_MONTH, daySelector.getSelectedIndex() + 1);
		return new Date(calendar.getTimeInMillis());
	}

}
