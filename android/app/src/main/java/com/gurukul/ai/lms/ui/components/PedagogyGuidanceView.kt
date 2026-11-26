package com.gurukul.ai.lms.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gurukul.ai.lms.models.PedagogyGuide

/**
 * Pedagogy Guidance View Composable.
 * Expandable parent/teacher accordion panel displaying unit targets,
 * NCF-SE 2023 learning outcomes, and suggested teaching methods.
 */
@Composable
fun PedagogyGuidanceView(
    guides: List<PedagogyGuide>,
    modifier: Modifier = Modifier
) {
    var expandedGuideId by remember { mutableStateOf<String?>(guides.firstOrNull()?.id) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = "PEDAGOGICAL GUIDANCE & CURRICULAR GOALS",
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = Color(0xFFF59E0B),
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.5.sp
                    )
                )
                Text(
                    text = "Parent & Teacher Instruction Guide (NEP 2020 & NCF-SE 2023)",
                    style = MaterialTheme.typography.titleMedium.copy(
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                )
            }
        }

        items(guides) { guide ->
            val isExpanded = expandedGuideId == guide.id

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
                    // Accordion Header
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                expandedGuideId = if (isExpanded) null else guide.id
                            },
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                color = Color(0xFFF59E0B).copy(alpha = 0.15f),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    text = guide.curriculumCode,
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        color = Color(0xFFFBBF24),
                                        fontWeight = FontWeight.Bold
                                    ),
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                            Text(
                                text = guide.unitTitle,
                                style = MaterialTheme.typography.titleMedium.copy(
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold
                                )
                            )
                        }

                        Text(
                            text = if (isExpanded) "▲ Hide" else "▼ Expand",
                            style = MaterialTheme.typography.labelSmall.copy(color = Color(0xFF94A3B8))
                        )
                    }

                    // Accordion Body
                    if (isExpanded) {
                        Divider(color = Color(0xFF1E293B))

                        // Learning Objectives
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                text = "Unit Learning Outcomes:",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    color = Color(0xFF818CF8),
                                    fontWeight = FontWeight.Bold
                                )
                            )
                            guide.learningObjectives.forEach { obj ->
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalAlignment = Alignment.Top
                                ) {
                                    Text("•", color = Color(0xFF818CF8))
                                    Text(
                                        text = obj,
                                        style = MaterialTheme.typography.bodySmall.copy(color = Color(0xFFCBD5E1))
                                    )
                                }
                            }
                        }

                        // Teaching Tips
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                text = "Teaching & Activity Tips:",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    color = Color(0xFF34D399),
                                    fontWeight = FontWeight.Bold
                                )
                            )
                            guide.teachingTips.forEach { tip ->
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalAlignment = Alignment.Top
                                ) {
                                    Text("✓", color = Color(0xFF34D399))
                                    Text(
                                        text = tip,
                                        style = MaterialTheme.typography.bodySmall.copy(color = Color(0xFFCBD5E1))
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
