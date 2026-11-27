package com.gurukul.ai.lms.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.gurukul.ai.lms.models.*
import com.gurukul.ai.lms.ui.components.AdaptiveQuizEngine
import com.gurukul.ai.lms.ui.components.FlashcardDeckScreen
import com.gurukul.ai.lms.ui.components.InteractiveMindmapView
import com.gurukul.ai.lms.ui.components.PedagogyGuidanceView
import com.gurukul.ai.lms.ui.components.RichNotesReader
import com.gurukul.ai.lms.viewmodel.Class5LmsViewModel
import com.gurukul.ai.lms.viewmodel.LmsUiState

/**
 * Supported Dashboard Navigation Tabs.
 */
enum class DashboardTab(val displayName: String) {
    NOTES("Notes"),
    FLASHCARDS("Flashcards"),
    MINDMAP("Mind Map"),
    QUIZZES("Quizzes"),
    PEDAGOGY("Teacher Guidance")
}

/**
 * Main Class 5 Student Dashboard Composable Screen.
 * Integrates Top Subject Selector Bar (`English`, `Hindi`, `Mathematics`, `Science / EVS`),
 * Dynamic Navigation Tab Row, UDF ViewModel State Flow, KaTeX Latex rendering, and 3D Flashcards.
 */
@Composable
fun Class5StudentDashboardScreen(
    viewModel: Class5LmsViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    when (val state = uiState) {
        is LmsUiState.Loading -> {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFF020617)),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = Color(0xFF6366F1))
            }
        }

        is LmsUiState.Error -> {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFF020617))
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = state.message,
                    color = Color(0xFFEF4444),
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        is LmsUiState.Success -> {
            Scaffold(
                containerColor = Color(0xFF020617),
                topBar = {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF0F172A))
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Dashboard Top Header
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Gurukul AI Classroom",
                                style = MaterialTheme.typography.titleLarge.copy(
                                    color = Color.White,
                                    fontWeight = FontWeight.Black
                                )
                            )
                            Surface(
                                color = Color(0xFF6366F1),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(
                                    text = "CLASS ${state.selectedGrade}",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        color = Color.White,
                                        fontWeight = FontWeight.ExtraBold
                                    ),
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                )
                            }
                        }

                        // Scrollable Class Selector Bar (Classes 5 to 10)
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            listOf(5, 6, 7, 8, 9, 10).forEach { gradeNum ->
                                val isClassSelected = state.selectedGrade == gradeNum
                                FilterChip(
                                    selected = isClassSelected,
                                    onClick = { viewModel.selectGrade(gradeNum) },
                                    label = {
                                        Text(
                                            text = "Class $gradeNum",
                                            fontWeight = if (isClassSelected) FontWeight.Bold else FontWeight.Medium
                                        )
                                    },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = Color(0xFF10B981),
                                        selectedLabelColor = Color.White,
                                        containerColor = Color(0xFF1E293B),
                                        labelColor = Color(0xFF94A3B8)
                                    ),
                                    shape = RoundedCornerShape(12.dp)
                                )
                            }
                        }

                        // Scrollable Top Subject Selector Bar
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            LmsSubject.entries.forEach { subject ->
                                val isSelected = state.selectedSubject == subject
                                FilterChip(
                                    selected = isSelected,
                                    onClick = { viewModel.selectSubject(subject) },
                                    label = {
                                        Text(
                                            text = subject.displayName,
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                        )
                                    },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = Color(0xFF6366F1),
                                        selectedLabelColor = Color.White,
                                        containerColor = Color(0xFF1E293B),
                                        labelColor = Color(0xFF94A3B8)
                                    ),
                                    shape = RoundedCornerShape(12.dp)
                                )
                            }
                        }

                        // Dynamic Navigation Tab Row
                        ScrollableTabRow(
                            selectedTabIndex = state.activeTab.ordinal,
                            containerColor = Color(0xFF0F172A),
                            contentColor = Color(0xFF818CF8),
                            edgePadding = 0.dp,
                            divider = {}
                        ) {
                            DashboardTab.entries.forEach { tab ->
                                Tab(
                                    selected = state.activeTab == tab,
                                    onClick = { viewModel.selectTab(tab) },
                                    text = {
                                        Text(
                                            text = tab.displayName,
                                            fontWeight = if (state.activeTab == tab) FontWeight.Bold else FontWeight.Normal,
                                            fontSize = 13.sp
                                        )
                                    }
                                )
                            }
                        }
                    }
                }
            ) { paddingValues ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                ) {
                    when (state.activeTab) {
                        DashboardTab.NOTES -> RichNotesReader(note = state.chapterNote)
                        DashboardTab.FLASHCARDS -> FlashcardDeckScreen(
                            flashcards = state.flashcards,
                            onCardStatusUpdate = { id, box ->
                                viewModel.updateFlashcardLeitner(id, box)
                            }
                        )
                        DashboardTab.MINDMAP -> InteractiveMindmapView(mindmap = state.mindmap)
                        DashboardTab.QUIZZES -> AdaptiveQuizEngine(questions = state.quizQuestions)
                        DashboardTab.PEDAGOGY -> PedagogyGuidanceView(guides = state.pedagogyGuides)
                    }
                }
            }
        }
    }
}
