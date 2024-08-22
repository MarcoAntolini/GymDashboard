package dashboard.ui.components.inputs;

import javax.swing.JComponent;
import javax.swing.JLabel;
import javax.swing.JPanel;

import java.awt.BorderLayout;

public class JLabeledInput extends JPanel {

	public enum LabelPosition {
		LEFT, TOP
	}

	public JLabeledInput(final JComponent inputComponent, final String labelText, final LabelPosition labelPosition) {
		final JLabel label = new JLabel(labelText);
		setLayout(new BorderLayout());
		add(inputComponent, BorderLayout.CENTER);
		if (labelPosition.equals(LabelPosition.LEFT)) {
			add(label, BorderLayout.WEST);
		} else if (labelPosition.equals(LabelPosition.TOP)) {
			add(label, BorderLayout.NORTH);
		}
	}

	public JLabeledInput(final JComponent inputComponent, final String labelText) {
		this(inputComponent, labelText, LabelPosition.LEFT);
	}

}
