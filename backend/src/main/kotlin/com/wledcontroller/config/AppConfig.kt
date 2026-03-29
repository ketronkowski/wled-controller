package com.wledcontroller.config

import tools.jackson.core.JsonGenerator
import tools.jackson.core.JsonParser
import tools.jackson.databind.DeserializationContext
import tools.jackson.databind.SerializationContext
import tools.jackson.databind.deser.std.StdDeserializer
import tools.jackson.databind.module.SimpleModule
import tools.jackson.databind.ser.std.StdSerializer
import org.bson.types.ObjectId
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.client.RestClient

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
    fun objectIdModule(): SimpleModule = SimpleModule("ObjectIdModule").apply {
        addSerializer(ObjectId::class.java, object : StdSerializer<ObjectId>(ObjectId::class.java) {
            override fun serialize(value: ObjectId, gen: JsonGenerator, ctxt: SerializationContext) =
                gen.writeString(value.toHexString())
        })
        addDeserializer(ObjectId::class.java, object : StdDeserializer<ObjectId>(ObjectId::class.java) {
            override fun deserialize(p: JsonParser, ctxt: DeserializationContext): ObjectId =
                ObjectId(p.text)
        })
    }

    @Bean
    fun wledRestClient(props: WledHttpProperties): RestClient =
        RestClient.builder()
            .requestInterceptor { request, body, execution ->
                execution.execute(request, body)
            }
            .build()
}
