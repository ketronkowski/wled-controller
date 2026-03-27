package com.wledcontroller.controller

import com.wledcontroller.dto.ControlPayload
import com.wledcontroller.service.ControllerService
import com.wledcontroller.service.GroupControlResult
import com.wledcontroller.service.GroupService
import org.bson.types.ObjectId
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/control")
class ControlCommandController(
    private val controllerService: ControllerService,
    private val groupService: GroupService,
) {

    @PostMapping("/controller/{id}")
    fun controlController(
        @PathVariable id: String,
        @RequestBody payload: ControlPayload,
    ) = controllerService.applyCommand(ObjectId(id), payload)

    @PostMapping("/group/{id}")
    fun controlGroup(
        @PathVariable id: String,
        @RequestBody payload: ControlPayload,
    ): ResponseEntity<GroupControlResult> {
        val result = groupService.applyToGroup(ObjectId(id), payload)
        val status = when {
            result.failed.isEmpty() -> HttpStatus.OK
            result.succeeded.isEmpty() -> HttpStatus.BAD_GATEWAY
            else -> HttpStatus.MULTI_STATUS
        }
        return ResponseEntity.status(status).body(result)
    }
}
