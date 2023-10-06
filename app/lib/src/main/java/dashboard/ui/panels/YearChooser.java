package dashboard.ui.panels;

import javax.swing.*;
import java.awt.*;
import java.time.Year;

public class YearChooser extends JFrame {

	private JSpinner yearSpinner;

	public YearChooser() {
		setTitle("Year Chooser Example");
		setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
		setLayout(new FlowLayout());

		yearSpinner = new JSpinner(new SpinnerNumberModel(Year.now().getValue(), 1900, 2100, 1));
		yearSpinner.setPreferredSize(new Dimension(80, 30));

		yearSpinner.addChangeListener(e -> {
			int selectedYear = (int) yearSpinner.getValue();
			System.out.println("Selected Year: " + selectedYear);
		});

		add(new JLabel("Select Year:"));
		add(yearSpinner);

		pack();
		setLocationRelativeTo(null);
		setVisible(true);
	}

	public static void main(String[] args) {
		SwingUtilities.invokeLater(YearChooser::new);
	}
}
