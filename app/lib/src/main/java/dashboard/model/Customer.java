package dashboard.model;

import java.sql.Date;
import java.util.Objects;
import java.util.Optional;

/***
 * Class representing a Customer.
 */
public class Customer {

	private final int id;
	private final String firstName;
	private final String lastName;
	private final Optional<Date> birthday;

	public Customer(final int id, final String firstName, final String lastName, final Optional<Date> birthday) {
		this.id = id;
		this.firstName = Objects.requireNonNull(firstName);
		this.lastName = Objects.requireNonNull(lastName);
		this.birthday = Objects.requireNonNull(birthday);
	}

	public Customer(final int id, final String firstName, final String lastName) {
		this(id, firstName, lastName, Optional.empty());
	}

	public int getId() {
		return this.id;
	}

	public String getFirstName() {
		return this.firstName;
	}

	public String getLastName() {
		return this.lastName;
	}

	public Optional<Date> getBirthday() {
		return this.birthday;
	}

	@Override
	public String toString() {
		return new StringBuilder()
				.append("(").append(id).append(") ")
				.append(firstName).append(" ").append(lastName)
				.append(" - ").append(birthday).toString();
	}

	@Override
	public boolean equals(final Object other) {
		return (other instanceof Customer)
				&& ((Customer) other).getId() == this.getId()
				&& ((Customer) other).getFirstName().equals(this.getFirstName())
				&& ((Customer) other).getLastName().equals(this.getLastName())
				&& ((Customer) other).getBirthday().equals(this.getBirthday());
	}

	@Override
	public int hashCode() {
		return Objects.hash(birthday, firstName, id, lastName);
	}

}
