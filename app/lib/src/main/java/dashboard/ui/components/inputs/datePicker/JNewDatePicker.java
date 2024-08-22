package dashboard.ui.components.inputs.datePicker;

import javax.swing.JComboBox;

import java.util.Arrays;

public class JNewDatePicker extends JDatePicker {

	private static final int NEWEST_YEAR = CURRENT_YEAR + 100;

	private String[] upcomingMonths;
	private String[] upcomingDays;

	public JNewDatePicker() {
		super();
	}

	@Override
	protected void setupYearSelector() {
		years = new String[NEWEST_YEAR - CURRENT_YEAR + 1];
		for (int i = 0; i < years.length; i++) {
			years[i] = String.valueOf(CURRENT_YEAR + i);
		}
		yearSelector = new JComboBox<>(years);
		yearSelector.setSelectedIndex(0);
		yearSelector.addActionListener(e -> {
			fillMonthSelector();
			fillDaySelector();
		});
	}

	@Override
	protected void setupMonthSelector() {
		monthSelector = new JComboBox<>(upcomingMonths);
		monthSelector.setSelectedIndex(0);
		monthSelector.addActionListener(e -> fillDaySelector());
	}

	@Override
	protected void setupDaySelector() {
		daySelector = new JComboBox<>(upcomingDays);
		daySelector.setSelectedIndex(0);
	}

	@Override
	protected void fillMonthSelector() {
		final int selectedYear = Integer.parseInt(yearSelector.getSelectedItem().toString());
		monthSelector.removeAllItems();
		if (CURRENT_YEAR == selectedYear) {
			for (final String month : upcomingMonths) {
				monthSelector.addItem(month);
			}
		} else {
			for (final String month : months) {
				monthSelector.addItem(month);
			}
		}
	}

	@Override
	protected void fillDaySelector() {
		final int selectedYear = Integer.parseInt(yearSelector.getSelectedItem().toString());
		final int selectedMonth = monthSelector.getSelectedIndex();
		final int oldDaysInMonth = daysInMonth;
		final int oldSelectedIndex = daySelector.getSelectedIndex();
		daySelector.removeAllItems();
		if (CURRENT_YEAR == selectedYear && CURRENT_MONTH == selectedMonth) {
			final String[] upcomingWeekDays = addWeekDays(selectedYear, selectedMonth);
			for (final String day : upcomingWeekDays) {
				daySelector.addItem(day);
			}
		} else {
			final String[] weekDays = addWeekDays(selectedYear, selectedMonth);
			for (final String day : weekDays) {
				daySelector.addItem(day);
			}
		}
		if (oldDaysInMonth <= daysInMonth) {
			daySelector.setSelectedIndex(oldSelectedIndex);
		} else {
			daySelector.setSelectedIndex(daysInMonth - 1);
		}
	}

	@Override
	protected void initSubStrings() {
		upcomingMonths = Arrays.copyOfRange(months, CURRENT_MONTH, months.length);
		upcomingDays = Arrays.copyOfRange(days, CURRENT_DAY - 1, days.length);
	}

}
