package com.wledcontroller

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class WledControllerApplication

fun main(args: Array<String>) {
    runApplication<WledControllerApplication>(*args)
}
