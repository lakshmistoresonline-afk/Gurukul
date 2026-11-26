package com.gurukul.ai.lms.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gurukul.ai.lms.models.QuizQuestion

/**
 * Adaptive Quiz Engine Composable.
 * Displays MCQs, handles option selection, provides immediate feedback, step-by-step explanations,
 * and renders a score summary progress bar.
 */
@Composable
fun AdaptiveQuizEngine(
    questions: List<QuizQuestion>,
    modifier: Modifier = Modifier
) {
    if (questions.isEmpty()) {
        Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("No quiz questions available.", color = Color.Gray)
        }
        return
    }

    var selectedAnswers by remember { mutableStateOf(mapOf<Int, Int>()) }
    var showExplanations by remember { mutableStateOf(mapOf<Int, Boolean>()) }

    val totalAnswered = selectedAnswers.size
    val correctCount = selectedAnswers.count { (qIdx, optIdx) ->
        optIdx == questions[qIdx].correctAnswerIndex
    }
    val scoreProgress = if (questions.isNotEmpty()) correctCount.toFloat() / questions.size else 0f

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Quiz Header & Score Summary Progress Bar
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                shape = RoundedCornerShape(24.dp),
                border = BorderStroke(1.dp, Color(0xFF1E293B)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "FINAL CHAPTER ASSESSMENT • STEP 6 OF 6",
                            style = MaterialTheme.typography.labelSmall.copy(
                                color = Color(0xFFF59E0B),
                                fontWeight = FontWeight.Black,
                                letterSpacing = 1.5.sp
                            )
                        )
                        Text(
                            text = "Score: $correctCount / ${questions.size}",
                            style = MaterialTheme.typography.titleMedium.copy(
                                color = Color.White,
                                fontWeight = FontWeight.ExtraBold
                            )
                        )
                    }

                    LinearProgressIndicator(
                        progress = { scoreProgress },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(10.dp),
                        color = Color(0xFF10B981),
                        trackColor = Color(0xFF1E293B),
                        strokeCap = androidx.compose.ui.graphics.StrokeCap.Round
                    )
                }
            }
        }

        // Questions List
        itemsIndexed(questions) { qIdx, question ->
            val selectedOption = selectedAnswers[qIdx]
            val isAnswered = selectedOption != null
            val isCorrect = selectedOption == question.correctAnswerIndex

            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.dp, Color(0xFF1E293B)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Question Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "${qIdx + 1}. ${question.questionText}",
                            style = MaterialTheme.typography.titleMedium.copy(
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                lineHeight = 24.sp
                            ),
                            modifier = Modifier.weight(1f)
                        )
                    }

                    // Options Grid/Column
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        question.options.forEachIndexed { optIdx, optionText ->
                            val isThisSelected = selectedOption == optIdx
                            val isThisCorrect = optIdx == question.correctAnswerIndex

                            val containerColor = when {
                                !isAnswered -> Color(0xFF020617)
                                isThisCorrect -> Color(0xFF059669).copy(alpha = 0.2f)
                                isThisSelected -> Color(0xFFDC2626).copy(alpha = 0.2f)
                                else -> Color(0xFF020617)
                            }

                            val borderColor = when {
                                !isAnswered -> Color(0xFF1E293B)
                                isThisCorrect -> Color(0xFF10B981)
                                isThisSelected -> Color(0xFFEF4444)
                                else -> Color(0xFF1E293B)
                            }

                            Card(
                                colors = CardDefaults.cardColors(containerColor = containerColor),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, borderColor),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        if (!isAnswered) {
                                            selectedAnswers = selectedAnswers + (qIdx to optIdx)
                                            showExplanations = showExplanations + (qIdx to true)
                                        }
                                    }
                            ) {
                                Row(
                                    modifier = Modifier.padding(14.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Text(
                                        text = "${('A' + optIdx)}.",
                                        style = MaterialTheme.typography.titleSmall.copy(
                                            color = if (isThisCorrect && isAnswered) Color(0xFF34D399) else Color(0xFF818CF8),
                                            fontWeight = FontWeight.Bold
                                        )
                                    )
                                    Text(
                                        text = optionText,
                                        style = MaterialTheme.typography.bodyMedium.copy(
                                            color = Color(0xFFE2E8F0)
                                        )
                                    )
                                }
                            }
                        }
                    }

                    // Explanation Popup / Box
                    if (isAnswered && showExplanations[qIdx] == true) {
                        Surface(
                            color = Color(0xFF1E1B4B).copy(alpha = 0.6f),
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, Color(0xFF6366F1).copy(alpha = 0.3f))
                        ) {
                            Column(
                                modifier = Modifier.padding(14.dp),
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text(
                                    text = "Explanation & Reasoning:",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        color = Color(0xFFA5B4FC),
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                                Text(
                                    text = question.explanation,
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        color = Color(0xFFC7D2FE),
                                        lineHeight = 18.sp
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
