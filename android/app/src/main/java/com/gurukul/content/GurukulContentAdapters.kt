package com.gurukul.content

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*
import java.security.MessageDigest

@Serializable
data class ContentNode(
    @SerialName("node_id") val nodeId: String,
    @SerialName("parent_node_id") val parentNodeId: String? = null,
    @SerialName("node_type") val nodeType: String,
    @SerialName("source_path") val sourcePath: String,
    val title: String? = null,
    @SerialName("raw_payload") val rawPayload: JsonObject
)

@Serializable
data class SemanticItem(
    @SerialName("item_id") val itemId: String,
    @SerialName("source_path") val sourcePath: String,
    @SerialName("raw_payload") val rawPayload: JsonObject
)

@Serializable
data class GurukulSemanticModel(
    @SerialName("schema_version") val schemaVersion: String,
    @SerialName("record_id") val recordId: String,
    @SerialName("source_artifact_ref") val sourceArtifactRef: String,
    @SerialName("artifact_type") val artifactType: String,
    @SerialName("academic_context") val academicContext: JsonObject,
    @SerialName("chapter_items") val chapterItems: List<SemanticItem> = emptyList(),
    @SerialName("question_items") val questionItems: List<SemanticItem> = emptyList(),
    @SerialName("flashcard_items") val flashcardItems: List<SemanticItem> = emptyList(),
    @SerialName("media_items") val mediaItems: List<SemanticItem> = emptyList(),
    @SerialName("activity_items") val activityItems: List<SemanticItem> = emptyList(),
    @SerialName("content_nodes") val contentNodes: List<ContentNode> = emptyList(),
    @SerialName("source_payload_sha256") val sourcePayloadSha256: String
)

@Serializable
data class DisplayBlock(
    val id: String,
    val kind: String,
    val title: String? = null,
    val text: JsonElement? = null,
    val sourcePath: String,
    val raw: JsonObject
)

data class AdaptedArtifact(
    val recordId: String,
    val artifactType: String,
    val blocks: List<DisplayBlock>,
    val originalSource: JsonElement
)

object GurukulJson {
    val parser = Json {
        ignoreUnknownKeys = true
        isLenient = true
        explicitNulls = false
    }
    fun envelope(json: String): GurukulEnvelope =
        parser.decodeFromString(GurukulEnvelope.serializer(), json)
    fun semantic(json: String): GurukulSemanticModel =
        parser.decodeFromString(GurukulSemanticModel.serializer(), json)
}

interface GurukulArtifactAdapter {
    val artifactType: String
    fun adapt(envelope: GurukulEnvelope): AdaptedArtifact
}

/**
 * Common adapter base. It maps only fields it can recognize and retains every
 * original JSON object in DisplayBlock.raw and the complete source in originalSource.
 */
abstract class BaseArtifactAdapter(final override val artifactType: String) : GurukulArtifactAdapter {
    override fun adapt(envelope: GurukulEnvelope): AdaptedArtifact {
        val blocks = mutableListOf<DisplayBlock>()
        walk(envelope.sourceData, "$", blocks)
        return AdaptedArtifact(envelope.recordId, artifactType, blocks, envelope.sourceData)
    }

    private fun walk(value: JsonElement, path: String, out: MutableList<DisplayBlock>) {
        when (value) {
            is JsonObject -> {
                val kind = classify(path, value)
                val title = firstString(value, listOf(
                    "chapter_title", "title", "topic", "name", "heading", "term",
                    "question_text", "question", "prompt", "video_title", "label"
                ))
                val text = firstElement(value, listOf(
                    "explanation", "description", "content", "summary", "core_summary",
                    "question_text", "question", "answer", "definition", "notes"
                ))
                out += DisplayBlock(
                    id = stableId(envelopeSeed(value, path)),
                    kind = kind,
                    title = title,
                    text = text,
                    sourcePath = path,
                    raw = value
                )
                value.forEach { (key, child) ->
                    if (child is JsonObject || child is JsonArray) walk(child, "$path.$key", out)
                }
            }
            is JsonArray -> value.forEachIndexed { index, child ->
                if (child is JsonObject || child is JsonArray) walk(child, "$path[$index]", out)
            }
            else -> Unit
        }
    }

    private fun classify(path: String, obj: JsonObject): String {
        val p = path.lowercase()
        val keys = obj.keys.map { it.lowercase() }.toSet()
        return when {
            "question" in p || "quiz" in p || "exam_question" in p -> "question"
            "flashcard" in p || ("front" in keys && "back" in keys) -> "flashcard"
            "mindmap" in p || "mind_map" in p -> "mindmap"
            "media" in p || "asset" in p || "diagram" in p || "visual" in p -> "media"
            "experiment" in p || "activity" in p || "lab" in p || "playground" in p -> "activity"
            "formula" in p || "equation" in p -> "formula"
            "vocabulary" in p || "glossary" in p || "definition" in p -> "vocabulary"
            "chapter" in p || "chapter_title" in keys -> "chapter"
            "topic" in p || "concept" in p -> "concept"
            "summary" in p || "overview" in p || "explanation" in p || "notes" in p -> "explanation"
            "rubric" in p || "portfolio" in p -> "rubric"
            else -> "structured_content"
        }
    }

    private fun firstString(obj: JsonObject, keys: List<String>): String? =
        keys.firstNotNullOfOrNull { key ->
            val value = obj[key]
            (value as? JsonPrimitive)?.contentOrNull?.takeIf { it.isNotBlank() }
        }

    private fun firstElement(obj: JsonObject, keys: List<String>): JsonElement? =
        keys.firstNotNullOfOrNull { key -> obj[key]?.takeUnless { it is JsonNull } }

    private fun envelopeSeed(obj: JsonObject, path: String): String =
        path + "|" + obj.keys.sorted().joinToString(",")

    private fun stableId(value: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(value.toByteArray())
        return "node_" + digest.take(8).joinToString("") { "%02x".format(it) }
    }
}

class OverviewAdapter : BaseArtifactAdapter("overview")
class NotesAdapter : BaseArtifactAdapter("notes")
class MindmapsAdapter : BaseArtifactAdapter("mindmaps")
class FlashcardsAdapter : BaseArtifactAdapter("flashcards")
class QuizAdapter : BaseArtifactAdapter("quiz")
class QuestionPapersAdapter : BaseArtifactAdapter("question_papers")
class FoundationalAdapter : BaseArtifactAdapter("foundational")
class MasterAdapter : BaseArtifactAdapter("master")
class MediaDirectoryAdapter : BaseArtifactAdapter("media_directory")
class MediaManifestAdapter : BaseArtifactAdapter("media_manifest")
class VideoLinksAdapter : BaseArtifactAdapter("video_links")
class OtherArtifactAdapter : BaseArtifactAdapter("other")

object GurukulAdapterRegistry {
    private val adapters: Map<String, GurukulArtifactAdapter> = listOf(
        OverviewAdapter(), NotesAdapter(), MindmapsAdapter(), FlashcardsAdapter(),
        QuizAdapter(), QuestionPapersAdapter(), FoundationalAdapter(), MasterAdapter(),
        MediaDirectoryAdapter(), MediaManifestAdapter(), VideoLinksAdapter(),
        OtherArtifactAdapter()
    ).associateBy { it.artifactType }

    fun adapterFor(type: String): GurukulArtifactAdapter =
        adapters[type] ?: adapters.getValue("other")

    fun adapt(envelope: GurukulEnvelope): AdaptedArtifact {
        val type = envelope.artifact["artifact_type"]?.jsonPrimitive?.contentOrNull ?: "other"
        return adapterFor(type).adapt(envelope)
    }
}
