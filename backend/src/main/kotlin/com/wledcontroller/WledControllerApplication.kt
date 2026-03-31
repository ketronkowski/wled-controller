package com.wledcontroller

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
class WledControllerApplication

fun main(args: Array<String>) {
    runApplication<WledControllerApplication>(*args)
}
