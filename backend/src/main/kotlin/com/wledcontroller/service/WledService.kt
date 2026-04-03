package com.wledcontroller.service

import tools.jackson.databind.ObjectMapper
import com.wledcontroller.dto.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientException
import org.springframework.web.client.body
import java.time.Duration
import java.util.concurrent.ConcurrentHashMap

@Service
class WledService(
    private val restClient: RestClient,
    private val objectMapper: ObjectMapper,
) {
    private val log = LoggerFactory.getLogger(WledService::class.java)
    private val paletteColorCache = ConcurrentHashMap<String, Map<String, Any>>()

    fun getFullState(ip: String): WledFullResponse? = runCatching {
        restClient.get()
            .uri("http://$ip/json")
            .retrieve()
            .body<WledFullResponse>()
    }.onFailure { log.warn("Failed to get full state from $ip: ${it.message}") }.getOrNull()

    fun getState(ip: String): WledState? = runCatching {
        restClient.get()
            .uri("http://$ip/json/state")
            .retrieve()
            .body<WledState>()
    }.onFailure { log.warn("Failed to get state from $ip: ${it.message}") }.getOrNull()

    fun setState(ip: String, payload: Any): WledState? = runCatching {
        restClient.post()
            .uri("http://$ip/json/state")
            .body(payload)
            .retrieve()
            .body<WledState>()
    }.onFailure { log.warn("Failed to set state on $ip: ${it.message}") }.getOrNull()

    fun getInfo(ip: String): WledInfo? = runCatching {
        restClient.get()
            .uri("http://$ip/json/info")
            .retrieve()
            .body<WledInfo>()
    }.onFailure { log.warn("Failed to get info from $ip: ${it.message}") }.getOrNull()

    fun getEffects(ip: String): List<String> = runCatching {
        restClient.get()
            .uri("http://$ip/json/effects")
            .retrieve()
            .body<List<String>>() ?: emptyList()
    }.onFailure { log.warn("Failed to get effects from $ip: ${it.message}") }.getOrDefault(emptyList())

    fun getPalettes(ip: String): List<String> = runCatching {
        restClient.get()
            .uri("http://$ip/json/palettes")
            .retrieve()
            .body<List<String>>() ?: emptyList()
    }.onFailure { log.warn("Failed to get palettes from $ip: ${it.message}") }.getOrDefault(emptyList())

    fun getFxData(ip: String): List<String> = runCatching {
        restClient.get()
            .uri("http://$ip/json/fxdata")
            .retrieve()
            .body<List<String>>() ?: emptyList()
    }.onFailure { log.warn("Failed to get fxdata from $ip: ${it.message}") }.getOrDefault(emptyList())

    fun getConfig(ip: String): Map<String, Any?> = runCatching {
        @Suppress("UNCHECKED_CAST")
        restClient.get()
            .uri("http://$ip/json/cfg")
            .retrieve()
            .body<Map<String, Any?>>() ?: emptyMap()
    }.onFailure { log.warn("Failed to get config from $ip: ${it.message}") }.getOrDefault(emptyMap())

    fun getPaletteColors(ip: String, page: Int): Map<String, Any> = runCatching {
        restClient.get()
            .uri("http://$ip/json/palx?page=$page")
            .retrieve()
            .body<Map<String, Any>>() ?: emptyMap()
    }.onFailure { log.warn("Failed to get palette colors from $ip page $page: ${it.message}") }
     .getOrDefault(emptyMap())

    fun getAllPaletteColors(ip: String): Map<String, Any> =
        paletteColorCache.computeIfAbsent(ip) {
            val combined = mutableMapOf<String, Any>()
            var consecutiveFailures = 0
            for (page in 0..20) {
                val result = getPaletteColors(ip, page)
                @Suppress("UNCHECKED_CAST")
                val p = result["p"] as? Map<String, Any>
                if (p == null) {
                    // Failed page fetch — skip this page, stop after 3 consecutive failures
                    consecutiveFailures++
                    if (consecutiveFailures >= 3) break
                    continue
                }
                if (p.isEmpty()) break  // explicit empty page — past the end
                consecutiveFailures = 0
                val before = combined.size
                combined.putAll(p)
                if (combined.size == before) break  // no new keys — WLED is wrapping around
            }
            combined
        }

    fun isReachable(ip: String): Boolean = runCatching {
        restClient.get()
            .uri("http://$ip/json/info")
            .retrieve()
            .toBodilessEntity()
        true
    }.getOrDefault(false)

    /**
     * Converts a ControlPayload to a WLED-compatible state patch.
     * Convenience fields (fx, pal, col, sx, ix) are expanded into segment patches
     * targeting all selected segments.
     */
    fun buildStatePatch(payload: ControlPayload): Map<String, Any?> {
        val patch = mutableMapOf<String, Any?>()
        payload.on?.let { patch["on"] = it }
        payload.bri?.let { patch["bri"] = it }
        payload.transition?.let { patch["tt"] = it }
        payload.ps?.let { patch["ps"] = it }
        payload.pl?.let { patch["pl"] = it }

        // Merge explicit segment patches with convenience fields
        if (payload.seg != null || hasConvenienceFields(payload)) {
            val segPatches = payload.seg?.toMutableList() ?: mutableListOf()
            if (hasConvenienceFields(payload) && segPatches.isEmpty()) {
                // Apply to all selected segments by sending a single patch without an id
                segPatches.add(buildConvenienceSegPatch(payload))
            }
            patch["seg"] = segPatches
        }

        return patch
    }

    private fun hasConvenienceFields(p: ControlPayload) =
        p.fx != null || p.pal != null || p.col != null || p.sx != null || p.ix != null

    private fun buildConvenienceSegPatch(p: ControlPayload) = SegmentPatch(
        fx = p.fx,
        pal = p.pal,
        col = p.col,
        sx = p.sx,
        ix = p.ix,
    )
}
