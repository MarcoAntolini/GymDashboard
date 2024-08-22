package dashboard.ui.components.inputs.comboBox;

import javax.swing.DefaultComboBoxModel;
import javax.swing.JComboBox;
import javax.swing.JTextField;
import javax.swing.SwingUtilities;

import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@SuppressWarnings({ "java:S2387", "unchecked" })
public class JFilteredDropdown<E> extends JComboBox<E> {

	private final JTextField filterField;
	private transient List<E> items;

	private static final List<Integer> allowedKeys = new ArrayList<>(Arrays.asList(
			KeyEvent.VK_ENTER,
			KeyEvent.VK_ESCAPE,
			KeyEvent.VK_UP,
			KeyEvent.VK_DOWN,
			KeyEvent.VK_RIGHT,
			KeyEvent.VK_LEFT,
			KeyEvent.VK_KP_UP,
			KeyEvent.VK_KP_DOWN,
			KeyEvent.VK_KP_RIGHT,
			KeyEvent.VK_KP_LEFT));

	public JFilteredDropdown(final List<E> items) {
		super(items.toArray((E[]) new Object[items.size()]));
		this.items = items;
		this.setEditable(true);
		filterField = (JTextField) this.getEditor().getEditorComponent();
		filterField.addKeyListener(new KeyAdapter() {
			@Override
			public void keyReleased(final KeyEvent ke) {
				if (!allowedKeys.contains(ke.getKeyCode())) {
					SwingUtilities.invokeLater(() -> filterOptions(filterField.getText()));
				}
			}
		});
	}

	private void filterOptions(final String filterInput) {
		if (!this.isPopupVisible()) {
			this.showPopup();
		}
		final E type = items.get(0);
		List<E> filteredItems = new ArrayList<>();
		if (type instanceof String) {
			stringFilter(filteredItems, filterInput);
		} else if (type instanceof Integer) {
			integerFilter(filteredItems, filterInput);
		}
		if (!filteredItems.isEmpty()) {
			DefaultComboBoxModel<E> model = (DefaultComboBoxModel<E>) this.getModel();
			model.removeAllElements();
			for (E value : filteredItems) {
				model.addElement(value);
			}
		} else {
			DefaultComboBoxModel<E> model = (DefaultComboBoxModel<E>) this.getModel();
			model.removeAllElements();
		}
		JTextField textfield = (JTextField) this.getEditor().getEditorComponent();
		textfield.setText(filterInput);
	}

	private void integerFilter(final List<E> filteredItems, final String filterInput) {
		for (int i = 0; i < items.size(); i++) {
			if (String.valueOf(items.get(i)).contains(filterInput)) {
				filteredItems.add(items.get(i));
			}
		}
	}

	private void stringFilter(final List<E> filteredItems, final String filterInput) {
		for (int i = 0; i < items.size(); i++) {
			if (((String) items.get(i)).toLowerCase().contains(filterInput.toLowerCase())) {
				filteredItems.add(items.get(i));
			}
		}
	}

	public E getSelectedItem() {
		return (E) super.getSelectedItem();
	}

}
