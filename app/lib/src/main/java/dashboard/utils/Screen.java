package dashboard.utils;

import java.awt.Dimension;
import java.awt.Toolkit;

public final class Screen {

	public static final Dimension SCREEN_SIZE = Toolkit.getDefaultToolkit().getScreenSize();
	public static final int SCREEN_WIDTH = (int) SCREEN_SIZE.getWidth();
	public static final int SCREEN_HEIGHT = (int) SCREEN_SIZE.getHeight();
	public static final int MINIMUM_WIDTH = 800;
	public static final int MINIMUM_HEIGHT = 600;
	public static final int DEFAULT_WIDTH = MINIMUM_WIDTH;
	public static final int DEFAULT_HEIGHT = MINIMUM_HEIGHT;
	public static final Dimension DEFAULT_SIZE = new Dimension(DEFAULT_WIDTH, DEFAULT_HEIGHT);
	public static final Dimension MINIMUM_SIZE = new Dimension(MINIMUM_WIDTH, MINIMUM_HEIGHT);
	public static final Dimension MAXIMUM_SIZE = new Dimension(SCREEN_WIDTH, SCREEN_HEIGHT);

	private Screen() {
	}

}
