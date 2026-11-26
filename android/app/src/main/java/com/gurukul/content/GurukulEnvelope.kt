package com.gurukul.content

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject

@Serializable
data class GurukulEnvelope(
    @SerialName("schema_version") val schemaVersion: String,
    @SerialName("record_id") val recordId: String,
    @SerialName("record_type") val recordType: String,
    val curriculum: JsonObject,
    val subject: JsonObject,
    val artifact: JsonObject,
    @SerialName("source_integrity") val sourceIntegrity: JsonObject,
    @SerialName("academic_index") val academicIndex: JsonObject,
    @SerialName("source_data") val sourceData: JsonElement
)

object GurukulJsonReader {
    private val parser = Json {
        ignoreUnknownKeys = true
        isLenient = true
        allowSpecialFloatingPointValues = true
    }

    fun parseEnvelope(json: String): GurukulEnvelope =
        parser.decodeFromString(GurukulEnvelope.serializer(), json)

    fun sourcePayload(envelope: GurukulEnvelope): JsonElement = envelope.sourceData
}

interface ArtifactAdapter<T> {
    fun supports(artifactType: String, sourceData: JsonElement): Boolean
    fun adapt(envelope: GurukulEnvelope): T
}
