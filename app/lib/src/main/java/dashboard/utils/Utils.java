package dashboard.utils;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Optional;

public final class Utils {

    private static final String DATE_FORMAT_STRING = "dd/MM/yyyy";

    private Utils() {
    }

    public static java.util.Date sqlDateToDate(final java.sql.Date sqlDate) {
        return sqlDate == null ? null : new java.util.Date(sqlDate.getTime());
    }

    public static java.sql.Date dateToSqlDate(final java.util.Date date) {
        return date == null ? null : new java.sql.Date(date.getTime());
    }

    public static Optional<java.sql.Date> buildSqlDate(final int day, final int month, final int year) {
        try {
            final String dateString = day + "/" + month + "/" + year;
            final java.util.Date date = new SimpleDateFormat(DATE_FORMAT_STRING).parse(dateString);
            return Optional.of(dateToSqlDate(date));
        } catch (ParseException e) {
            e.printStackTrace();
            return Optional.empty();
        }
    }

}
