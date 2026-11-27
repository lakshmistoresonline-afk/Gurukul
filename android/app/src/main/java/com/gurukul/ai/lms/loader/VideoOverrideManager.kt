package com.gurukul.ai.lms.loader

import android.content.Context
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class VideoOverrideItem(
    @SerialName("class_label") val classLabel: String,
    @SerialName("subject_label") val subjectLabel: String,
    @SerialName("record_index") val recordIndex: Int? = null,
    @SerialName("chapter_number") val chapterNumber: Int? = null,
    @SerialName("chapter_title") val chapterTitle: String? = null,
    @SerialName("video_title") val videoTitle: String? = null,
    @SerialName("video_link") val videoLink: String,
    val status: String? = null
)

object VideoOverrideManager {
    private var overrides: List<VideoOverrideItem> = emptyList()

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    fun init(context: Context) {
        try {
            val assetManager = context.assets
            val jsonString = assetManager.open("gurukul_contents/media_integration/video_link_overrides.json")
                .bufferedReader()
                .use { it.readText() }
            overrides = json.decodeFromString(jsonString)
        } catch (e: Exception) {
            overrides = emptyList()
        }
    }

    fun getOverrideLink(classLabel: String, subjectLabel: String, chapterNumber: Int?): VideoOverrideItem? {
        val normClass = classLabel.trim().lowercase()
        val normSubj = subjectLabel.trim().lowercase()

        return overrides.firstOrNull { item ->
            val matchesClass = item.classLabel.trim().lowercase() == normClass
            val matchesSubj = item.subjectLabel.trim().lowercase() == normSubj ||
                    (normSubj.contains("math") && item.subjectLabel.lowercase().contains("math")) ||
                    (normSubj.contains("english") && item.subjectLabel.lowercase().contains("english"))
            val matchesCh = (chapterNumber != null && item.chapterNumber == chapterNumber) ||
                    (item.chapterNumber == null && chapterNumber == null) ||
                    item.recordIndex == 15 // Maths Mela Overview
            matchesClass && matchesSubj && matchesCh
        }
    }
}
