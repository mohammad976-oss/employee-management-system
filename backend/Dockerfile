FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY . .

RUN mvnw.cmd clean package -DskipTests

EXPOSE 8099

CMD ["sh", "-c", "java -jar target/*.jar"]