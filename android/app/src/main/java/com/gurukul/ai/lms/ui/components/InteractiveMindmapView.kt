package com.gurukul.ai.lms.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gurukul.ai.lms.models.Mindmap

/**
 * Interactive Concept Mindmap Visualizer Composable.
 * Custom Canvas-backed graph layout with cubic Bezier connection curves,
 * pan/zoom gesture detection, and parent-child hierarchical concept nodes.
 */
@Composable
fun InteractiveMindmapView(
    mindmap: Mindmap,
    modifier: Modifier = Modifier
) {
    var panOffset by remember { mutableStateOf(Offset.Zero) }
    var scaleFactor by remember { mutableFloatStateOf(1f) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Mindmap Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "CONCEPT MIND MAP & STRUCTURE",
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = Color(0xFF818CF8),
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.5.sp
                    )
                )
                Text(
                    text = mindmap.rootTitle,
                    style = MaterialTheme.typography.titleLarge.copy(
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                )
            }
            Surface(
                color = Color(0xFF6366F1).copy(alpha = 0.15f),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(
                    text = "${mindmap.nodes.size} Nodes",
                    style = MaterialTheme.typography.labelMedium.copy(color = Color(0xFFA5B4FC)),
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                )
            }
        }

        // Custom Canvas-backed Graph Container
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
            shape = RoundedCornerShape(24.dp),
            border = BorderStroke(1.dp, Color(0xFF1E293B)),
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .pointerInput(Unit) {
                    detectTransformGestures { _, pan, zoom, _ ->
                        panOffset += pan
                        scaleFactor = (scaleFactor * zoom).coerceIn(0.5f, 3f)
                    }
                }
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                // Cubic Bezier Graph Connections Canvas
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val rootCenter = Offset(size.width / 2f + panOffset.x, 60.dp.toPx() + panOffset.y)

                    mindmap.nodes.forEachIndexed { idx, node ->
                        if (node.parentId != null) {
                            val childOffset = Offset(
                                x = rootCenter.x + (idx * 120 - 180) * scaleFactor,
                                y = rootCenter.y + 160.dp.toPx() * scaleFactor
                            )

                            // Draw Smooth Cubic Bezier Connection Line
                            val connectionPath = Path().apply {
                                moveTo(rootCenter.x, rootCenter.y)
                                cubicTo(
                                    rootCenter.x, (rootCenter.y + childOffset.y) / 2f,
                                    childOffset.x, (rootCenter.y + childOffset.y) / 2f,
                                    childOffset.x, childOffset.y
                                )
                            }

                            drawPath(
                                path = connectionPath,
                                color = Color(0xFF6366F1).copy(alpha = 0.5f),
                                style = Stroke(width = 3.dp.toPx() * scaleFactor)
                            )
                        }
                    }
                }

                // Hierarchical Concept Nodes List View
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(mindmap.nodes) { node ->
                        val isRoot = node.parentId == null
                        val indent = if (isRoot) 0.dp else 24.dp

                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = if (isRoot) Color(0xFF1E1B4B) else Color(0xFF020617)
                            ),
                            shape = RoundedCornerShape(16.dp),
                            border = BorderStroke(
                                1.dp,
                                if (isRoot) Color(0xFF6366F1) else Color(0xFF1E293B)
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(start = indent)
                        ) {
                            Row(
                                modifier = Modifier
                                    .padding(16.dp)
                                    .fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(10.dp)
                                            .background(
                                                color = if (isRoot) Color(0xFF818CF8) else Color(0xFF34D399),
                                                shape = RoundedCornerShape(5.dp)
                                            )
                                    )
                                    Text(
                                        text = node.label,
                                        style = MaterialTheme.typography.bodyLarge.copy(
                                            color = Color.White,
                                            fontWeight = if (isRoot) FontWeight.Bold else FontWeight.Medium
                                        )
                                    )
                                }

                                Surface(
                                    color = Color(0xFF1E293B),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text(
                                        text = node.category,
                                        style = MaterialTheme.typography.labelSmall.copy(
                                            color = Color(0xFF94A3B8)
                                        ),
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
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
