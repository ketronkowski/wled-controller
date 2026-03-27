package com.wledcontroller.model

import com.wledcontroller.dto.WledInfo
import com.wledcontroller.dto.WledState
import org.bson.types.ObjectId
import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document(collection = "controllers")
data class Controller(
    @Id val id: ObjectId = ObjectId(),
    @Indexed(unique = true) val ip: String,
    val name: String,
    val mac: String,
    val subnet: String,
    val firmware: String,
    val ledCount: Int,
    val discoveredAt: Instant = Instant.now(),
    val lastSeenAt: Instant = Instant.now(),
    val addedManually: Boolean = false,
    val online: Boolean = true,
    val cachedState: WledState? = null,
    val cachedInfo: WledInfo? = null,
)

enum class MemberType { CONTROLLER, GROUP }

data class GroupMember(
    val type: MemberType,
    val id: ObjectId,
)

@Document(collection = "groups")
data class Group(
    @Id val id: ObjectId = ObjectId(),
    val name: String,
    val description: String? = null,
    val subnet: String = "",
    val members: List<GroupMember> = emptyList(),
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now(),
)

data class SnapshotScope(
    val type: String,
    val id: ObjectId,
)

data class SnapshotControllerData(
    val controllerId: ObjectId,
    val controllerIp: String,
    val controllerName: String,
    val state: WledState,
    val info: WledInfo,
    val effects: List<String>,
    val palettes: List<String>,
    val config: Map<String, Any?> = emptyMap(),
    val presets: Map<String, Any?> = emptyMap(),
)

@Document(collection = "snapshots")
data class Snapshot(
    @Id val id: ObjectId = ObjectId(),
    val name: String,
    val description: String? = null,
    val scope: SnapshotScope,
    val controllers: List<SnapshotControllerData>,
    val capturedAt: Instant = Instant.now(),
    val tags: List<String> = emptyList(),
)
