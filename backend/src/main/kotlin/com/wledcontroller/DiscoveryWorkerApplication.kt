package com.wledcontroller

import com.wledcontroller.dto.DiscoveredDevice
import com.wledcontroller.model.cidrContains
import com.wledcontroller.model.cidrHostAddresses
import com.wledcontroller.service.WledService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.CommandLineRunner
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Bean
import org.springframework.core.ParameterizedTypeReference
import org.springframework.web.client.RestClient
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.net.NetworkInterface
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicReference
import javax.jmdns.JmDNS
import javax.jmdns.ServiceEvent
import javax.jmdns.ServiceListener

@SpringBootApplication
class DiscoveryWorkerApplication {
    private val log = LoggerFactory.getLogger(DiscoveryWorkerApplication::class.java)
    private val discovered = ConcurrentHashMap<String, Boolean>()
    private val activeCidrs = AtomicReference<List<String>>(emptyList())

    @Value("\${discovery.backend-callback-url:http://localhost:8080}")
    private lateinit var backendUrl: String

    @Value("\${wled.discovery.udp-port:21324}")
    private var udpPort: Int = 21324

    @Bean
    fun discoveryRunner(wledService: WledService, restClient: RestClient) = CommandLineRunner {
        log.info("Discovery worker starting — callback URL: $backendUrl")
        val executor = Executors.newVirtualThreadPerTaskExecutor()

        // Fetch configured subnets from backend; retry until backend is ready
        val cidrs = fetchSubnets(restClient)
        activeCidrs.set(cidrs)
        if (cidrs.isEmpty()) {
            log.info("No subnets configured — will discover on all available interfaces")
        } else {
            log.info("Configured subnets for discovery: $cidrs")
        }

        // Periodically refresh subnet list
        executor.submit {
            while (true) {
                Thread.sleep(60_000)
                val updated = fetchSubnets(restClient)
                if (updated != activeCidrs.get()) {
                    log.info("Subnet list updated: $updated")
                    activeCidrs.set(updated)
                }
            }
        }

        // mDNS listeners — one per configured subnet interface, or one default
        startMdnsListeners(executor, wledService, restClient)

        // UDP passive listener
        executor.submit {
            try {
                DatagramSocket(udpPort).use { socket ->
                    log.info("UDP listener active on port $udpPort")
                    val buf = ByteArray(1024)
                    while (true) {
                        val packet = DatagramPacket(buf, buf.size)
                        socket.receive(packet)
                        val ip = packet.address.hostAddress ?: continue
                        if (isInConfiguredSubnet(ip)) probeAndReport(ip, wledService, restClient)
                    }
                }
            } catch (e: Exception) {
                log.error("UDP listener error: ${e.message}", e)
            }
        }

        // Active UDP broadcast scan per configured subnet
        executor.submit {
            Thread.sleep(3_000) // give mDNS time to start first
            scanConfiguredSubnets(wledService, restClient)
            // Re-scan when subnet list changes (poll every 5 min)
            while (true) {
                Thread.sleep(300_000)
                scanConfiguredSubnets(wledService, restClient)
            }
        }
    }

    private fun startMdnsListeners(
        executor: java.util.concurrent.ExecutorService,
        wledService: WledService,
        restClient: RestClient,
    ) {
        val cidrs = activeCidrs.get()
        val bindAddresses: List<InetAddress?> = if (cidrs.isEmpty()) {
            listOf(null) // default: JmDNS picks its own interface
        } else {
            cidrs.mapNotNull { findLocalAddressInCidr(it) }.ifEmpty { listOf(null) }
        }

        for (bindAddr in bindAddresses) {
            executor.submit {
                try {
                    val jmdns = if (bindAddr != null) JmDNS.create(bindAddr) else JmDNS.create()
                    val listener = object : ServiceListener {
                        override fun serviceAdded(event: ServiceEvent) {
                            jmdns.requestServiceInfo(event.type, event.name, 500)
                        }
                        override fun serviceRemoved(event: ServiceEvent) {}
                        override fun serviceResolved(event: ServiceEvent) {
                            val ip = event.info.inetAddresses?.firstOrNull()?.hostAddress ?: return
                            if (isInConfiguredSubnet(ip)) probeAndReport(ip, wledService, restClient)
                        }
                    }
                    jmdns.addServiceListener("_wled._tcp.local.", listener)
                    jmdns.addServiceListener("_http._tcp.local.", listener)
                    log.info("mDNS browser active on interface ${bindAddr?.hostAddress ?: "default"}")
                    Thread.currentThread().join()
                } catch (e: Exception) {
                    log.error("mDNS browser error on ${bindAddr?.hostAddress}: ${e.message}", e)
                }
            }
        }
    }

    private fun scanConfiguredSubnets(wledService: WledService, restClient: RestClient) {
        val cidrs = activeCidrs.get()
        if (cidrs.isEmpty()) return
        val executor = Executors.newVirtualThreadPerTaskExecutor()
        for (cidr in cidrs) {
            val hosts = cidrHostAddresses(cidr)
            if (hosts.isEmpty()) {
                log.warn("Skipping active scan of $cidr — prefix too short (min /16) or no usable hosts")
                continue
            }
            log.info("Active HTTP scan of $cidr (${hosts.size} hosts)")
            for (ip in hosts) {
                executor.submit { probeAndReport(ip, wledService, restClient) }
            }
        }
    }

    private fun fetchSubnets(restClient: RestClient): List<String> {
        repeat(5) { attempt ->
            runCatching {
                return restClient.get()
                    .uri("$backendUrl/api/subnets/active")
                    .retrieve()
                    .body(object : ParameterizedTypeReference<List<String>>() {})
                    ?: emptyList()
            }.onFailure {
                if (attempt < 4) Thread.sleep(3_000) else log.warn("Could not fetch subnets from backend: ${it.message}")
            }
        }
        return emptyList()
    }

    private fun isInConfiguredSubnet(ip: String): Boolean {
        val cidrs = activeCidrs.get()
        if (cidrs.isEmpty()) return true // no filter configured — accept all
        return cidrs.any { cidrContains(it, ip) }
    }

    private fun findLocalAddressInCidr(cidr: String): InetAddress? =
        NetworkInterface.getNetworkInterfaces()?.toList()
            ?.flatMap { it.interfaceAddresses }
            ?.map { it.address }
            ?.firstOrNull { addr -> !addr.isLoopbackAddress && cidrContains(cidr, addr.hostAddress) }

    private fun probeAndReport(ip: String, wledService: WledService, restClient: RestClient) {
        if (discovered.putIfAbsent(ip, true) != null) return
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
