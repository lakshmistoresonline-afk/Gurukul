# GURUKUL AI — AI TUTOR SECURITY & SAFETY REVIEW

---

## 1. Security & Privacy Safeguards

1. **Prompt Injection Prevention**:
   - Selected text is wrapped in strict delimiters (`<<< SELECTED TEXT >>>`) and treated as raw passive input to explain, never as executable instructions.
2. **Authenticated Grade & User Scoping**:
   - User conversations are scoped to the authenticated Firebase `user.uid` (`users/{uid}/conversations/`).
3. **No Key Expose**:
   - Zero private API keys exposed to client browsers.
4. **Child Safety Filter**:
   - Age-appropriate system prompt constraints enforcing encouraging, polite, and child-safe responses for Grade 5 learners.
