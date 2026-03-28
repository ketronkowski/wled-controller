# Build stage always runs on the native builder platform (amd64 in CI)
# so Gradle never runs under slow QEMU emulation.
# Only the final runtime stage picks the target platform (arm64 for Pi).
FROM --platform=$BUILDPLATFORM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace

COPY gradlew gradlew.bat settings.gradle.kts build.gradle.kts ./
COPY gradle ./gradle
COPY backend/build.gradle.kts ./backend/build.gradle.kts
# frontend dir must exist so Gradle can configure the :frontend subproject
# (settings.gradle.kts includes "frontend"), even though we don't build it here
COPY frontend/build.gradle.kts ./frontend/build.gradle.kts

RUN mkdir -p backend/src/main/kotlin && \
    ./gradlew :backend:dependencies --no-daemon -q 2>/dev/null || true

COPY backend/src ./backend/src
RUN ./gradlew :backend:bootJar --no-daemon -x test

FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
COPY --from=build /workspace/backend/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
