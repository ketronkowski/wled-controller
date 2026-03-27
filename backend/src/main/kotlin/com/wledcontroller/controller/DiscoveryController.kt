package com.wledcontroller.controller

import com.wledcontroller.dto.DiscoveredDevice
import com.wledcontroller.model.Controller
import com.wledcontroller.service.ControllerService
import com.wledcontroller.service.DiscoveryService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/discovery")
class DiscoveryController(
    private val discoveryService: DiscoveryService,
    private val controllerService: ControllerService,
) {

    @PostMapping("/scan")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun scan(): Map<String, String> {
        discoveryService.scan()
        return mapOf("status" to "scan started")
    }

    @GetMapping("/status")
    fun status(): Map<String, Boolean> =
        mapOf("scanning" to discoveryService.isScanning())

    @GetMapping("/results")
    fun results(): List<DiscoveredDevice> =
        discoveryService.getLastResults()

    @PostMapping("/import")
    fun import(@RequestBody devices: List<DiscoveredDevice>): List<Controller> =
        devices.map { controllerService.importDiscovered(it) }

    /** Internal endpoint: called by the discovery worker container */
    @PostMapping("/ingest")
    fun ingest(@RequestBody device: DiscoveredDevice): Controller =
        controllerService.importDiscovered(device)
}
