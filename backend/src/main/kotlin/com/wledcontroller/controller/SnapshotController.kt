package com.wledcontroller.controller

import com.wledcontroller.model.Snapshot
import com.wledcontroller.service.SnapshotService
import org.bson.types.ObjectId
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

data class CaptureRequest(
    val name: String,
    val description: String? = null,
    val scopeType: String,    // "controller" | "group"
    val scopeId: String,
    val tags: List<String> = emptyList(),
)

@RestController
@RequestMapping("/api/snapshots")
class SnapshotController(private val snapshotService: SnapshotService) {

    @GetMapping
    fun list(): List<Snapshot> = snapshotService.findAll()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun capture(@RequestBody req: CaptureRequest): Snapshot {
        val id = ObjectId(req.scopeId)
        return when (req.scopeType.lowercase()) {
            "controller" -> snapshotService.captureController(id, req.name, req.description, req.tags)
            "group" -> snapshotService.captureGroup(id, req.name, req.description, req.tags)
            else -> throw IllegalArgumentException("scopeType must be 'controller' or 'group'")
        }
    }

    @GetMapping("/{id}")
    fun get(@PathVariable id: String): Snapshot =
        snapshotService.findById(ObjectId(id))

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: String) =
        snapshotService.delete(ObjectId(id))

    @PostMapping("/{id}/restore")
    fun restore(@PathVariable id: String): Map<String, Any> =
        snapshotService.restore(ObjectId(id))
}
