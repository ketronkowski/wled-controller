package com.wledcontroller.controller

import com.wledcontroller.model.Group
import com.wledcontroller.model.MemberType
import com.wledcontroller.service.GroupService
import org.bson.types.ObjectId
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

data class CreateGroupRequest(val name: String, val description: String? = null)
data class AddMemberRequest(val id: String, val type: String)

@RestController
@RequestMapping("/api/groups")
class GroupController(private val groupService: GroupService) {

    @GetMapping
    fun list(): List<Group> = groupService.findAll()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody req: CreateGroupRequest): Group =
        groupService.create(req.name, req.description)

    @GetMapping("/{id}")
    fun get(@PathVariable id: String): Group =
        groupService.findById(ObjectId(id))

    @PutMapping("/{id}")
    fun update(@PathVariable id: String, @RequestBody req: CreateGroupRequest): Group =
        groupService.update(ObjectId(id), req.name, req.description)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: String) =
        groupService.delete(ObjectId(id))

    @PostMapping("/{id}/members")
    fun addMember(@PathVariable id: String, @RequestBody req: AddMemberRequest): Group {
        val type = MemberType.valueOf(req.type.uppercase())
        return groupService.addMember(ObjectId(id), ObjectId(req.id), type)
    }

    @DeleteMapping("/{id}/members/{memberId}")
    fun removeMember(@PathVariable id: String, @PathVariable memberId: String): Group =
        groupService.removeMember(ObjectId(id), ObjectId(memberId))
}
