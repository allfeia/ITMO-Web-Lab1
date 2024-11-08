import com.fastcgi.FCGIInterface;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

class Main {
    static DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    static int r;
    private static final String RESULT_JSON = """
            {
                "answer": %b,
                "executionTime": "%s",
                "currentTime": "%s"
            }
            """;
    private static final String HTTP_RESPONSE = """
        HTTP/1.1 200 OK
        Content-Type: application/json
        Content-Length: %d
        
        %s
        """;
    private static final String HTTP_ERROR = """
        HTTP/1.1 400 Bad Request
        Content-Type: application/json
        Content-Length: %d
        
        %s
        """;
    private static final String ERROR_JSON = """
        {
            "reason": "%s"
        }
        """;

    public static void main(String[] args) throws IOException {
        var fcgiInterface = new FCGIInterface();
        while (fcgiInterface.FCGIaccept() >= 0) {
            long startTime = System.nanoTime();
            try {
                var queryParams = System.getProperties().getProperty("QUERY_STRING");

                // Разбираем QUERY_STRING
                Map<String, String> params = new HashMap<>();
                if (queryParams != null && !queryParams.isEmpty()) {
                    String[] pairs = queryParams.split("&");
                    for (String pair : pairs) {
                        String[] keyValue = pair.split("=");
                        if (keyValue.length == 2) {
                            params.put(keyValue[0], keyValue[1]);
                        }
                    }
                }

                float x = Float.parseFloat(params.get("x"));
                float y = Float.parseFloat(params.get("y"));
                r = Integer.parseInt(params.get("r"));

                if (x < -4 || x > 4 || y < -5 || y > 3 || !validateY(String.valueOf(y))|| r < 1 || r > 5){
                    throw new IllegalArgumentException("Wrong parameters");
                }

                boolean insideRectangle = isInsideRectangle(x, y, r, r);
                boolean insidePolygon = isInsidePolygon(x, y);
                boolean insidePath = isInsidePath(x, y);

                var json = String.format(RESULT_JSON, insideRectangle || insidePolygon || insidePath, System.nanoTime() - startTime, LocalDateTime.now().format(formatter));
                var responseBody = json.trim(); // Удаляем лишние пробелы
                var response = String.format(HTTP_RESPONSE, responseBody.getBytes(StandardCharsets.UTF_8).length, responseBody);
                try {
                    FCGIInterface.request.outStream.write(response.getBytes(StandardCharsets.UTF_8));
                    FCGIInterface.request.outStream.flush();
                } catch (IOException e) {
                    e.printStackTrace();
                }

            } catch (Exception ex) {
                var json = String.format(ERROR_JSON, ex.getMessage());
                var responseBody = json.trim(); // Удаляем лишние пробелы
                var response = String.format(HTTP_ERROR, responseBody.getBytes(StandardCharsets.UTF_8).length, responseBody);
                FCGIInterface.request.outStream.write(response.getBytes(StandardCharsets.UTF_8));
                FCGIInterface.request.outStream.flush();
            }
        }
    }

    public static boolean validateY(String input) {
        // Заменяем запятую на точку
        String sanitizedInput = input.trim().replace(',', '.');

        // Регулярное выражение для проверки числа
        Pattern pattern = Pattern.compile("^-?\\d+(\\.\\d{1,2})?$");
        Matcher matcher = pattern.matcher(sanitizedInput);

        // Проверка валидности
        if (!matcher.matches()) {
            System.out.println("Wrong parameter");
            return false;
        }
        return true;
    }

    private static boolean isInsideRectangle(double px, double py, double width, double height) {
        double rectX = 0;
        double rectY = 0;

        return (px >= rectX && px <= rectX + width) && (py >= rectY && py <= rectY + height);
    }

    private static boolean isInsidePolygon(double px, double py) {
        return (px <= 0 && py <= 0 && py >= -px - r);
    }

    private static boolean isInsidePath(double x, double y) {
        double centerX = 0;
        double centerY = 0;
        double radius = r / 2;
        if (x >= centerX && y <= centerY && x <= (centerX + radius) && y >= (centerY - radius)) {
            double distanceSquared = Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2);
            if (distanceSquared <= Math.pow(radius, 2)) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
}