package com.wledcontroller.controller

import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.server.ResponseStatusException

@RestControllerAdvice
class GlobalExceptionHandler {
    private val log = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)

    @ExceptionHandler(ResponseStatusException::class)
    fun handleResponseStatus(ex: ResponseStatusException): ProblemDetail {
        val detail = ProblemDetail.forStatusAndDetail(ex.statusCode, ex.reason ?: ex.message ?: "Error")
        return detail
    }

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgument(ex: IllegalArgumentException): ProblemDetail {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.message ?: "Invalid argument")
    }

    @ExceptionHandler(Exception::class)
    fun handleGeneric(ex: Exception): ProblemDetail {
        log.error("Unhandled exception", ex)
        return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error")
    }
}
