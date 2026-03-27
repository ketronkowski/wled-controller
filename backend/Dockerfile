FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace

# Cache Gradle wrapper and root build files
COPY gradlew gradlew.bat settings.gradle.kts build.gradle.kts ./
COPY gradle ./gradle
COPY backend/build.gradle.kts ./backend/build.gradle.kts

# Warm up the dependency cache
RUN mkdir -p backend/src/main/kotlin && \
    ./gradlew :backend:dependencies --no-daemon -q 2>/dev/null || true

# Build
COPY backend/src ./backend/src
RUN ./gradlew :backend:bootJar --no-daemon -x test

FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
COPY --from=build /workspace/backend/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
