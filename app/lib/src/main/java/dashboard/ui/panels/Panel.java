package dashboard.ui.panels;

import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.SwingConstants;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.JTableHeader;
import javax.swing.table.TableCellRenderer;
import javax.swing.table.TableColumn;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Dimension;

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

	private static final int HEADERS_PADDING = 10;
	private static final int COLUMNS_PADDING = 5;

	protected final JPanel actionsPanel = new JPanel();
	protected final JPanel tablePanel = new JPanel();

	protected String[] columnNames;
	protected DefaultTableModel model;
	protected JTable table;
	protected JScrollPane tableScrollbar;

	protected Panel() {
		super(new BorderLayout(HORIZONTAL_GAP, VERTICAL_GAP));
		actionsPanel.setPreferredSize(ACTIONS_PANEL_SIZE);
		tablePanel.setPreferredSize(TABLE_PANEL_SIZE);

		add(actionsPanel, BorderLayout.WEST);
		add(tablePanel, BorderLayout.CENTER);
	}

	protected void setupTablePanel() {
		model = new DefaultTableModel(columnNames, 0);
		table = new JTable(model);
		tableScrollbar = new JScrollPane(table);
		table.setShowHorizontalLines(true);
		table.setShowVerticalLines(false);
		table.setGridColor(Color.LIGHT_GRAY);
		table.setAutoResizeMode(JTable.AUTO_RESIZE_OFF);
		table.setFillsViewportHeight(true);
		table.setEnabled(false);
		setHeadersWidth();
		tablePanel.setLayout(new BorderLayout());
		tablePanel.add(tableScrollbar, BorderLayout.CENTER);
	}

	protected void addDataToTable(Object[] data) {
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
			int headerWidth = header.getPreferredSize().width;
			for (int j = 0; j < table.getRowCount(); j++) {
				TableCellRenderer cRenderer = table.getCellRenderer(j, i);
				if (cRenderer == null) {
					cRenderer = table.getDefaultRenderer(table.getColumnClass(i));
				}
				Component cell = table.prepareRenderer(cRenderer, j, i);
				int cellWidth = cell.getPreferredSize().width;
				maxWidth = headerWidth > cellWidth
						? Math.max(maxWidth, headerWidth + HEADERS_PADDING)
						: Math.max(maxWidth, cellWidth);
			}
			table.getColumnModel().getColumn(i).setPreferredWidth(maxWidth + COLUMNS_PADDING);
		}
	}

}
