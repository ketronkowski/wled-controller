package com.wledcontroller.config

import com.fasterxml.jackson.core.JsonGenerator
import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.SerializerProvider
import com.fasterxml.jackson.databind.deser.std.StdDeserializer
import com.fasterxml.jackson.databind.module.SimpleModule
import com.fasterxml.jackson.databind.ser.std.StdSerializer
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
            override fun serialize(value: ObjectId, gen: JsonGenerator, provider: SerializerProvider) =
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
