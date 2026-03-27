package com.wledcontroller.service

import com.wledcontroller.model.*
import com.wledcontroller.repository.ControllerRepository
import com.wledcontroller.repository.SnapshotRepository
import org.bson.types.ObjectId
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class SnapshotService(
    private val snapshotRepository: SnapshotRepository,
    private val controllerRepository: ControllerRepository,
    private val groupService: GroupService,
    private val wledService: WledService,
) {
    private val log = LoggerFactory.getLogger(SnapshotService::class.java)

    fun findAll(): List<Snapshot> = snapshotRepository.findAll()

    fun findById(id: ObjectId): Snapshot =
        snapshotRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Snapshot $id not found") }

    fun captureController(controllerId: ObjectId, name: String, description: String?, tags: List<String>): Snapshot {
        val controller = controllerRepository.findById(controllerId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Controller $controllerId not found") }

        val data = captureControllerData(controller)
        val snapshot = Snapshot(
            name = name,
            description = description,
            scope = SnapshotScope(type = "controller", id = controllerId),
            controllers = listOf(data),
            tags = tags,
        )
        return snapshotRepository.save(snapshot)
    }

    fun captureGroup(groupId: ObjectId, name: String, description: String?, tags: List<String>): Snapshot {
        val controllers = groupService.resolveGroupControllers(groupId)
        if (controllers.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Group has no controllers to snapshot")
        }
        val data = controllers.map { captureControllerData(it) }
        val snapshot = Snapshot(
            name = name,
            description = description,
            scope = SnapshotScope(type = "group", id = groupId),
            controllers = data,
            tags = tags,
        )
        return snapshotRepository.save(snapshot)
    }

    fun restore(snapshotId: ObjectId): Map<String, Any> {
        val snapshot = findById(snapshotId)
        val results = mutableMapOf<String, String>()

        for (data in snapshot.controllers) {
            runCatching {
                // Restore config first (LED pin assignments, etc.)
                if (data.config.isNotEmpty()) {
                    wledService.setState(data.controllerIp, data.config)
                    Thread.sleep(500) // give device time to apply config
                }
                // Then restore state
                wledService.setState(data.controllerIp, data.state)
                results[data.controllerIp] = "success"
            }.onFailure { err ->
                log.warn("Failed to restore to ${data.controllerIp}: ${err.message}")
                results[data.controllerIp] = "failed: ${err.message}"
            }
        }

        return mapOf("results" to results)
    }

    fun delete(id: ObjectId) {
        if (!snapshotRepository.existsById(id)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Snapshot $id not found")
        }
        snapshotRepository.deleteById(id)
    }

    private fun captureControllerData(controller: com.wledcontroller.model.Controller): SnapshotControllerData {
        val state = wledService.getState(controller.ip)
            ?: controller.cachedState
            ?: throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "Cannot reach ${controller.ip} to snapshot")
        val info = wledService.getInfo(controller.ip) ?: controller.cachedInfo!!
        val effects = wledService.getEffects(controller.ip)
        val palettes = wledService.getPalettes(controller.ip)
        val config = wledService.getConfig(controller.ip)

        return SnapshotControllerData(
            controllerId = controller.id,
            controllerIp = controller.ip,
            controllerName = controller.name,
            state = state,
            info = info,
            effects = effects,
            palettes = palettes,
            config = config,
        )
    }
}
