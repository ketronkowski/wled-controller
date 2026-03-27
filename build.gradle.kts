plugins {
    kotlin("jvm") version "2.2.0" apply false
    kotlin("plugin.spring") version "2.2.0" apply false
    id("org.springframework.boot") version "3.5.3" apply false
    id("io.spring.dependency-management") version "1.1.7" apply false
    id("com.github.node-gradle.node") version "7.1.0" apply false
}

subprojects {
    group = "com.wledcontroller"
    version = "1.0.0-SNAPSHOT"
}
