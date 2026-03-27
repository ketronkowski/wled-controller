package com.wledcontroller.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.client.RestClient
import java.time.Duration

@ConfigurationProperties(prefix = "wled.http")
data class WledHttpProperties(
    val connectTimeoutMs: Long = 3000,
    val readTimeoutMs: Long = 5000,
)

@ConfigurationProperties(prefix = "wled.discovery")
data class WledDiscoveryProperties(
    val timeoutMs: Long = 10000,
    val udpPort: Int = 21324,
)

@Configuration
@EnableConfigurationProperties(WledHttpProperties::class, WledDiscoveryProperties::class)
class AppConfig {

    @Bean
    fun wledRestClient(props: WledHttpProperties): RestClient =
        RestClient.builder()
            .requestInterceptor { request, body, execution ->
                execution.execute(request, body)
            }
            .build()
}
