package com.wledcontroller.controller

import com.wledcontroller.model.Subnet
import com.wledcontroller.service.SubnetService
import org.bson.types.ObjectId
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

data class SubnetRequest(val name: String, val cidr: String, val enabled: Boolean = true)
data class SubnetPatchRequest(val name: String? = null, val cidr: String? = null, val enabled: Boolean? = null)

@RestController
@RequestMapping("/api/subnets")
class SubnetController(private val subnetService: SubnetService) {

    @GetMapping
    fun list(): List<Subnet> = subnetService.findAll()

    @GetMapping("/active")
    fun listActive(): List<String> = subnetService.findEnabled().map { it.cidr }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody req: SubnetRequest): Subnet =
        subnetService.create(req.name, req.cidr, req.enabled)

    @PutMapping("/{id}")
    fun update(@PathVariable id: String, @RequestBody req: SubnetPatchRequest): Subnet =
        subnetService.update(ObjectId(id), req.name, req.cidr, req.enabled)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: String) = subnetService.delete(ObjectId(id))
}
