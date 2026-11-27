package com.gurukul.ai.lms.loader

import android.content.Context
import com.gurukul.content.AdaptedArtifact
import com.gurukul.content.GurukulAdapterRegistry
import com.gurukul.content.GurukulEnvelope
import com.gurukul.content.GurukulJsonReader
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*

@Serializable
data class AcademicIndexArtifact(
    @SerialName("record_id") val recordId: String,
    @SerialName("artifact_type") val artifactType: String,
    @SerialName("source_path") val sourcePath: String,
    @SerialName("normalized_path") val normalizedPath: String
)

@Serializable
data class AcademicIndexSubject(
    @SerialName("subject_id") val subjectId: String,
    @SerialName("source_subject_label") val sourceSubjectLabel: String,
    val artifacts: List<AcademicIndexArtifact> = emptyList()
)

@Serializable
data class AcademicIndexClass(
    @SerialName("class_id") val classId: String,
    @SerialName("class_level") val classLevel: Int,
    val subjects: Map<String, AcademicIndexSubject> = emptyMap()
)

@Serializable
data class AcademicIndexRoot(
    @SerialName("schema_version") val schemaVersion: String,
    val classes: Map<String, AcademicIndexClass> = emptyMap()
)

data class DiscoveredChapter(
    val chapterNumber: Int,
    val chapterTitle: String,
    val artifacts: Map<String, AcademicIndexArtifact>
)

data class DiscoveredSubject(
    val subjectId: String,
    val displayName: String,
    val artifacts: List<AcademicIndexArtifact>
)

data class DiscoveredGrade(
    val classId: String,
    val classLevel: Int,
    val displayName: String,
    val subjects: List<DiscoveredSubject>
)

class GurukulContentLoader(private val context: Context) {

    private val jsonParser = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    private var academicIndexRoot: AcademicIndexRoot? = null

    init {
        VideoOverrideManager.init(context)
        loadAcademicIndex()
    }

    private fun loadAcademicIndex() {
        try {
            val jsonText = context.assets.open("gurukul_contents/manifests/academic_index.json")
                .bufferedReader()
                .use { it.readText() }
            academicIndexRoot = jsonParser.decodeFromString(AcademicIndexRoot.serializer(), jsonText)
        } catch (e: Exception) {
            academicIndexRoot = null
        }
    }

    fun getDiscoveredGrades(): List<DiscoveredGrade> {
        val root = academicIndexRoot ?: return emptyList()
        return root.classes.map { (classKey, classObj) ->
            val subjectsList = classObj.subjects.map { (subjKey, subjObj) ->
                DiscoveredSubject(
                    subjectId = subjObj.subjectId,
                    displayName = subjObj.sourceSubjectLabel.ifEmpty { subjKey.capitalize() },
                    artifacts = subjObj.artifacts
                )
            }.sortedBy { it.displayName }

            DiscoveredGrade(
                classId = classObj.classId,
                classLevel = classObj.classLevel,
                displayName = "Class ${classObj.classLevel}",
                subjects = subjectsList
            )
        }.sortedBy { it.classLevel }
    }

    fun loadEnvelope(normalizedPath: String): GurukulEnvelope? {
        return try {
            val assetPath = "gurukul_contents/$normalizedPath"
            val jsonText = context.assets.open(assetPath).bufferedReader().use { it.readText() }
            GurukulJsonReader.parseEnvelope(jsonText)
        } catch (e: Exception) {
            null
        }
    }

    fun loadAdaptedArtifact(normalizedPath: String): AdaptedArtifact? {
        val env = loadEnvelope(normalizedPath) ?: return null
        return GurukulAdapterRegistry.adapt(env)
    }

    fun getAssetImagePath(classLevel: Int, subjectId: String, chapterNumber: Int): String? {
        val chStr = chapterNumber.toString().padStart(2, '0')
        val normSubj = when {
            subjectId.contains("eng") -> "english"
            subjectId.contains("hin") -> "hindi"
            subjectId.contains("mat") || subjectId.contains("math") -> "maths"
            subjectId.contains("sci") -> "science"
            else -> "social"
        }

        // Try direct asset file match under gurukul_contents/assets/
        val assetDir = "gurukul_contents/assets/class_$classLevel/$normSubj"
        try {
            val files = context.assets.list(assetDir) ?: emptyArray()
            val match = files.firstOrNull { it.contains("ch$chStr") || it.contains("ch_$chStr") || it.contains("c$chStr") }
            if (match != null) {
                return "$assetDir/$match"
            }
        } catch (e: Exception) {
        }
        return null
    }
}
