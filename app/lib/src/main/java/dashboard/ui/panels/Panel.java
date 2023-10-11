package dashboard.ui.panels;

import dashboard.utils.Comparators;

import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.SwingConstants;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.JTableHeader;
import javax.swing.table.TableCellRenderer;
import javax.swing.table.TableColumn;
import javax.swing.table.TableRowSorter;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Dimension;
import java.util.LinkedHashMap;

import static dashboard.utils.Screen.DEFAULT_HEIGHT;
import static dashboard.utils.Screen.DEFAULT_WIDTH;

public abstract class Panel extends JPanel {

	private static class CenteredHeaderRenderer implements TableCellRenderer {

		private final DefaultTableCellRenderer renderer;

		public CenteredHeaderRenderer(JTable table) {
			renderer = (DefaultTableCellRenderer) table.getTableHeader().getDefaultRenderer();
			renderer.setHorizontalAlignment(SwingConstants.CENTER);
		}

		@Override
		public Component getTableCellRendererComponent(JTable table, Object value, boolean isSelected, boolean hasFocus,
				int row, int column) {
			return renderer.getTableCellRendererComponent(table, value, isSelected, hasFocus, row, column);
		}
	}

	private static final int HORIZONTAL_GAP = 15;
	private static final int VERTICAL_GAP = 0;

	private static final int ACTIONS_PANEL_WIDTH = (DEFAULT_WIDTH * 1 / 4) - HORIZONTAL_GAP / 2;
	private static final int TABLE_PANEL_WIDTH = (DEFAULT_WIDTH * 3 / 4) - HORIZONTAL_GAP / 2;
	private static final Dimension ACTIONS_PANEL_SIZE = new Dimension(ACTIONS_PANEL_WIDTH, DEFAULT_HEIGHT);
	private static final Dimension TABLE_PANEL_SIZE = new Dimension(TABLE_PANEL_WIDTH, DEFAULT_HEIGHT);

	private static final int HEADERS_PADDING = 20;
	private static final int COLUMNS_PADDING = 15;
	private static final int MIN_PADDING = 5;

	protected final JPanel actionsPanel;
	protected final JPanel tablePanel;
	private DefaultTableModel model;
	protected JTable table;
	protected String[] columnNames;
	protected Class<?>[] columnTypes;
	protected transient TableRowSorter<DefaultTableModel> sorter;

	protected Panel() {
		super(new BorderLayout(HORIZONTAL_GAP, VERTICAL_GAP));
		actionsPanel = new JPanel();
		tablePanel = new JPanel();
		actionsPanel.setPreferredSize(ACTIONS_PANEL_SIZE);
		tablePanel.setPreferredSize(TABLE_PANEL_SIZE);

		add(actionsPanel, BorderLayout.WEST);
		add(tablePanel, BorderLayout.CENTER);
	}

	protected void setupTablePanel() {
		model = new DefaultTableModel(columnNames, 0);
		table = new JTable(model);
		sorter = new TableRowSorter<>(model);
		table.setRowSorter(sorter);
		JScrollPane tableScrollbar = new JScrollPane(table);
		table.setShowHorizontalLines(true);
		table.setShowVerticalLines(false);
		table.setGridColor(Color.LIGHT_GRAY);
		table.setAutoResizeMode(JTable.AUTO_RESIZE_OFF);
		table.setFillsViewportHeight(true);
		table.setEnabled(false);
		table.setAutoCreateRowSorter(false);
		setHeadersWidth();
		setColumnTypes(columnTypes);
		tablePanel.setLayout(new BorderLayout());
		tablePanel.add(tableScrollbar, BorderLayout.CENTER);
	}

	protected void setColumns(final LinkedHashMap<String, Class<?>> columns) {
		columnNames = columns.keySet().toArray(new String[0]);
		columnTypes = columns.values().toArray(new Class<?>[0]);
	}

	private void setColumnTypes(final Class<?>[] classTypes) {
		for (int i = 0; i < classTypes.length; i++) {
			Class<?> className = classTypes[i];
			switch (className.getSimpleName()) {
				case "Integer":
					sorter.setComparator(i, Comparators.INTEGER);
					break;
				case "Double":
					sorter.setComparator(i, Comparators.DOUBLE);
					break;
				case "String":
					sorter.setComparator(i, Comparators.STRING);
					break;
				case "Date":
					sorter.setComparator(i, Comparators.DATE);
					break;
				default:
					break;
			}
		}
	}

	protected void addDataToTable(final Object[] data) {
		model.addRow(data);
		setColumnsWidth();
	}

	protected void setHeadersWidth() {
		JTableHeader tableHeader = table.getTableHeader();
		for (int i = 0; i < table.getColumnCount(); i++) {
			TableColumn column = table.getColumnModel().getColumn(i);
			TableCellRenderer renderer = column.getHeaderRenderer();
			if (renderer == null) {
				renderer = tableHeader.getDefaultRenderer();
			}
			Component header = renderer.getTableCellRendererComponent(table, column.getHeaderValue(), false, false, -1, i);
			int headerWidth = header.getPreferredSize().width;
			column.setPreferredWidth(headerWidth + HEADERS_PADDING);
		}
		tableHeader.setDefaultRenderer(new CenteredHeaderRenderer(table));
	}

	protected void setColumnsWidth() {
		JTableHeader tableHeader = table.getTableHeader();
		for (int i = 0; i < table.getColumnCount(); i++) {
			int maxWidth = 0;
			TableColumn column = table.getColumnModel().getColumn(i);
			TableCellRenderer hRenderer = column.getHeaderRenderer();
			if (hRenderer == null) {
				hRenderer = tableHeader.getDefaultRenderer();
			}
			Component header = hRenderer.getTableCellRendererComponent(table, column.getHeaderValue(), false, false, -1, i);
			int headerWidth = header.getPreferredSize().width + HEADERS_PADDING;
			for (int j = 0; j < table.getRowCount(); j++) {
				TableCellRenderer cRenderer = table.getCellRenderer(j, i);
				if (cRenderer == null) {
					cRenderer = table.getDefaultRenderer(table.getColumnClass(i));
				}
				Component cell = table.prepareRenderer(cRenderer, j, i);
				int cellWidth = cell.getPreferredSize().width + COLUMNS_PADDING;
				maxWidth = headerWidth > cellWidth
						? Math.max(maxWidth, headerWidth)
						: Math.max(maxWidth, cellWidth);
			}
			table.getColumnModel().getColumn(i).setPreferredWidth(maxWidth + MIN_PADDING);
		}
	}

}
