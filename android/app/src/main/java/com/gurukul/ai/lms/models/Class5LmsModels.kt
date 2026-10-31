package com.gurukul.ai.lms.models

import androidx.compose.runtime.Immutable
import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName

/**
 * Supported Class 5 Subject Taxonomy.
 */
enum class LmsSubject(val displayName: String, val code: String) {
    ENGLISH("English", "ENG"),
    HINDI("Hindi (हिंदी)", "HIN"),
    MATHS("Mathematics", "MAT"),
    SCIENCE("Science / EVS", "SCI")
}

/**
 * Spaced Repetition Leitner Box Classification.
 */
enum class LeitnerBox {
    BOX_1_NEW,
    BOX_2_REVIEW,
    BOX_3_MASTERED
}

/**
 * Bloom's Taxonomy Cognitive Complexity Rating.
 */
enum class TaxonomyLevel {
    REMEMBER,
    UNDERSTAND,
    APPLY,
    ANALYZE,
    EVALUATE,
    CREATE
}

/**
 * Room Entity: Flashcard Spaced Repetition State Persistence.
 */
@Entity(tableName = "flashcard_states")
data class FlashcardStateEntity(
    @PrimaryKey val flashcardId: String,
    val subjectCode: String,
    val chapterId: String,
    val leitnerBox: LeitnerBox,
    val lastReviewedTimestamp: Long,
    val reviewCount: Int,
    val intervalDays: Int = 1,
    val easeFactor: Float = 2.5f
)

/**
 * Room Entity: Quiz Scoring History Persistence.
 */
@Entity(tableName = "quiz_scores")
data class QuizScoreEntity(
    @PrimaryKey val scoreRecordId: String,
    val subjectCode: String,
    val chapterId: String,
    val scoreAchieved: Int,
    val totalQuestions: Int,
    val percentage: Float,
    val timestamp: Long
)

// --- 10 REQUIRED CLASS 5 JSON MODULE MODELS ---

// 1. Media Directory Index Model
data class MediaDirectoryDataset(
    @SerializedName("class_id") val classId: String? = "Class 5",
    @SerializedName("subject") val subject: String? = null,
    @SerializedName("diagrams") val diagrams: List<DiagramAsset> = emptyList()
)

data class DiagramAsset(
    @SerializedName("image_filename") val imageFilename: String,
    @SerializedName("title") val title: String,
    @SerializedName("hotspots") val hotspots: List<DiagramHotspot> = emptyList()
)

data class DiagramHotspot(
    @SerializedName("x_percent") val xPercent: Float, // 0.0 to 100.0
    @SerializedName("y_percent") val yPercent: Float, // 0.0 to 100.0
    @SerializedName("label") val label: String,
    @SerializedName("tooltip") val tooltip: String
)

// 2. Studio Video Links Index Model
data class StudioVideoLinksDataset(
    @SerializedName("videos") val videos: List<StudioVideoItem> = emptyList()
)

data class StudioVideoItem(
    @SerializedName("video_id") val videoId: String,
    @SerializedName("title") val title: String,
    @SerializedName("duration_seconds") val durationSeconds: Int = 0,
    @SerializedName("thumbnail_url") val thumbnailUrl: String? = null,
    @SerializedName("topics_covered") val topicsCovered: List<String> = emptyList()
)

// 3. Overview Model
data class OverviewDataset(
    @SerializedName("chapter_title") val chapterTitle: String? = null,
    @SerializedName("summary") val summary: String? = null,
    @SerializedName("objectives") val objectives: List<String> = emptyList(),
    @SerializedName("key_terms") val keyTerms: List<String> = emptyList()
)

// 4. Notes Model
data class NotesDataset(
    @SerializedName("sections") val sections: List<NoteSection> = emptyList()
)

data class NoteSection(
    @SerializedName("heading") val heading: String,
    @SerializedName("content") val content: String,
    @SerializedName("stem_drawer") val stemDrawer: String? = null
)

// 5. Mindmaps Model
data class MindmapsDataset(
    @SerializedName("nodes") val nodes: List<MindmapNodeItem> = emptyList()
)

data class MindmapNodeItem(
    @SerializedName("node") val node: String,
    @SerializedName("children") val children: List<String> = emptyList()
)

// 6. Flashcards Model
data class FlashcardDataset(
    @SerializedName("flashcards") val cards: List<FlashcardItem> = emptyList()
)

data class FlashcardItem(
    @SerializedName("term") val term: String,
    @SerializedName("phonetics") val phonetics: String? = null,
    @SerializedName("definition") val definition: String,
    @SerializedName("example") val example: String? = null,
    @SerializedName("hint") val hint: String? = null
)

// 7. Quiz Model
data class QuizDataset(
    @SerializedName("questions") val questions: List<QuizItem> = emptyList()
)

data class QuizItem(
    @SerializedName("question") val question: String,
    @SerializedName("options") val options: List<String> = emptyList(),
    @SerializedName("answer") val answer: String,
    @SerializedName("explanation") val explanation: String
)

// 8. Question Papers Model
data class QuestionPapersDataset(
    @SerializedName("questions") val questions: List<ExamQuestionItem> = emptyList()
)

data class ExamQuestionItem(
    @SerializedName("type") val type: String? = "SHORT",
    @SerializedName("question") val question: String,
    @SerializedName("marks") val marks: Int = 3,
    @SerializedName("answer") val answer: String
)

// 9. Foundational Model
data class FoundationalDataset(
    @SerializedName("drills") val drills: List<FoundationalDrill> = emptyList()
)

data class FoundationalDrill(
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String
)

// 10. Master Model
data class MasterDataset(
    @SerializedName("challenge_questions") val challenges: List<ChallengeQuestion> = emptyList()
)

data class ChallengeQuestion(
    @SerializedName("question") val question: String,
    @SerializedName("solution") val solution: String
)

// --- COMPLIANCE DOMAIN MODELS ---

@Immutable
data class ChapterNote(
    val id: String,
    val subject: LmsSubject,
    val chapterNumber: Int,
    val chapterName: String,
    val unitTitle: String,
    val markdownBody: String,
    val overviewSummary: String,
    val centralTheme: String,
    val keyTerms: List<KeyTerm> = emptyList(),
    val pedagogyRefId: String? = null
)

@Immutable
data class KeyTerm(
    val term: String,
    val definition: String,
    val usageExample: String? = null,
    val synonyms: List<String> = emptyList(),
    val antonyms: List<String> = emptyList(),
    val ashuddhCorrection: String? = null
)

@Immutable
data class Flashcard(
    val id: String,
    val subject: LmsSubject,
    val chapterId: String,
    val frontText: String,
    val backText: String,
    val difficulty: String = "Medium",
    val leitnerBox: LeitnerBox = LeitnerBox.BOX_1_NEW
)

@Immutable
data class MindmapNode(
    val id: String,
    val label: String,
    val parentId: String? = null,
    val category: String = "Core Concept",
    val isExpanded: Boolean = true,
    val xPosition: Float = 0f,
    val yPosition: Float = 0f
)

@Immutable
data class MindmapEdge(
    val fromNodeId: String,
    val toNodeId: String,
    val relationshipLabel: String? = null
)

@Immutable
data class Mindmap(
    val id: String,
    val subject: LmsSubject,
    val chapterId: String,
    val rootTitle: String,
    val nodes: List<MindmapNode>,
    val edges: List<MindmapEdge> = emptyList()
)

@Immutable
data class PedagogyGuide(
    val id: String,
    val subject: LmsSubject,
    val unitTitle: String,
    val curriculumCode: String,
    val learningObjectives: List<String>,
    val teachingTips: List<String>,
    val bloomTargets: List<TaxonomyLevel> = emptyList()
)
