package com.gurukul.ai.lms.loader

import android.content.Context
import com.gurukul.ai.lms.models.*
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
                    displayName = if (subjObj.sourceSubjectLabel.isNotBlank()) subjObj.sourceSubjectLabel else subjKey.replaceFirstChar { it.uppercase() },
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

    fun loadChapterNote(classLevel: Int, subject: LmsSubject, artifact: AcademicIndexArtifact): ChapterNote? {
        val adapted = loadAdaptedArtifact(artifact.normalizedPath) ?: return null
        val source = adapted.originalSource.jsonObject

        val chapters = (source["chapters"] as? JsonArray) ?: (source["chapter_notes"] as? JsonArray) ?: (source["chapters_master_data"] as? JsonArray)
        val firstCh = chapters?.firstOrNull()?.jsonObject ?: source

        val chNum = (firstCh["chapter_number"] as? JsonPrimitive)?.intOrNull ?: (firstCh["chapter"] as? JsonPrimitive)?.intOrNull ?: 1
        val chTitle = (firstCh["chapter_title"] as? JsonPrimitive)?.contentOrNull ?: (firstCh["title"] as? JsonPrimitive)?.contentOrNull ?: "Chapter $chNum"
        val overview = (firstCh["overview"] as? JsonPrimitive)?.contentOrNull ?: (firstCh["core_summary"] as? JsonPrimitive)?.contentOrNull ?: (firstCh["summary"] as? JsonPrimitive)?.contentOrNull ?: "No overview summary provided."
        val theme = (firstCh["central_theme"] as? JsonPrimitive)?.contentOrNull ?: (firstCh["theme"] as? JsonPrimitive)?.contentOrNull ?: chTitle

        val termsList = mutableListOf<KeyTerm>()
        val termsArray = (firstCh["key_terms"] as? JsonArray) ?: (firstCh["vocabulary"] as? JsonArray) ?: (firstCh["key_terminology"] as? JsonArray)
        termsArray?.forEach { termElem ->
            if (termElem is JsonObject) {
                val t = (termElem["term"] as? JsonPrimitive)?.contentOrNull ?: (termElem["word"] as? JsonPrimitive)?.contentOrNull ?: ""
                val d = (termElem["definition"] as? JsonPrimitive)?.contentOrNull ?: (termElem["meaning"] as? JsonPrimitive)?.contentOrNull ?: ""
                val ex = (termElem["example"] as? JsonPrimitive)?.contentOrNull
                if (t.isNotBlank() || d.isNotBlank()) {
                    termsList.add(KeyTerm(term = t, definition = d, usageExample = ex))
                }
            }
        }

        return ChapterNote(
            id = "G$classLevel-${subject.code}-C${chNum.toString().padStart(2, '0')}",
            subject = subject,
            chapterNumber = chNum,
            chapterName = chTitle,
            unitTitle = "Unit ${((chNum - 1) / 3) + 1}",
            markdownBody = overview,
            overviewSummary = overview,
            centralTheme = theme,
            keyTerms = termsList
        )
    }

    fun loadFlashcards(classLevel: Int, subject: LmsSubject, artifact: AcademicIndexArtifact): List<Flashcard> {
        val adapted = loadAdaptedArtifact(artifact.normalizedPath) ?: return emptyList()
        val source = adapted.originalSource.jsonObject
        val cardsList = mutableListOf<Flashcard>()

        val rawCards = (source["flashcards"] as? JsonArray) ?: (source["cards"] as? JsonArray) ?: (source["items"] as? JsonArray)
        rawCards?.forEachIndexed { idx, cardElem ->
            if (cardElem is JsonObject) {
                val term = (cardElem["term"] as? JsonPrimitive)?.contentOrNull ?: (cardElem["word"] as? JsonPrimitive)?.contentOrNull ?: (cardElem["front"] as? JsonPrimitive)?.contentOrNull ?: "Term #${idx + 1}"
                val def = (cardElem["definition"] as? JsonPrimitive)?.contentOrNull ?: (cardElem["meaning"] as? JsonPrimitive)?.contentOrNull ?: (cardElem["back"] as? JsonPrimitive)?.contentOrNull ?: ""
                cardsList.add(
                    Flashcard(
                        id = "f_$idx",
                        subject = subject,
                        chapterId = "C01",
                        frontText = term,
                        backText = def,
                        leitnerBox = LeitnerBox.BOX_1_NEW
                    )
                )
            }
        }

        return cardsList
    }

    fun loadMindmap(classLevel: Int, subject: LmsSubject, artifact: AcademicIndexArtifact): Mindmap? {
        val adapted = loadAdaptedArtifact(artifact.normalizedPath) ?: return null
        val source = adapted.originalSource.jsonObject

        val mapObj = (source["mind_map"] as? JsonObject) ?: (source["mindmap"] as? JsonObject) ?: source
        val rootTitle = (mapObj["root_node"] as? JsonPrimitive)?.contentOrNull ?: (mapObj["chapter_title"] as? JsonPrimitive)?.contentOrNull ?: "Central Concept"

        val nodesList = mutableListOf<MindmapNode>()
        nodesList.add(MindmapNode(id = "root", label = rootTitle, parentId = null, category = "Root"))

        val branches = (mapObj["sub_nodes"] as? JsonArray) ?: (mapObj["branches"] as? JsonArray) ?: (mapObj["nodes"] as? JsonArray)
        branches?.forEachIndexed { bIdx, bElem ->
            if (bElem is JsonObject) {
                val bTitle = (bElem["title"] as? JsonPrimitive)?.contentOrNull ?: (bElem["name"] as? JsonPrimitive)?.contentOrNull ?: "Branch #${bIdx + 1}"
                val bId = "b_$bIdx"
                nodesList.add(MindmapNode(id = bId, label = bTitle, parentId = "root", category = "Branch"))

                val children = (bElem["child_nodes"] as? JsonArray) ?: (bElem["children"] as? JsonArray)
                children?.forEachIndexed { cIdx, cElem ->
                    val cTitle = if (cElem is JsonPrimitive) cElem.contentOrNull else (cElem as? JsonObject)?.get("title")?.jsonPrimitive?.contentOrNull
                    if (!cTitle.isNullOrBlank()) {
                        nodesList.add(MindmapNode(id = "c_${bIdx}_$cIdx", label = cTitle, parentId = bId, category = "Sub-Concept"))
                    }
                }
            }
        }

        return Mindmap(
            id = "mm_1",
            subject = subject,
            chapterId = "C01",
            rootTitle = rootTitle,
            nodes = nodesList
        )
    }

    fun loadQuizQuestions(classLevel: Int, subject: LmsSubject, artifact: AcademicIndexArtifact): List<QuizQuestion> {
        val adapted = loadAdaptedArtifact(artifact.normalizedPath) ?: return emptyList()
        val source = adapted.originalSource.jsonObject
        val questionsList = mutableListOf<QuizQuestion>()

        val rawQuestions = (source["questions"] as? JsonArray) ?: (source["quiz"] as? JsonArray) ?: (source["chapter_quizzes"] as? JsonArray)
        rawQuestions?.forEachIndexed { qIdx, qElem ->
            if (qElem is JsonObject) {
                val qText = (qElem["question"] as? JsonPrimitive)?.contentOrNull ?: (qElem["question_text"] as? JsonPrimitive)?.contentOrNull ?: (qElem["prompt"] as? JsonPrimitive)?.contentOrNull ?: ""
                val optsArray = qElem["options"] as? JsonArray
                val options = optsArray?.mapNotNull { (it as? JsonPrimitive)?.contentOrNull } ?: emptyList()
                val ansStr = (qElem["answer"] as? JsonPrimitive)?.contentOrNull ?: ""
                val expl = (qElem["explanation"] as? JsonPrimitive)?.contentOrNull ?: "Explanation for $qText"

                var ansIdx = 0
                if (ansStr.isNotBlank() && options.isNotEmpty()) {
                    val found = options.indexOfFirst { it.trim().equals(ansStr.trim(), ignoreCase = true) }
                    if (found >= 0) ansIdx = found
                }

                if (qText.isNotBlank()) {
                    questionsList.add(
                        QuizQuestion(
                            id = "q_$qIdx",
                            subject = subject,
                            chapterId = "C01",
                            questionText = qText,
                            options = if (options.isNotEmpty()) options else listOf("Option A", "Option B", "Option C", "Option D"),
                            correctAnswerIndex = ansIdx,
                            explanation = expl
                        )
                    )
                }
            }
        }

        return questionsList
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
