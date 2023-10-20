package dashboard.ui.components.layouts;

import javax.swing.JComponent;
import javax.swing.JLabel;
import javax.swing.JPanel;

import java.awt.BorderLayout;

public class JLabeledInput extends JPanel {

	public enum LabelPosition {
		WEST, NORTH
	}

	public JLabeledInput(final JComponent inputComponent, final String labelText, final LabelPosition labelPosition) {
		final JLabel label = new JLabel(labelText);
		setLayout(new BorderLayout());
		add(inputComponent, BorderLayout.CENTER);
		if (labelPosition.equals(LabelPosition.WEST)) {
			add(label, BorderLayout.WEST);
		} else if (labelPosition.equals(LabelPosition.NORTH)) {
			add(label, BorderLayout.NORTH);
		}
	}

}
