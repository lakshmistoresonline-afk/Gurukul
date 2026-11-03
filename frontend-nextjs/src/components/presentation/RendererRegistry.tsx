import React from 'react';
import OverviewComponent from './OverviewComponent';
import NotesComponent from './NotesComponent';
import MasterComponent from './MasterComponent';
import FoundationalComponent from './FoundationalComponent';
import FlashcardsComponent from './FlashcardsComponent';
import MindmapComponent from './MindmapComponent';
import QuizComponent from './QuizComponent';
import QuestionPapersComponent from './QuestionPapersComponent';

import HindiNotesComponent from './HindiNotesComponent';
import MathsNotesComponent from './MathsNotesComponent';
import Class6MathsMasterComponent from './Class6/Class6MathsMasterComponent';
import Class6MathsMindmapComponent from './Class6/Class6MathsMindmapComponent';
import Class7UniversalNotesComponent from './Class7/Class7UniversalNotesComponent';
import Class7UniversalMasterComponent from './Class7/Class7UniversalMasterComponent';

export interface RendererResolutionParams {
  grade: string;
  subject: string;
  book: string;
  part: string;
  contentType: string;
  data: any;
}

export interface UnsupportedRendererProps {
  grade: string;
  subject: string;
  book: string;
  part: string;
  contentType: string;
}

export function UnsupportedRendererState({ grade, subject, book, part, contentType }: UnsupportedRendererProps) {
  console.warn(`[RendererRegistry] Unsupported renderer requested for exact identity -> Grade: ${grade}, Subject: ${subject}, Book: ${book}, Part: ${part}, ContentType: ${contentType}`);
  return (
    <div className="p-12 text-center bg-rose-50 border border-rose-200 rounded-3xl space-y-3 shadow-sm">
      <h3 className="text-lg font-black text-rose-900">Unsupported Renderer State</h3>
      <p className="text-xs text-rose-700 font-mono">
        No exact renderer registered for identity: {grade}:{subject}:{book}:{part}:{contentType}
      </p>
    </div>
  );
}

class RendererRegistry {
  private static registry: Map<string, React.ComponentType<any>> = new Map();

  static register(key: string, component: React.ComponentType<any>) {
    this.registry.set(key.toLowerCase(), component);
  }

  static get(key: string): React.ComponentType<any> | undefined {
    return this.registry.get(key.toLowerCase());
  }

  static resolve(params: RendererResolutionParams): React.ReactNode {
    const grade = (params.grade || '').trim().toLowerCase();
    let subject = (params.subject || '').trim().toLowerCase();
    let book = (params.book || '').trim().toLowerCase();
    const part = (params.part || '').trim().toLowerCase();
    const ct = (params.contentType || '').trim().toLowerCase();

    // Subject Normalization Alias Mapping
    if (subject === 'maths') subject = 'mathematics';
    if (subject === 'social') subject = 'social_science';
    if (book === 'maths') book = 'mathematics';
    if (book === 'social') book = 'social_science';

    // Exact key formation: grade:subject:book:part:contentType
    const exactKey = `${grade}:${subject}:${book}:${part}:${ct}`;

    let Component = this.get(exactKey);

    // Universal Content Type Fallback
    if (!Component) {
      if (ct === 'overview') Component = OverviewComponent;
      else if (ct === 'notes') {
        if (subject === 'hindi') Component = HindiNotesComponent;
        else if (subject === 'mathematics') Component = MathsNotesComponent;
        else if (grade === '7') Component = Class7UniversalNotesComponent;
        else Component = NotesComponent;
      }
      else if (ct === 'master') {
        if (grade === '7') Component = Class7UniversalMasterComponent;
        else if (grade === '6' && subject === 'mathematics') Component = Class6MathsMasterComponent;
        else Component = MasterComponent;
      }
      else if (ct === 'foundational') Component = FoundationalComponent;
      else if (ct === 'flashcards') Component = FlashcardsComponent;
      else if (ct === 'mindmaps') {
        if (grade === '6' && subject === 'mathematics') Component = Class6MathsMindmapComponent;
        else Component = MindmapComponent;
      }
      else if (ct === 'quiz') Component = QuizComponent;
      else if (ct === 'question_papers') Component = QuestionPapersComponent;
    }

    if (!Component) {
      return (
        <UnsupportedRendererState
          grade={params.grade}
          subject={params.subject}
          book={params.book}
          part={params.part}
          contentType={params.contentType}
        />
      );
    }

    // UI-only adapter boundary matching specific component prop contracts
    const extraProps: any = {};
    if (ct === 'quiz') extraProps.quiz = params.data;
    if (ct === 'flashcards') extraProps.flashcards = params.data;
    if (ct === 'notes') extraProps.notes = params.data;
    if (ct === 'master') extraProps.master = params.data;
    if (ct === 'foundational') extraProps.foundational = params.data;
    if (ct === 'mindmaps') extraProps.mindmap = params.data;
    if (ct === 'question_papers') extraProps.questionPapers = params.data;

    return <Component data={params.data} subject={params.subject} {...extraProps} />;
  }

  static getIntrospection(): Array<{ key: string; componentName: string }> {
    const items: Array<{ key: string; componentName: string }> = [];
    this.registry.forEach((comp, key) => {
      items.push({ key, componentName: comp.displayName || comp.name || 'AnonymousComponent' });
    });
    return items;
  }
}

// ==========================================
// EXACT AUTHORITATIVE REGISTRATION MAPPINGS
// ==========================================

// Class 5 Registrations
RendererRegistry.register('5:english:english:main:overview', OverviewComponent);
RendererRegistry.register('5:english:english:main:notes', NotesComponent);
RendererRegistry.register('5:english:english:main:master', MasterComponent);
RendererRegistry.register('5:english:english:main:foundational', FoundationalComponent);
RendererRegistry.register('5:english:english:main:flashcards', FlashcardsComponent);
RendererRegistry.register('5:english:english:main:mindmaps', MindmapComponent);
RendererRegistry.register('5:english:english:main:quiz', QuizComponent);
RendererRegistry.register('5:english:english:main:question_papers', QuestionPapersComponent);

RendererRegistry.register('5:hindi:hindi:main:overview', OverviewComponent);
RendererRegistry.register('5:hindi:hindi:main:notes', HindiNotesComponent);
RendererRegistry.register('5:hindi:hindi:main:master', MasterComponent);
RendererRegistry.register('5:hindi:hindi:main:foundational', FoundationalComponent);
RendererRegistry.register('5:hindi:hindi:main:flashcards', FlashcardsComponent);
RendererRegistry.register('5:hindi:hindi:main:mindmaps', MindmapComponent);
RendererRegistry.register('5:hindi:hindi:main:quiz', QuizComponent);
RendererRegistry.register('5:hindi:hindi:main:question_papers', QuestionPapersComponent);

RendererRegistry.register('5:mathematics:mathematics:main:overview', OverviewComponent);
RendererRegistry.register('5:mathematics:mathematics:main:notes', MathsNotesComponent);
RendererRegistry.register('5:mathematics:mathematics:main:master', MasterComponent);
RendererRegistry.register('5:mathematics:mathematics:main:foundational', FoundationalComponent);
RendererRegistry.register('5:mathematics:mathematics:main:flashcards', FlashcardsComponent);
RendererRegistry.register('5:mathematics:mathematics:main:mindmaps', MindmapComponent);
RendererRegistry.register('5:mathematics:mathematics:main:quiz', QuizComponent);
RendererRegistry.register('5:mathematics:mathematics:main:question_papers', QuestionPapersComponent);

RendererRegistry.register('5:science:science:main:overview', OverviewComponent);
RendererRegistry.register('5:science:science:main:notes', NotesComponent);
RendererRegistry.register('5:science:science:main:master', MasterComponent);
RendererRegistry.register('5:science:science:main:foundational', FoundationalComponent);
RendererRegistry.register('5:science:science:main:flashcards', FlashcardsComponent);
RendererRegistry.register('5:science:science:main:mindmaps', MindmapComponent);
RendererRegistry.register('5:science:science:main:quiz', QuizComponent);
RendererRegistry.register('5:science:science:main:question_papers', QuestionPapersComponent);

// Class 6 Registrations
RendererRegistry.register('6:english:english:main:overview', OverviewComponent);
RendererRegistry.register('6:english:english:main:notes', NotesComponent);
RendererRegistry.register('6:english:english:main:master', MasterComponent);
RendererRegistry.register('6:english:english:main:foundational', FoundationalComponent);
RendererRegistry.register('6:english:english:main:flashcards', FlashcardsComponent);
RendererRegistry.register('6:english:english:main:mindmaps', MindmapComponent);
RendererRegistry.register('6:english:english:main:quiz', QuizComponent);
RendererRegistry.register('6:english:english:main:question_papers', QuestionPapersComponent);

RendererRegistry.register('6:hindi:hindi:main:overview', OverviewComponent);
RendererRegistry.register('6:hindi:hindi:main:notes', HindiNotesComponent);
RendererRegistry.register('6:hindi:hindi:main:master', MasterComponent);
RendererRegistry.register('6:hindi:hindi:main:foundational', FoundationalComponent);
RendererRegistry.register('6:hindi:hindi:main:flashcards', FlashcardsComponent);
RendererRegistry.register('6:hindi:hindi:main:mindmaps', MindmapComponent);
RendererRegistry.register('6:hindi:hindi:main:quiz', QuizComponent);
RendererRegistry.register('6:hindi:hindi:main:question_papers', QuestionPapersComponent);

RendererRegistry.register('6:mathematics:mathematics:main:overview', OverviewComponent);
RendererRegistry.register('6:mathematics:mathematics:main:notes', MathsNotesComponent);
RendererRegistry.register('6:mathematics:mathematics:main:master', Class6MathsMasterComponent);
RendererRegistry.register('6:mathematics:mathematics:main:foundational', FoundationalComponent);
RendererRegistry.register('6:mathematics:mathematics:main:flashcards', FlashcardsComponent);
RendererRegistry.register('6:mathematics:mathematics:main:mindmaps', Class6MathsMindmapComponent);
RendererRegistry.register('6:mathematics:mathematics:main:quiz', QuizComponent);
RendererRegistry.register('6:mathematics:mathematics:main:question_papers', QuestionPapersComponent);

RendererRegistry.register('6:science:science:main:overview', OverviewComponent);
RendererRegistry.register('6:science:science:main:notes', NotesComponent);
RendererRegistry.register('6:science:science:main:master', MasterComponent);
RendererRegistry.register('6:science:science:main:foundational', FoundationalComponent);
RendererRegistry.register('6:science:science:main:flashcards', FlashcardsComponent);
RendererRegistry.register('6:science:science:main:mindmaps', MindmapComponent);
RendererRegistry.register('6:science:science:main:quiz', QuizComponent);
RendererRegistry.register('6:science:science:main:question_papers', QuestionPapersComponent);

RendererRegistry.register('6:social_science:social_science:main:overview', OverviewComponent);
RendererRegistry.register('6:social_science:social_science:main:notes', NotesComponent);
RendererRegistry.register('6:social_science:social_science:main:master', MasterComponent);
RendererRegistry.register('6:social_science:social_science:main:foundational', FoundationalComponent);
RendererRegistry.register('6:social_science:social_science:main:flashcards', FlashcardsComponent);
RendererRegistry.register('6:social_science:social_science:main:mindmaps', MindmapComponent);
RendererRegistry.register('6:social_science:social_science:main:quiz', QuizComponent);
RendererRegistry.register('6:social_science:social_science:main:question_papers', QuestionPapersComponent);

// Class 7 Registrations
RendererRegistry.register('7:english:english:main:overview', OverviewComponent);
RendererRegistry.register('7:english:english:main:notes', Class7UniversalNotesComponent);
RendererRegistry.register('7:english:english:main:master', Class7UniversalMasterComponent);
RendererRegistry.register('7:english:english:main:foundational', FoundationalComponent);
RendererRegistry.register('7:english:english:main:flashcards', FlashcardsComponent);
RendererRegistry.register('7:english:english:main:mindmaps', MindmapComponent);
RendererRegistry.register('7:english:english:main:quiz', QuizComponent);
RendererRegistry.register('7:english:english:main:question_papers', QuestionPapersComponent);

RendererRegistry.register('7:hindi:hindi:main:overview', OverviewComponent);
RendererRegistry.register('7:hindi:hindi:main:notes', HindiNotesComponent);
RendererRegistry.register('7:hindi:hindi:main:master', Class7UniversalMasterComponent);
RendererRegistry.register('7:hindi:hindi:main:foundational', FoundationalComponent);
RendererRegistry.register('7:hindi:hindi:main:flashcards', FlashcardsComponent);
RendererRegistry.register('7:hindi:hindi:main:mindmaps', MindmapComponent);
RendererRegistry.register('7:hindi:hindi:main:quiz', QuizComponent);
RendererRegistry.register('7:hindi:hindi:main:question_papers', QuestionPapersComponent);

RendererRegistry.register('7:science:science:main:overview', OverviewComponent);
RendererRegistry.register('7:science:science:main:notes', Class7UniversalNotesComponent);
RendererRegistry.register('7:science:science:main:master', Class7UniversalMasterComponent);
RendererRegistry.register('7:science:science:main:foundational', FoundationalComponent);
RendererRegistry.register('7:science:science:main:flashcards', FlashcardsComponent);
RendererRegistry.register('7:science:science:main:mindmaps', MindmapComponent);
RendererRegistry.register('7:science:science:main:quiz', QuizComponent);
RendererRegistry.register('7:science:science:main:question_papers', QuestionPapersComponent);

RendererRegistry.register('7:mathematics:maths_i:part1:overview', OverviewComponent);
RendererRegistry.register('7:mathematics:maths_i:part1:notes', Class7UniversalNotesComponent);
RendererRegistry.register('7:mathematics:maths_i:part1:master', Class7UniversalMasterComponent);
RendererRegistry.register('7:mathematics:maths_i:part1:foundational', FoundationalComponent);
RendererRegistry.register('7:mathematics:maths_i:part1:flashcards', FlashcardsComponent);
RendererRegistry.register('7:mathematics:maths_i:part1:mindmaps', MindmapComponent);
RendererRegistry.register('7:mathematics:maths_i:part1:quiz', QuizComponent);
RendererRegistry.register('7:mathematics:maths_i:part1:question_papers', QuestionPapersComponent);

RendererRegistry.register('7:mathematics:maths_ii:part2:overview', OverviewComponent);
RendererRegistry.register('7:mathematics:maths_ii:part2:notes', Class7UniversalNotesComponent);
RendererRegistry.register('7:mathematics:maths_ii:part2:master', Class7UniversalMasterComponent);
RendererRegistry.register('7:mathematics:maths_ii:part2:foundational', FoundationalComponent);
RendererRegistry.register('7:mathematics:maths_ii:part2:flashcards', FlashcardsComponent);
RendererRegistry.register('7:mathematics:maths_ii:part2:mindmaps', MindmapComponent);
RendererRegistry.register('7:mathematics:maths_ii:part2:quiz', QuizComponent);
RendererRegistry.register('7:mathematics:maths_ii:part2:question_papers', QuestionPapersComponent);

RendererRegistry.register('7:social_science:social_i:part1:overview', OverviewComponent);
RendererRegistry.register('7:social_science:social_i:part1:notes', Class7UniversalNotesComponent);
RendererRegistry.register('7:social_science:social_i:part1:master', Class7UniversalMasterComponent);
RendererRegistry.register('7:social_science:social_i:part1:foundational', FoundationalComponent);
RendererRegistry.register('7:social_science:social_i:part1:flashcards', FlashcardsComponent);
RendererRegistry.register('7:social_science:social_i:part1:mindmaps', MindmapComponent);
RendererRegistry.register('7:social_science:social_i:part1:quiz', QuizComponent);
RendererRegistry.register('7:social_science:social_i:part1:question_papers', QuestionPapersComponent);

RendererRegistry.register('7:social_science:social_ii:part2:overview', OverviewComponent);
RendererRegistry.register('7:social_science:social_ii:part2:notes', Class7UniversalNotesComponent);
RendererRegistry.register('7:social_science:social_ii:part2:master', Class7UniversalMasterComponent);
RendererRegistry.register('7:social_science:social_ii:part2:foundational', FoundationalComponent);
RendererRegistry.register('7:social_science:social_ii:part2:flashcards', FlashcardsComponent);
RendererRegistry.register('7:social_science:social_ii:part2:mindmaps', MindmapComponent);
RendererRegistry.register('7:social_science:social_ii:part2:quiz', QuizComponent);
RendererRegistry.register('7:social_science:social_ii:part2:question_papers', QuestionPapersComponent);

export default RendererRegistry;
