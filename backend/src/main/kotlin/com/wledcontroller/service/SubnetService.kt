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
        val normalized = normalizeCidr(cidr)
        validateCidr(normalized)
        return subnetRepository.save(Subnet(name = name, cidr = normalized, enabled = enabled))
    }

    fun update(id: ObjectId, name: String?, cidr: String?, enabled: Boolean?): Subnet {
        val existing = subnetRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Subnet $id not found") }
        val normalizedCidr = cidr?.let { normalizeCidr(it) }
        if (normalizedCidr != null) validateCidr(normalizedCidr)
        return subnetRepository.save(
            existing.copy(
                name = name ?: existing.name,
                cidr = normalizedCidr ?: existing.cidr,
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

    // Expand shorthand notation: "192.168.5/24" → "192.168.5.0/24"
    private fun normalizeCidr(cidr: String): String {
        val slash = cidr.indexOf('/')
        if (slash < 0) return cidr
        val addr = cidr.substring(0, slash)
        val suffix = cidr.substring(slash)
        val octets = addr.split(".")
        return when (octets.size) {
            4 -> cidr
            3 -> "${octets[0]}.${octets[1]}.${octets[2]}.0$suffix"
            2 -> "${octets[0]}.${octets[1]}.0.0$suffix"
            1 -> "${octets[0]}.0.0.0$suffix"
            else -> cidr
        }
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
