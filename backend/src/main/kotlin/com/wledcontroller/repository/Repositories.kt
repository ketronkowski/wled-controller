package com.wledcontroller.repository

import com.wledcontroller.model.Controller
import com.wledcontroller.model.Group
import com.wledcontroller.model.Snapshot
import org.bson.types.ObjectId
import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface ControllerRepository : MongoRepository<Controller, ObjectId> {
    fun findByIp(ip: String): Optional<Controller>
    fun findBySubnet(subnet: String): List<Controller>
    fun existsByIp(ip: String): Boolean
}

@Repository
interface GroupRepository : MongoRepository<Group, ObjectId> {
    fun findBySubnet(subnet: String): List<Group>
}

@Repository
interface SnapshotRepository : MongoRepository<Snapshot, ObjectId> {
    fun findByScopeTypeAndScopeId(type: String, id: ObjectId): List<Snapshot>
}
