package com.wledcontroller.service

import com.wledcontroller.model.Subnet
import com.wledcontroller.repository.SubnetRepository
import org.bson.types.ObjectId
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class SubnetService(private val subnetRepository: SubnetRepository) {

    fun findAll(): List<Subnet> = subnetRepository.findAll()

    fun findEnabled(): List<Subnet> = subnetRepository.findByEnabled(true)

    fun create(name: String, cidr: String, enabled: Boolean = true): Subnet {
        validateCidr(cidr)
        return subnetRepository.save(Subnet(name = name, cidr = cidr, enabled = enabled))
    }

    fun update(id: ObjectId, name: String?, cidr: String?, enabled: Boolean?): Subnet {
        val existing = subnetRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Subnet $id not found") }
        if (cidr != null) validateCidr(cidr)
        return subnetRepository.save(
            existing.copy(
                name = name ?: existing.name,
                cidr = cidr ?: existing.cidr,
                enabled = enabled ?: existing.enabled,
            )
        )
    }

    fun delete(id: ObjectId) {
        if (!subnetRepository.existsById(id)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Subnet $id not found")
        }
        subnetRepository.deleteById(id)
    }

    private fun validateCidr(cidr: String) {
        val parts = cidr.split("/")
        if (parts.size != 2) throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid CIDR: $cidr")
        val prefix = parts[1].toIntOrNull()
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid CIDR prefix: ${parts[1]}")
        if (prefix < 0 || prefix > 32) throw ResponseStatusException(HttpStatus.BAD_REQUEST, "CIDR prefix out of range: $prefix")
        runCatching { java.net.InetAddress.getByName(parts[0]) }
            .onFailure { throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid CIDR address: ${parts[0]}") }
    }
}
