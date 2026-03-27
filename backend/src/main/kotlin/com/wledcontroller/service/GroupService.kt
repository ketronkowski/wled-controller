package com.wledcontroller.service

import com.wledcontroller.dto.ControlPayload
import com.wledcontroller.model.Group
import com.wledcontroller.model.GroupMember
import com.wledcontroller.model.MemberType
import com.wledcontroller.repository.ControllerRepository
import com.wledcontroller.repository.GroupRepository
import org.bson.types.ObjectId
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.concurrent.Callable
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

data class ControlSuccess(val controllerId: ObjectId, val ip: String)
data class ControlFailure(val controllerId: ObjectId, val ip: String, val reason: String)
data class GroupControlResult(val succeeded: List<ControlSuccess>, val failed: List<ControlFailure>)

@Service
class GroupService(
    private val groupRepository: GroupRepository,
    private val controllerRepository: ControllerRepository,
    private val wledService: WledService,
) {
    private val log = LoggerFactory.getLogger(GroupService::class.java)
    private val executor: ExecutorService = Executors.newVirtualThreadPerTaskExecutor()

    fun findAll(): List<Group> = groupRepository.findAll()

    fun findById(id: ObjectId): Group =
        groupRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Group $id not found") }

    fun create(name: String, description: String?): Group =
        groupRepository.save(Group(name = name, description = description))

    fun update(id: ObjectId, name: String, description: String?): Group {
        val group = findById(id)
        return groupRepository.save(group.copy(name = name, description = description, updatedAt = Instant.now()))
    }

    fun delete(id: ObjectId) {
        if (!groupRepository.existsById(id)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Group $id not found")
        }
        groupRepository.deleteById(id)
    }

    fun addMember(groupId: ObjectId, memberId: ObjectId, type: MemberType): Group {
        val group = findById(groupId)

        val memberSubnet = when (type) {
            MemberType.CONTROLLER -> {
                val c = controllerRepository.findById(memberId)
                    .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Controller $memberId not found") }
                c.subnet
            }
            MemberType.GROUP -> {
                val g = groupRepository.findById(memberId)
                    .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Group $memberId not found") }
                if (g.subnet.isEmpty()) {
                    throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Subgroup $memberId has no subnet (no members)")
                }
                // Cycle check
                if (wouldCreateCycle(groupId, memberId)) {
                    throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Adding group $memberId would create a recursive grouping")
                }
                g.subnet
            }
        }

        // Subnet isolation enforcement
        if (group.subnet.isNotEmpty() && group.subnet != memberSubnet) {
            throw ResponseStatusException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "Cannot add member from subnet $memberSubnet to group with subnet ${group.subnet}"
            )
        }

        // Prevent duplicate members
        if (group.members.any { it.id == memberId && it.type == type }) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Member already in group")
        }

        val newMember = GroupMember(type = type, id = memberId)
        val updatedSubnet = if (group.subnet.isEmpty()) memberSubnet else group.subnet
        val updated = group.copy(
            subnet = updatedSubnet,
            members = group.members + newMember,
            updatedAt = Instant.now(),
        )
        return groupRepository.save(updated)
    }

    fun removeMember(groupId: ObjectId, memberId: ObjectId): Group {
        val group = findById(groupId)
        val updated = group.copy(
            members = group.members.filter { it.id != memberId },
            updatedAt = Instant.now(),
        )
        return groupRepository.save(updated)
    }

    fun applyToGroup(groupId: ObjectId, payload: ControlPayload): GroupControlResult {
        val controllers = resolveGroupControllers(groupId)
        val patch = wledService.buildStatePatch(payload)

        val futures = controllers.map { controller ->
            executor.submit(Callable {
                runCatching {
                    wledService.setState(controller.ip, patch)
                    ControlSuccess(controller.id, controller.ip)
                }.fold(
                    onSuccess = { Result.success(it) },
                    onFailure = { Result.failure<ControlSuccess>(it) }
                ) to controller
            })
        }

        val succeeded = mutableListOf<ControlSuccess>()
        val failed = mutableListOf<ControlFailure>()

        futures.forEach { future ->
            val (result, controller) = future.get()
            result.fold(
                onSuccess = { succeeded.add(it) },
                onFailure = { err ->
                    log.warn("Failed to apply command to ${controller.ip}: ${err.message}")
                    failed.add(ControlFailure(controller.id, controller.ip, err.message ?: "Unknown error"))
                }
            )
        }

        return GroupControlResult(succeeded, failed)
    }

    /**
     * Resolves all unique controllers reachable from a group, recursively descending into subgroups.
     */
    fun resolveGroupControllers(groupId: ObjectId): List<com.wledcontroller.model.Controller> {
        val visited = mutableSetOf<ObjectId>()
        val controllers = mutableListOf<com.wledcontroller.model.Controller>()

        fun resolve(gid: ObjectId) {
            if (!visited.add(gid)) return
            val group = groupRepository.findById(gid).orElse(null) ?: return
            for (member in group.members) {
                when (member.type) {
                    MemberType.CONTROLLER -> {
                        if (!visited.contains(member.id)) {
                            controllerRepository.findById(member.id).ifPresent {
                                visited.add(it.id)
                                controllers.add(it)
                            }
                        }
                    }
                    MemberType.GROUP -> resolve(member.id)
                }
            }
        }

        resolve(groupId)
        return controllers
    }

    /**
     * BFS to detect if adding candidateGroupId as a member of groupId would create a cycle.
     */
    fun wouldCreateCycle(groupId: ObjectId, candidateGroupId: ObjectId): Boolean {
        val visited = mutableSetOf<ObjectId>()
        val queue = ArrayDeque(listOf(candidateGroupId))
        while (queue.isNotEmpty()) {
            val current = queue.removeFirst()
            if (current == groupId) return true
            if (!visited.add(current)) continue
            val g = groupRepository.findById(current).orElse(null) ?: continue
            g.members.filter { it.type == MemberType.GROUP }.forEach { queue.add(it.id) }
        }
        return false
    }
}
