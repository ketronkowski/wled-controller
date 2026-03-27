package com.wledcontroller.dto

import com.fasterxml.jackson.annotation.JsonProperty

data class WledSegment(
    val id: Int = 0,
    val start: Int = 0,
    val stop: Int = 0,
    val len: Int = 0,
    val grp: Int = 1,
    val spc: Int = 0,
    @JsonProperty("of") val offset: Int = 0,
    val on: Boolean = true,
    val frz: Boolean = false,
    val bri: Int = 255,
    val cct: Int = 127,
    val col: List<List<Int>> = listOf(listOf(255, 0, 0), listOf(0, 0, 0), listOf(0, 0, 0)),
    val fx: Int = 0,
    val sx: Int = 128,
    val ix: Int = 128,
    val pal: Int = 0,
    val c1: Int = 128,
    val c2: Int = 128,
    val c3: Int = 16,
    val sel: Boolean = true,
    val rev: Boolean = false,
    val mi: Boolean = false,
    val o1: Boolean = false,
    val o2: Boolean = false,
    val o3: Boolean = false,
    val si: Int = 0,
    val m12: Int = 0,
)

data class WledNightlight(
    val on: Boolean = false,
    val dur: Int = 60,
    val mode: Int = 1,
    val tbri: Int = 0,
    val rem: Int = -1,
)

data class WledUdpSync(
    val send: Boolean = false,
    val recv: Boolean = true,
    val sgrp: Int = 1,
    val rgrp: Int = 1,
)

data class WledState(
    val on: Boolean = false,
    val bri: Int = 128,
    val transition: Int = 7,
    val ps: Int = -1,
    val pl: Int = -1,
    val ledmap: Int = 0,
    val nl: WledNightlight = WledNightlight(),
    val udpn: WledUdpSync = WledUdpSync(),
    val lor: Int = 0,
    val mainseg: Int = 0,
    val seg: List<WledSegment> = emptyList(),
)

data class WledLeds(
    val count: Int = 0,
    val pwr: Int = 0,
    val fps: Int = 0,
    val maxpwr: Int = 0,
    val maxseg: Int = 0,
    val bootps: Int = 0,
    val seglc: List<Int> = emptyList(),
    val lc: Int = 0,
    val rgbw: Boolean = false,
    val cct: Int = 0,
)

data class WledWifi(
    val bssid: String = "",
    val rssi: Int = 0,
    val signal: Int = 0,
    val channel: Int = 0,
    val ap: Boolean = false,
)

data class WledFs(
    val u: Int = 0,
    val t: Int = 0,
    val pmt: Int = 0,
)

data class WledInfo(
    val ver: String = "",
    val vid: Long = 0,
    val name: String = "",
    val udpport: Int = 21324,
    val live: Boolean = false,
    val ws: Int = 0,
    val fxcount: Int = 0,
    val palcount: Int = 0,
    val cpalcount: Int = 0,
    val leds: WledLeds = WledLeds(),
    val wifi: WledWifi = WledWifi(),
    val fs: WledFs = WledFs(),
    val mac: String = "",
    val ip: String = "",
    val arch: String = "",
    val core: String = "",
    val clock: Int = 0,
    val flash: Int = 0,
    val freeheap: Int = 0,
    val uptime: Long = 0,
    val brand: String = "WLED",
    val product: String = "",
)

data class WledFullResponse(
    val state: WledState = WledState(),
    val info: WledInfo = WledInfo(),
    val effects: List<String> = emptyList(),
    val palettes: List<String> = emptyList(),
)

data class ControlPayload(
    val on: Boolean? = null,
    val bri: Int? = null,
    val transition: Int? = null,
    val ps: Int? = null,
    val pl: Int? = null,
    val seg: List<SegmentPatch>? = null,
    // Convenience: applied to all selected segments
    val fx: Int? = null,
    val pal: Int? = null,
    val col: List<List<Int>>? = null,
    val sx: Int? = null,
    val ix: Int? = null,
)

data class SegmentPatch(
    val id: Int? = null,
    val on: Boolean? = null,
    val bri: Int? = null,
    val fx: Int? = null,
    val pal: Int? = null,
    val col: List<List<Int>>? = null,
    val sx: Int? = null,
    val ix: Int? = null,
    val c1: Int? = null,
    val c2: Int? = null,
    val c3: Int? = null,
    val o1: Boolean? = null,
    val o2: Boolean? = null,
    val o3: Boolean? = null,
)

data class DiscoveredDevice(
    val ip: String,
    val name: String,
    val mac: String,
    val firmware: String,
    val ledCount: Int,
)
