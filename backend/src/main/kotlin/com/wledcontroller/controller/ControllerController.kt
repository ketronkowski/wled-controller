package com.wledcontroller.controller

import com.wledcontroller.model.Controller
import com.wledcontroller.service.ControllerService
import org.bson.types.ObjectId
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

data class AddControllerRequest(val ip: String)

@RestController
@RequestMapping("/api/controllers")
class ControllerController(private val controllerService: ControllerService) {

    @GetMapping
    fun list(): List<Controller> = controllerService.findAll()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun add(@RequestBody req: AddControllerRequest): Controller =
        controllerService.addManually(req.ip)

    @GetMapping("/{id}")
    fun get(@PathVariable id: String): Controller =
        controllerService.findById(ObjectId(id))

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: String) =
        controllerService.delete(ObjectId(id))

    @GetMapping("/{id}/state")
    fun liveState(@PathVariable id: String): Map<String, Any?> =
        controllerService.getLiveState(ObjectId(id))

    @GetMapping("/{id}/fxdata")
    fun fxData(@PathVariable id: String): List<String> =
        controllerService.getFxData(ObjectId(id))

    @GetMapping("/{id}/palx")
    fun paletteColors(@PathVariable id: String): Map<String, Any> =
        controllerService.getPaletteColors(ObjectId(id))

    @PostMapping("/{id}/refresh")
    fun refresh(@PathVariable id: String): Controller =
        controllerService.refreshState(ObjectId(id))
}
