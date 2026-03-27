package com.wledcontroller.service

import com.wledcontroller.model.Group
import com.wledcontroller.model.GroupMember
import com.wledcontroller.model.MemberType
import com.wledcontroller.repository.ControllerRepository
import com.wledcontroller.repository.GroupRepository
import org.bson.types.ObjectId
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.springframework.web.server.ResponseStatusException
import java.util.Optional

class GroupServiceTest {

    private val groupRepository: GroupRepository = mock()
    private val controllerRepository: ControllerRepository = mock()
    private val wledService: WledService = mock()
    private val service = GroupService(groupRepository, controllerRepository, wledService)

    @Test
    fun wouldCreateCycleReturnsFalseWhenNoCycle() {
        val groupA = ObjectId()
        val groupB = ObjectId()
        val groupC = ObjectId()

        // B contains C — adding A to contain B should be fine (no cycle back to A)
        whenever(groupRepository.findById(groupB)).thenReturn(
            Optional.of(Group(id = groupB, name = "B", members = listOf(GroupMember(MemberType.GROUP, groupC))))
        )
        whenever(groupRepository.findById(groupC)).thenReturn(
            Optional.of(Group(id = groupC, name = "C"))
        )

        assertFalse(service.wouldCreateCycle(groupA, groupB))
    }

    @Test
    fun wouldCreateCycleReturnsTrueForDirectSelfReference() {
        val groupA = ObjectId()
        whenever(groupRepository.findById(groupA)).thenReturn(
            Optional.of(Group(id = groupA, name = "A"))
        )
        assertTrue(service.wouldCreateCycle(groupA, groupA))
    }

    @Test
    fun wouldCreateCycleReturnsTrueForIndirectCycle() {
        val groupA = ObjectId()
        val groupB = ObjectId()

        // B contains A — adding B to A would create a cycle
        whenever(groupRepository.findById(groupB)).thenReturn(
            Optional.of(Group(id = groupB, name = "B", members = listOf(GroupMember(MemberType.GROUP, groupA))))
        )
        whenever(groupRepository.findById(groupA)).thenReturn(
            Optional.of(Group(id = groupA, name = "A"))
        )

        assertTrue(service.wouldCreateCycle(groupA, groupB))
    }
}

class ControllerServiceSubnetTest {

    @Test
    fun computeSubnetExtractsCorrectly() {
        assertEquals("192.168.5.0/24", ControllerService.computeSubnet("192.168.5.54"))
        assertEquals("192.168.5.0/24", ControllerService.computeSubnet("192.168.5.22"))
        assertEquals("10.0.0.0/24", ControllerService.computeSubnet("10.0.0.1"))
    }

    @Test
    fun controllersOnSameSubnetAreCompatible() {
        val s1 = ControllerService.computeSubnet("192.168.5.54")
        val s2 = ControllerService.computeSubnet("192.168.5.22")
        assertEquals(s1, s2)
    }

    @Test
    fun controllersOnDifferentSubnetsAreIncompatible() {
        val s1 = ControllerService.computeSubnet("192.168.5.54")
        val s2 = ControllerService.computeSubnet("192.168.1.10")
        assertNotEquals(s1, s2)
    }
}
