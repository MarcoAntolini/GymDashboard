package dashboard.database;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.checkerframework.checker.units.qual.K;

public abstract class DoubleKeyTable<V, K1, K2> extends SingleKeyTable<V, K1> {

	// TODO: controllare tutte le implementazioni dei metodi

	protected final ArrayList<String> primaryKeyNames;

	protected DoubleKeyTable(Connection connection) {
		super(connection);
		this.primaryKeyNames = new ArrayList<>();
	}

	public Optional<V> findByPrimaryKey(final K1 primaryKey, final K2 secondaryKey) {
		return super.findByPrimaryKey(List.of(primaryKey, secondaryKey));
	}

}
