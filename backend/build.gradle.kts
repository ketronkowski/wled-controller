repositories {
    mavenCentral()
}

plugins {
    kotlin("jvm")
    kotlin("plugin.spring")
    id("org.springframework.boot")
    id("io.spring.dependency-management")
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-mongodb")
    implementation("org.springframework.boot:spring-boot-starter-websocket")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-restclient")
    implementation("tools.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jmdns:jmdns:3.6.1")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("de.flapdoodle.embed:de.flapdoodle.embed.mongo.spring3x:4.20.0")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.4.0")
}

tasks.withType<Test> {
    useJUnitPlatform()
}

tasks.named<org.springframework.boot.gradle.tasks.bundling.BootJar>("bootJar") {
    mainClass.set("com.wledcontroller.WledControllerApplicationKt")
}

tasks.named<org.springframework.boot.gradle.tasks.bundling.BootBuildImage>("bootBuildImage") {
    builder = "paketobuildpacks/builder-jammy-base:latest"
    imageName = "ghcr.io/ketronkowski/wled-backend:${project.version}"
    environment = mapOf("BP_JVM_VERSION" to "21")
}

// Separate fat jar for discovery worker
tasks.register<org.springframework.boot.gradle.tasks.bundling.BootJar>("discoveryJar") {
    archiveClassifier = "discovery"
    mainClass = "com.wledcontroller.DiscoveryWorkerApplicationKt"
    from(sourceSets.main.get().output)
    configurations.runtimeClasspath.get().forEach { file ->
        from(zipTree(file))
    }
}
