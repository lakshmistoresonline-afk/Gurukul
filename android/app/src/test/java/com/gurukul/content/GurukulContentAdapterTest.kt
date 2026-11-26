package com.gurukul.content

import kotlinx.serialization.json.*
import org.junit.Assert.*
import org.junit.Test

class GurukulContentAdapterTest {
    private fun envelope(type: String): GurukulEnvelope {
        val raw = """
        {
          "schema_version":"2.0.0",
          "record_id":"test_record",
          "record_type":"source_artifact",
          "curriculum":{"curriculum_id":null,"board_id":null,"class_id":"class_5","class_level":5},
          "subject":{"subject_id":"mathematics","source_subject_label":"Maths","component_id":"maths","component_label":"Maths"},
          "artifact":{"artifact_type":"$type","source_file_name":"test.json","source_relative_path":"test.json","source_format":"json"},
          "source_integrity":{"source_file_sha256":"${"a".repeat(64)}","source_semantic_sha256":"${"b".repeat(64)}","source_byte_length":10,"source_encoding":"utf-8","source_field_count":2,"field_inventory":["$.chapters"]},
          "academic_index":{"chapter_candidates":[],"chapter_candidate_count":0,"normalization_status":"test"},
          "source_data":{"chapters":[{"chapter_number":1,"chapter_title":"Test Chapter","special_unknown_field":{"keep":"me"}}]}
        }
        """.trimIndent()
        return GurukulJson.envelope(raw)
    }

    @Test fun allArtifactFamiliesHaveAdapters() {
        val types = listOf("overview","notes","mindmaps","flashcards","quiz",
            "question_papers","foundational","master","media_directory","media_manifest","video_links")
        types.forEach { type ->
            assertEquals(type, GurukulAdapterRegistry.adapterFor(type).artifactType)
        }
    }

    @Test fun unknownSourceFieldsRemainAvailable() {
        val source = envelope("notes")
        val adapted = GurukulAdapterRegistry.adapt(source)
        assertEquals("me", adapted.originalSource.jsonObject["chapters"]!!
            .jsonArray[0].jsonObject["special_unknown_field"]!!.jsonObject["keep"]!!.jsonPrimitive.content)
        assertTrue(adapted.blocks.isNotEmpty())
    }

    @Test fun unknownArtifactFallsBackWithoutDroppingPayload() {
        val source = envelope("future_artifact_type")
        val adapted = GurukulAdapterRegistry.adapt(source)
        assertEquals("other", adapted.artifactType)
        assertEquals(source.sourceData, adapted.originalSource)
    }
}
