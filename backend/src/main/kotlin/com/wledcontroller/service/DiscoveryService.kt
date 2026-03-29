package com.wledcontroller.service

import com.wledcontroller.dto.DiscoveredDevice
import com.wledcontroller.model.cidrHostAddresses
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import javax.jmdns.JmDNS
import javax.jmdns.ServiceEvent
import javax.jmdns.ServiceListener

@Service
class DiscoveryService(
    private val wledService: WledService,
) {
    private val log = LoggerFactory.getLogger(DiscoveryService::class.java)
    private val scanning = AtomicBoolean(false)
    private val lastResults = ConcurrentHashMap<String, DiscoveredDevice>()

    fun isScanning() = scanning.get()
    fun getLastResults(): List<DiscoveredDevice> = lastResults.values.toList()

    fun scan(cidr: String? = null, timeoutMs: Long = 10_000) {
        if (!scanning.compareAndSet(false, true)) {
            log.info("Scan already in progress")
            return
        }
        lastResults.clear()

        val executor = Executors.newVirtualThreadPerTaskExecutor()
        executor.submit {
            try {
                if (cidr != null) runActiveScan(cidr)
                else {
                    runMdnsScan(timeoutMs)
                    runUdpScan(timeoutMs)
                }
            } finally {
                scanning.set(false)
            }
        }
        executor.shutdown()
    }

    private fun runActiveScan(cidr: String) {
        val hosts = cidrHostAddresses(cidr)
        if (hosts.isEmpty()) {
            log.warn("Active scan of $cidr skipped — prefix must be /16–/30")
            return
        }
        log.info("Active HTTP scan of $cidr (${hosts.size} hosts)")
        val executor = Executors.newVirtualThreadPerTaskExecutor()
        val futures = hosts.map { ip -> executor.submit { probeDevice(ip) } }
        futures.forEach { runCatching { it.get() } }
        executor.shutdown()
    }

    private fun runMdnsScan(timeoutMs: Long) {
        try {
            val jmdns = JmDNS.create()
            val listener = object : ServiceListener {
                override fun serviceAdded(event: ServiceEvent) {
                    jmdns.requestServiceInfo(event.type, event.name, 500)
                }

                override fun serviceRemoved(event: ServiceEvent) {}

                override fun serviceResolved(event: ServiceEvent) {
                    val info = event.info
                    val addresses = info.inetAddresses
                    if (addresses.isNullOrEmpty()) return
                    val ip = addresses[0].hostAddress ?: return
                    log.info("mDNS found: ${event.name} at $ip")
                    probeDevice(ip)
                }
            }

            jmdns.addServiceListener("_wled._tcp.local.", listener)
            jmdns.addServiceListener("_http._tcp.local.", listener)

            Thread.sleep(timeoutMs)
            jmdns.close()
        } catch (e: Exception) {
            log.warn("mDNS scan error: ${e.message}")
        }
    }

    private fun runUdpScan(timeoutMs: Long) {
        try {
            DatagramSocket(21324).use { socket ->
                socket.soTimeout = timeoutMs.toInt()
                val buf = ByteArray(1024)
                val deadline = System.currentTimeMillis() + timeoutMs
                while (System.currentTimeMillis() < deadline) {
                    try {
                        val packet = DatagramPacket(buf, buf.size)
                        socket.receive(packet)
                        val ip = packet.address.hostAddress ?: continue
                        if (!lastResults.containsKey(ip)) {
                            log.info("UDP broadcast from: $ip")
                            probeDevice(ip)
                        }
                    } catch (_: java.net.SocketTimeoutException) {
                        break
                    }
                }
            }
        } catch (e: Exception) {
            log.warn("UDP scan error: ${e.message}")
        }
    }

    private fun probeDevice(ip: String) {
        if (lastResults.containsKey(ip)) return
        val info = wledService.getInfo(ip) ?: return
        val device = DiscoveredDevice(
            ip = ip,
            name = info.name.ifBlank { "WLED-${info.mac.takeLast(6)}" },
            mac = info.mac,
            firmware = info.ver,
            ledCount = info.leds.count,
        )
        lastResults[ip] = device
        log.info("Confirmed WLED device: $ip (${device.name})")
    }
}
