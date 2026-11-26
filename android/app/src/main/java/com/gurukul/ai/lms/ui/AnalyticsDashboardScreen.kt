import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gurukul.ai.lms.models.LmsSubject
import com.gurukul.ai.lms.models.TaxonomyLevel

/**
 * Student Analytics & Mastery Dashboard Composable.
 * Displays Bloom's Taxonomy cognitive ratings breakdown, subject progress cards,
 * and upcoming SM-2 flashcard revision queue.
 */
@Composable
fun AnalyticsDashboardScreen(
    subjectMastery: Map<LmsSubject, Float> = mapOf(
        LmsSubject.ENGLISH to 0.85f,
        LmsSubject.HINDI to 0.90f,
        LmsSubject.MATHS to 0.78f,
        LmsSubject.SCIENCE to 0.88f
    ),
    bloomProgress: Map<TaxonomyLevel, Float> = mapOf(
        TaxonomyLevel.REMEMBER to 0.92f,
        TaxonomyLevel.UNDERSTAND to 0.88f,
        TaxonomyLevel.APPLY to 0.82f,
        TaxonomyLevel.ANALYZE to 0.75f,
        TaxonomyLevel.EVALUATE to 0.70f,
        TaxonomyLevel.CREATE to 0.65f
    ),
    revisionQueueCount: Int = 12,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF020617))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // Header
        item {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = "REAL-TIME LEARNING ANALYTICS",
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = Color(0xFF818CF8),
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.5.sp
                    )
                )
                Text(
                    text = "Student Performance & Mastery Dashboard",
                    style = MaterialTheme.typography.titleLarge.copy(
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                )
            }
        }

        // Revision Due Queue Banner
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF312E81).copy(alpha = 0.3f)),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.dp, Color(0xFF6366F1).copy(alpha = 0.4f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(20.dp).fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            text = "SPACED REPETITION (SM-2)",
                            style = MaterialTheme.typography.labelSmall.copy(
                                color = Color(0xFFA5B4FC),
                                fontWeight = FontWeight.Bold
                            )
                        )
                        Text(
                            text = "$revisionQueueCount Flashcards Due Today",
                            style = MaterialTheme.typography.titleMedium.copy(
                                color = Color.White,
                                fontWeight = FontWeight.ExtraBold
                            )
                        )
                    }
                    Button(
                        onClick = {},
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Review Now", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Subject Mastery Cards Grid
        item {
            Text(
                text = "SUBJECT MASTERY PROGRESS",
                style = MaterialTheme.typography.labelSmall.copy(
                    color = Color(0xFF34D399),
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.5.sp
                )
            )
        }

        items(subjectMastery.entries.toList()) { (subject, progress) ->
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.dp, Color(0xFF1E293B)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = subject.displayName,
                            style = MaterialTheme.typography.titleMedium.copy(
                                color = Color.White,
                                fontWeight = FontWeight.Bold
                            )
                        )
                        Text(
                            text = "${(progress * 100).toInt()}%",
                            style = MaterialTheme.typography.titleSmall.copy(
                                color = Color(0xFF34D399),
                                fontWeight = FontWeight.ExtraBold
                            )
                        )
                    }

                    LinearProgressIndicator(
                        progress = { progress },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp),
                        color = Color(0xFF10B981),
                        trackColor = Color(0xFF1E293B),
                        strokeCap = androidx.compose.ui.graphics.StrokeCap.Round
                    )
                }
            }
        }

        // Bloom's Taxonomy Breakdown
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                shape = RoundedCornerShape(24.dp),
                border = BorderStroke(1.dp, Color(0xFF1E293B)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Text(
                        text = "BLOOM'S TAXONOMY COGNITIVE BREAKDOWN",
                        style = MaterialTheme.typography.labelSmall.copy(
                            color = Color(0xFFF59E0B),
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.5.sp
                        )
                    )

                    bloomProgress.forEach { (level, pct) ->
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = level.name,
                                    style = MaterialTheme.typography.bodyMedium.copy(
                                        color = Color(0xFFCBD5E1),
                                        fontWeight = FontWeight.Medium
                                    )
                                )
                                Text(
                                    text = "${(pct * 100).toInt()}%",
                                    style = MaterialTheme.typography.bodyMedium.copy(
                                        color = Color(0xFFFBBF24),
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                            }
                            LinearProgressIndicator(
                                progress = { pct },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(6.dp),
                                color = Color(0xFFF59E0B),
                                trackColor = Color(0xFF1E293B),
                                strokeCap = androidx.compose.ui.graphics.StrokeCap.Round
                            )
                        }
                    }
                }
            }
        }
    }
}
