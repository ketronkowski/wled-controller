package com.wledcontroller.service

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class HealthCheckScheduler(private val controllerService: ControllerService) {
    private val log = LoggerFactory.getLogger(HealthCheckScheduler::class.java)

    @Scheduled(fixedDelay = 60_000)
    fun refreshAll() {
        controllerService.findAll().forEach { controller ->
            runCatching { controllerService.refreshState(controller.id) }
                .onFailure { log.warn("Health check failed for ${controller.ip}: ${it.message}") }
        }
    }
}
