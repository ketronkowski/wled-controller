package com.wledcontroller.service

import com.wledcontroller.dto.ControlPayload
import com.wledcontroller.dto.DiscoveredDevice
import com.wledcontroller.model.Controller
import com.wledcontroller.model.cidrContains
import com.wledcontroller.repository.ControllerRepository
import com.wledcontroller.repository.SubnetRepository
import org.bson.types.ObjectId
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.time.Instant

@Service
class ControllerService(
    private val controllerRepository: ControllerRepository,
    private val subnetRepository: SubnetRepository,
    private val wledService: WledService,
) {
    private val log = LoggerFactory.getLogger(ControllerService::class.java)

    fun findAll(): List<Controller> = controllerRepository.findAll()

    fun findById(id: ObjectId): Controller =
        controllerRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Controller $id not found") }

    fun addManually(ip: String): Controller {
        if (controllerRepository.existsByIp(ip)) {
            return controllerRepository.findByIp(ip).get()
        }
        val info = wledService.getInfo(ip)
            ?: throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "Cannot reach WLED device at $ip")

        val controller = Controller(
            ip = ip,
            name = info.name.ifBlank { "WLED-${info.mac.takeLast(6)}" },
            mac = info.mac,
            subnet = resolveSubnet(ip),
            firmware = info.ver,
            ledCount = info.leds.count,
            addedManually = true,
            online = true,
            cachedInfo = info,
        )
        return controllerRepository.save(controller)
    }

    fun importDiscovered(device: DiscoveredDevice): Controller {
        return controllerRepository.findByIp(device.ip).orElseGet {
            controllerRepository.save(
                Controller(
                    ip = device.ip,
                    name = device.name,
                    mac = device.mac,
                    subnet = resolveSubnet(device.ip),
                    firmware = device.firmware,
                    ledCount = device.ledCount,
                    online = true,
                )
            )
        }
    }

    private fun resolveSubnet(ip: String): String {
        val configured = subnetRepository.findByEnabled(true)
        return configured.firstOrNull { cidrContains(it.cidr, ip) }?.cidr
            ?: computeSubnet(ip)
    }

    fun refreshState(id: ObjectId): Controller {
        val controller = findById(id)
        val info = wledService.getInfo(controller.ip)
        val state = wledService.getState(controller.ip)
        val online = info != null
        val updated = controller.copy(
            lastSeenAt = Instant.now(),
            online = online,
            cachedInfo = info ?: controller.cachedInfo,
            cachedState = state ?: controller.cachedState,
        )
        return controllerRepository.save(updated)
    }

    fun getLiveState(id: ObjectId): Map<String, Any?> {
        val controller = findById(id)
        val full = wledService.getFullState(controller.ip)
            ?: throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "Cannot reach ${controller.ip}")
        val effects = full.effects.ifEmpty { wledService.getEffects(controller.ip) }
        val palettes = full.palettes.ifEmpty { wledService.getPalettes(controller.ip) }
        return mapOf(
            "state" to full.state,
            "info" to full.info,
            "effects" to effects,
            "palettes" to palettes,
        )
    }

    fun getFxData(id: ObjectId): List<String> {
        val controller = findById(id)
        return wledService.getFxData(controller.ip)
    }

    fun applyCommand(id: ObjectId, payload: ControlPayload): Controller {
        val controller = findById(id)
        val patch = wledService.buildStatePatch(payload)
        val newState = wledService.setState(controller.ip, patch)
            ?: throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "Cannot reach ${controller.ip}")
        val updated = controller.copy(
            cachedState = newState,
            lastSeenAt = Instant.now(),
            online = true,
        )
        return controllerRepository.save(updated)
    }

    fun delete(id: ObjectId) {
        if (!controllerRepository.existsById(id)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Controller $id not found")
        }
        controllerRepository.deleteById(id)
    }

    companion object {
        fun computeSubnet(ip: String, prefixLength: Int = 24): String {
            val parts = ip.split(".")
            return when (prefixLength) {
                24 -> "${parts[0]}.${parts[1]}.${parts[2]}.0/24"
                16 -> "${parts[0]}.${parts[1]}.0.0/16"
                8 -> "${parts[0]}.0.0.0/8"
                else -> "${parts[0]}.${parts[1]}.${parts[2]}.0/24"
            }
        }
    }
}
