package dashboard.ui.components.inputs;

import javax.swing.JTextField;

import java.awt.event.KeyEvent;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@SuppressWarnings("java:S3776")
public class JDoubleInput extends JTextField {

	private static final List<Integer> allowedKeys = new ArrayList<>(Arrays.asList(
			KeyEvent.VK_BACK_SPACE,
			KeyEvent.VK_DELETE,
			KeyEvent.VK_RIGHT,
			KeyEvent.VK_LEFT,
			KeyEvent.VK_KP_RIGHT,
			KeyEvent.VK_KP_LEFT));

	private static final List<Integer> numericKeys = new ArrayList<>(Arrays.asList(
			KeyEvent.VK_0, KeyEvent.VK_NUMPAD0,
			KeyEvent.VK_1, KeyEvent.VK_NUMPAD1,
			KeyEvent.VK_2, KeyEvent.VK_NUMPAD2,
			KeyEvent.VK_3, KeyEvent.VK_NUMPAD3,
			KeyEvent.VK_4, KeyEvent.VK_NUMPAD4,
			KeyEvent.VK_5, KeyEvent.VK_NUMPAD5,
			KeyEvent.VK_6, KeyEvent.VK_NUMPAD6,
			KeyEvent.VK_7, KeyEvent.VK_NUMPAD7,
			KeyEvent.VK_8, KeyEvent.VK_NUMPAD8,
			KeyEvent.VK_9, KeyEvent.VK_NUMPAD9));

	private static final List<Integer> decimalKeys = new ArrayList<>(Arrays.asList(
			KeyEvent.VK_PERIOD,
			KeyEvent.VK_COMMA,
			KeyEvent.VK_DECIMAL));

	private final int maxLength;

	public JDoubleInput(final int maxLength) {
		super(maxLength + 3);
		this.maxLength = maxLength;
	}

	@Override
	public void processKeyEvent(final KeyEvent e) {
		if (e.getID() == KeyEvent.KEY_TYPED) {
			final int k = e.getExtendedKeyCode();
			if (numericKeys.contains(k)) {
				String[] splittedNumber = getText().split("[.,]");
				if (splittedNumber[0].length() >= maxLength && getCaretPosition() <= splittedNumber[0].length()) {
					e.consume();
					return;
				}
				if (splittedNumber.length > 1 &&
						splittedNumber[1].length() >= 2 &&
						getCaretPosition() > splittedNumber[0].length()) {
					e.consume();
					return;
				}
				super.processKeyEvent(e);
			} else if (decimalKeys.contains(k)) {
				if (getText().contains(".") || getText().contains(",")) {
					e.consume();
					return;
				}
				super.processKeyEvent(e);
			}
		} else if (e.getID() == KeyEvent.KEY_PRESSED) {
			final int k = e.getKeyCode();
			if (allowedKeys.contains(k)) {
				super.processKeyEvent(e);
			} else if (k == KeyEvent.VK_UP || k == KeyEvent.VK_KP_UP) {
				if (getText().isEmpty()) {
					setText("0");
				}
				setText(String.format("%.2f", parseDouble(getText()) + 0.01));
			} else if (k == KeyEvent.VK_DOWN || k == KeyEvent.VK_KP_DOWN) {
				if (getText().isEmpty()) {
					setText("0");
				}
				if (parseDouble(getText()) <= 0.01) {
					setText("0");
					return;
				}
				setText(String.format("%.2f", parseDouble(getText()) - 0.01));
			}
		}
		e.consume();
	}

	private double parseDouble(String text) {
		try {
			return Double.parseDouble(text);
		} catch (NumberFormatException e) {
			return 0.0;
		}
	}

}