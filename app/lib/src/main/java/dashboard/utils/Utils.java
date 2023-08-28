package dashboard.utils;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Optional;

/**
 * A utility class that provides helper methods for working with dates and SQL
 * dates.
 */
public final class Utils {

    private static final String DATE_FORMAT_STRING = "dd/MM/yyyy";

    private Utils() {
    }

    /**
     * Converts a SQL date to a regular Java date.
     *
     * @param sqlDate the SQL date to convert
     * @return the converted Java date, or null if the input is null
     */
    public static java.util.Date sqlDateToDate(final java.sql.Date sqlDate) {
        return sqlDate == null ? null : new java.util.Date(sqlDate.getTime());
    }

    /**
     * Converts a Java date to a SQL date.
     *
     * @param date the Java date to convert
     * @return the converted SQL date, or null if the input is null
     */
    public static java.sql.Date dateToSqlDate(final java.util.Date date) {
        return date == null ? null : new java.sql.Date(date.getTime());
    }

    /**
     * Builds an optional SQL date from the given day, month, and year.
     *
     * @param day   the day of the month (1-31)
     * @param month the month of the year (1-12)
     * @param year  the year (e.g. 2022)
     * @return an optional SQL date, or an empty optional if the input is invalid
     */
    public static Optional<java.sql.Date> buildOptionalSqlDate(final int day, final int month, final int year) {
        try {
            final String dateString = day + "/" + month + "/" + year;
            final java.util.Date date = new SimpleDateFormat(DATE_FORMAT_STRING).parse(dateString);
            return dateToSqlDate(date) == null ? Optional.empty() : Optional.of(dateToSqlDate(date));
        } catch (ParseException e) {
            e.printStackTrace();
            return Optional.empty();
        }
    }

    /**
     * Builds a SQL date from the given day, month, and year.
     *
     * @param day   the day of the month (1-31)
     * @param month the month of the year (1-12)
     * @param year  the year (e.g. 2022)
     * @return the built SQL date, or null if the input is invalid
     */
    public static java.sql.Date buildSqlDate(final int day, final int month, final int year) {
        try {
            final String dateString = day + "/" + month + "/" + year;
            final java.util.Date date = new SimpleDateFormat(DATE_FORMAT_STRING).parse(dateString);
            return dateToSqlDate(date);
        } catch (ParseException e) {
            e.printStackTrace();
            return null;
        }
    }

}
