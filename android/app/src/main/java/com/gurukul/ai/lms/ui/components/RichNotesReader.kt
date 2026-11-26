package com.gurukul.ai.lms.ui.components

import androidx.compose.foundation.BorderStroke
import android.speech.tts.TextToSpeech
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gurukul.ai.lms.models.ChapterNote
import com.gurukul.ai.lms.models.LmsSubject
import java.util.Locale

/**
 * Rich Notes Reader Composable.
 * Features Text-To-Speech (TTS) audio controls, Devanagari-safe line-height padding (`28.sp`),
 * high-contrast theme toggling, and screen reader (TalkBack) accessibility semantics.
 */
@Composable
fun RichNotesReader(
    note: ChapterNote,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var isSpeaking by remember { mutableStateOf(false) }
    var isHighContrast by remember { mutableStateOf(false) }

    // Text-To-Speech Lifecycle Management
    var ttsEngine by remember { mutableStateOf<TextToSpeech?>(null) }

    DisposableEffect(note.subject) {
        val tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                val locale = if (note.subject == LmsSubject.HINDI) Locale("hi", "IN") else Locale.US
                ttsEngine?.language = locale
            }
        }
        ttsEngine = tts

        onDispose {
            tts.stop()
            tts.shutdown()
        }
    }

    val backgroundColor = if (isHighContrast) Color.Black else Color(0xFF020617)
    val cardBgColor = if (isHighContrast) Color(0xFF111111) else Color(0xFF0F172A)
    val primaryTextColor = if (isHighContrast) Color.Yellow else Color.White
    val secondaryTextColor = if (isHighContrast) Color.Cyan else Color(0xFFE2E8F0)

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(backgroundColor)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Accessibility Controls Row (TTS & High Contrast)
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Button(
                    onClick = {
                        if (isSpeaking) {
                            ttsEngine?.stop()
                            isSpeaking = false
                        } else {
                            val textToRead = "${note.chapterName}. ${note.overviewSummary} ${note.centralTheme}"
                            ttsEngine?.speak(textToRead, TextToSpeech.QUEUE_FLUSH, null, "TTS_READ_ALOUD")
                            isSpeaking = true
                        }
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isSpeaking) Color(0xFFDC2626) else Color(0xFF6366F1)
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.semantics {
                        contentDescription = if (isSpeaking) "Stop reading chapter aloud" else "Read chapter notes aloud"
                    }
                ) {
                    Text(
                        text = if (isSpeaking) "■ Stop Audio" else "🔊 Read Aloud (TTS)",
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = "High Contrast",
                        style = MaterialTheme.typography.labelSmall.copy(color = Color.White)
                    )
                    Switch(
                        checked = isHighContrast,
                        onCheckedChange = { isHighContrast = it }
                    )
                }
            }
        }

        // 1. Chapter Title & Unit Header
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = cardBgColor),
                shape = RoundedCornerShape(24.dp),
                border = BorderStroke(1.dp, if (isHighContrast) Color.Yellow else Color(0xFF1E293B)),
                modifier = Modifier
                    .fillMaxWidth()
                    .semantics {
                        contentDescription = "Unit ${note.chapterNumber}, ${note.unitTitle}. Chapter ${note.chapterName}"
                    }
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "UNIT ${note.chapterNumber} • ${note.unitTitle.uppercase()}",
                        style = MaterialTheme.typography.labelSmall.copy(
                            color = if (isHighContrast) Color.Cyan else Color(0xFF818CF8),
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.5.sp
                        )
                    )
                    Text(
                        text = note.chapterName,
                        style = MaterialTheme.typography.headlineMedium.copy(
                            color = primaryTextColor,
                            fontWeight = FontWeight.ExtraBold,
                            lineHeight = 36.sp
                        )
                    )
                }
            }
        }

        // 2. Overview Summary Box with Devanagari Line-Height Protection
        if (note.overviewSummary.isNotEmpty()) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = cardBgColor),
                    shape = RoundedCornerShape(20.dp),
                    border = BorderStroke(1.dp, if (isHighContrast) Color.Yellow else Color(0xFF1E293B)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .semantics {
                            contentDescription = "Chapter Summary: ${note.overviewSummary}"
                        }
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "CHAPTER SUMMARY & OVERVIEW",
                            style = MaterialTheme.typography.labelSmall.copy(
                                color = if (isHighContrast) Color.Cyan else Color(0xFF94A3B8),
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.2.sp
                            )
                        )
                        Text(
                            text = note.overviewSummary,
                            style = MaterialTheme.typography.bodyLarge.copy(
                                color = secondaryTextColor,
                                lineHeight = 28.sp // Devanagari matra line-height padding
                            )
                        )
                    }
                }
            }
        }

        // 3. Central Theme Banner
        if (note.centralTheme.isNotEmpty()) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF312E81).copy(alpha = 0.3f)),
                    shape = RoundedCornerShape(20.dp),
                    border = BorderStroke(1.dp, Color(0xFF6366F1).copy(alpha = 0.3f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = "CENTRAL THEME & MORAL MESSAGE",
                            style = MaterialTheme.typography.labelSmall.copy(
                                color = Color(0xFFA5B4FC),
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.2.sp
                            )
                        )
                        Text(
                            text = note.centralTheme,
                            style = MaterialTheme.typography.bodyLarge.copy(
                                color = Color(0xFFC7D2FE),
                                fontWeight = FontWeight.Medium,
                                lineHeight = 28.sp // Devanagari matra line-height padding
                            )
                        )
                    }
                }
            }
        }

        // 4. Enriched Key Terminology Grid
        if (note.keyTerms.isNotEmpty()) {
            item {
                Text(
                    text = "KEY TERMINOLOGY & VOCABULARY (शब्दार्थ)",
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = Color(0xFF34D399),
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.5.sp
                    ),
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            items(note.keyTerms) { term ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = cardBgColor),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, Color(0xFF1E293B)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .semantics {
                            contentDescription = "Term: ${term.term}. Definition: ${term.definition}"
                        }
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = term.term,
                                style = MaterialTheme.typography.titleMedium.copy(
                                    color = Color(0xFF34D399),
                                    fontWeight = FontWeight.ExtraBold,
                                    lineHeight = 28.sp
                                )
                            )
                            if (term.ashuddhCorrection != null) {
                                Surface(
                                    color = Color(0xFFEF4444).copy(alpha = 0.15f),
                                    shape = RoundedCornerShape(8.dp),
                                    border = BorderStroke(1.dp, Color(0xFFEF4444).copy(alpha = 0.3f))
                                ) {
                                    Text(
                                        text = "अशुद्ध: ${term.ashuddhCorrection}",
                                        style = MaterialTheme.typography.labelSmall.copy(
                                            color = Color(0xFFFCA5A5),
                                            fontSize = 11.sp,
                                            lineHeight = 20.sp
                                        ),
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }

                        Text(
                            text = term.definition,
                            style = MaterialTheme.typography.bodyMedium.copy(
                                color = secondaryTextColor,
                                lineHeight = 26.sp
                            )
                        )

                        if (!term.usageExample.isNullOrEmpty()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color(0xFF020617), RoundedCornerShape(12.dp))
                                    .padding(12.dp)
                            ) {
                                Text(
                                    text = "Usage: \"${term.usageExample}\"",
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        color = Color(0xFF94A3B8),
                                        fontFamily = FontFamily.Serif,
                                        lineHeight = 22.sp
                                    )
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
