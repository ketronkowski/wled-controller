package com.wledcontroller

import com.wledcontroller.dto.DiscoveredDevice
import com.wledcontroller.service.WledService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.CommandLineRunner
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Bean
import org.springframework.web.client.RestClient
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import javax.jmdns.JmDNS
import javax.jmdns.ServiceEvent
import javax.jmdns.ServiceListener

@SpringBootApplication
class DiscoveryWorkerApplication {
    private val log = LoggerFactory.getLogger(DiscoveryWorkerApplication::class.java)
    private val discovered = ConcurrentHashMap<String, Boolean>()

    @Value("\${discovery.backend-callback-url:http://localhost:8080}")
    private lateinit var backendUrl: String

    @Value("\${wled.discovery.udp-port:21324}")
    private var udpPort: Int = 21324

    @Bean
    fun discoveryRunner(wledService: WledService, restClient: RestClient) = CommandLineRunner {
        log.info("Discovery worker starting — callback URL: $backendUrl")
        val executor = Executors.newVirtualThreadPerTaskExecutor()

        // mDNS listener
        executor.submit {
            try {
                val jmdns = JmDNS.create()
                val listener = object : ServiceListener {
                    override fun serviceAdded(event: ServiceEvent) {
                        jmdns.requestServiceInfo(event.type, event.name, 500)
                    }
                    override fun serviceRemoved(event: ServiceEvent) {}
                    override fun serviceResolved(event: ServiceEvent) {
                        val ip = event.info.inetAddresses?.firstOrNull()?.hostAddress ?: return
                        probeAndReport(ip, wledService, restClient)
                    }
                }
                jmdns.addServiceListener("_wled._tcp.local.", listener)
                jmdns.addServiceListener("_http._tcp.local.", listener)
                log.info("mDNS browser active")
                // Run indefinitely
                Thread.currentThread().join()
            } catch (e: Exception) {
                log.error("mDNS browser error: ${e.message}", e)
            }
        }

        // UDP listener
        executor.submit {
            try {
                DatagramSocket(udpPort).use { socket ->
                    log.info("UDP listener active on port $udpPort")
                    val buf = ByteArray(1024)
                    while (true) {
                        val packet = DatagramPacket(buf, buf.size)
                        socket.receive(packet)
                        val ip = packet.address.hostAddress ?: continue
                        probeAndReport(ip, wledService, restClient)
                    }
                }
            } catch (e: Exception) {
                log.error("UDP listener error: ${e.message}", e)
            }
        }
    }

    private fun probeAndReport(ip: String, wledService: WledService, restClient: RestClient) {
        if (!discovered.putIfAbsent(ip, true).let { it == null }) return
        val info = wledService.getInfo(ip) ?: run { discovered.remove(ip); return }

        val device = DiscoveredDevice(
            ip = ip,
            name = info.name.ifBlank { "WLED-${info.mac.takeLast(6)}" },
            mac = info.mac,
            firmware = info.ver,
            ledCount = info.leds.count,
        )

        runCatching {
            restClient.post()
                .uri("$backendUrl/api/discovery/ingest")
                .body(device)
                .retrieve()
                .toBodilessEntity()
            log.info("Reported device $ip (${device.name}) to backend")
        }.onFailure {
            log.warn("Failed to report $ip to backend: ${it.message}")
            discovered.remove(ip)
        }
    }
}

fun main(args: Array<String>) {
    runApplication<DiscoveryWorkerApplication>(*args) {
        setAdditionalProfiles("discovery")
    }
}
