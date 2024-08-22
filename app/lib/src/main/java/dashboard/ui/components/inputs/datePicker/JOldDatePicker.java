package dashboard.ui.components.inputs.datePicker;

import javax.swing.JComboBox;

import java.util.Arrays;

public class JOldDatePicker extends JDatePicker {

	private static final int OLDEST_YEAR = CURRENT_YEAR - 100;

	private String[] elapsedMonths;
	private String[] elapsedDays;

	public JOldDatePicker() {
		super();
	}

	@Override
	protected void setupYearSelector() {
		years = new String[CURRENT_YEAR - OLDEST_YEAR + 1];
		for (int i = 0; i < years.length; i++) {
			years[i] = String.valueOf(OLDEST_YEAR + i);
		}
		yearSelector = new JComboBox<>(years);
		yearSelector.setSelectedIndex(years.length - 1);
		yearSelector.addActionListener(e -> {
			fillMonthSelector();
			fillDaySelector();
		});
	}

	@Override
	protected void setupMonthSelector() {
		monthSelector = new JComboBox<>(elapsedMonths);
		monthSelector.setSelectedIndex(elapsedMonths.length - 1);
		monthSelector.addActionListener(e -> fillDaySelector());
	}

	@Override
	protected void setupDaySelector() {
		daySelector = new JComboBox<>(elapsedDays);
		daySelector.setSelectedIndex(elapsedDays.length - 1);
	}

	@Override
	protected void fillMonthSelector() {
		final int selectedYear = Integer.parseInt(yearSelector.getSelectedItem().toString());
		monthSelector.removeAllItems();
		if (CURRENT_YEAR == selectedYear) {
			for (final String month : elapsedMonths) {
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
			final String[] elapsedWeekDays = addWeekDays(selectedYear, selectedMonth);
			for (final String day : elapsedWeekDays) {
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
		elapsedMonths = Arrays.copyOfRange(months, 0, CURRENT_MONTH + 1);
		elapsedDays = Arrays.copyOfRange(days, 0, CURRENT_DAY);
	}

}
