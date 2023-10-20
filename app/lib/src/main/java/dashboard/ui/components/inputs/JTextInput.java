package dashboard.ui.components.inputs;

import javax.swing.JTextField;

import java.awt.event.KeyEvent;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class JTextInput extends JTextField {

	private static final List<Integer> allowedKeys = new ArrayList<>(Arrays.asList(
			KeyEvent.VK_BACK_SPACE,
			KeyEvent.VK_DELETE,
			KeyEvent.VK_RIGHT,
			KeyEvent.VK_LEFT,
			KeyEvent.VK_KP_RIGHT,
			KeyEvent.VK_KP_LEFT));

	private final int maxLength;

	public JTextInput(final int maxLength) {
		super(maxLength);
		this.maxLength = maxLength;
	}

	@Override
	public void processKeyEvent(final KeyEvent e) {
		if (!allowedKeys.contains(e.getKeyCode()) && getText().length() >= maxLength) {
			e.consume();
			return;
		}
		super.processKeyEvent(e);
	}

}
