/**
 * Digital Govind — Prompt Engineering Handbook
 * Complete Starter Toolkit Content (Extracted from Official Appendices A–D, Pages 73–79)
 */

export interface CheatSheetItem {
  key: string;
  question: string;
}

export interface PromptTemplateItem {
  id: string;
  code: string;
  title: string;
  category: string;
  pageNumber: number;
  summary: string;
  template: string;
}

export interface GlossaryTermItem {
  term: string;
  definition: string;
  category: 'Core' | 'Techniques' | 'Engineering' | 'Safety';
  pageNumber: number;
}

export interface ToolkitActivityTask {
  id: string;
  title: string;
  description: string;
  relatedPart?: number;
  relatedPage?: number;
}

export interface LearningPlanWeek {
  weekNumber: 1 | 2 | 3 | 4;
  title: string;
  handbookTitle: string;
  handbookReading: string;
  recommendedPages: { label: string; page: number }[];
  dailyCommitment: string;
  objectives: string[];
  deliverable: string;
  tasks: ToolkitActivityTask[];
}

export const PROMPT_CHEAT_SHEET = {
  title: 'One-Page Prompt Cheat Sheet',
  subtitle: 'Appendix A · Page 73 of the Handbook',
  intro:
    'Run down this list before you send an important prompt. Not every row applies every time, but skipping a row should be a decision, not an accident.',
  checklist: [
    { key: 'Goal', question: 'What exactly do I want, and for whom?' },
    { key: 'Context', question: 'What background would a new colleague need?' },
    { key: 'Task', question: 'One clear verb and one clear deliverable.' },
    { key: 'Format', question: 'List, table, JSON, email? How long?' },
    { key: 'Tone', question: 'Formal, friendly, direct? Any sample to match?' },
    { key: 'Constraints', question: 'Limits, must-includes, off-limits topics.' },
    { key: 'Examples', question: 'Add 3 to 5 varied examples only if needed.' },
    { key: 'Success', question: 'How will I know the answer is right?' },
    { key: 'Safety', question: 'Is any data private? Is any input untrusted?' },
    { key: 'Test', question: 'Does it work on more than one example?' },
  ] as CheatSheetItem[],
  fiveRules: [
    'Say exactly what you want, for whom, in what shape.',
    'Supply the background the model cannot guess.',
    'Show examples when words are not enough.',
    'Test on several inputs, not one.',
    'Verify facts and protect private data.',
  ],
};

export const PROMPT_TEMPLATES: PromptTemplateItem[] = [
  {
    id: 'b1',
    code: 'B1',
    title: 'Universal Starter',
    category: 'General Purpose',
    pageNumber: 74,
    summary:
      'Copy this skeleton for almost any everyday task. Save the versions that work well for you to build your personal prompt library.',
    template: `Task: [what you want done]
Context: [background the model could not guess]
Audience: [who will read or use this]
Format: [list / table / paragraphs / JSON], about [length]
Tone: [adjectives]
Success means: [2 to 3 checks]
If anything is unclear, ask me before answering.`,
  },
  {
    id: 'b2',
    code: 'B2',
    title: "Explain Like I'm a Beginner",
    category: 'Learning',
    pageNumber: 74,
    summary:
      'Turn dense or unfamiliar concepts into plain-English explanations anchored with an everyday analogy and self-check questions.',
    template: `Explain [topic] to a complete beginner. Use one everyday analogy, define any technical term the first time it appears, and finish with three questions to test my understanding. Keep it under [number] words.`,
  },
  {
    id: 'b3',
    code: 'B3',
    title: 'Summarize With Evidence',
    category: 'Reading & Research',
    pageNumber: 74,
    summary:
      'Prevent hallucinated summaries by forcing exact quotes from the source text after every bullet point.',
    template: `Summarize the text below in [number] bullets for [audience]. After each bullet, quote the exact words from the text that support it. If something is not stated, do not infer it.

<text>
[paste]
</text>`,
  },
  {
    id: 'b4',
    code: 'B4',
    title: 'Rewrite and Improve',
    category: 'Writing & Editing',
    pageNumber: 75,
    summary:
      'Tighten tone, clarity, and length while strictly preserving factual accuracy and tracking edits.',
    template: `Rewrite the text below for [audience] in a [tone] tone. Keep all facts and names. Reduce length by about [percent]. Then list the changes you made.

<text>
[paste]
</text>`,
  },
  {
    id: 'b5',
    code: 'B5',
    title: 'Decision Helper',
    category: 'Strategy',
    pageNumber: 75,
    summary:
      'Compare two competing options systematically against your real constraints and uncover hidden assumptions.',
    template: `I must decide between [option A] and [option B]. My criteria: [list]. Constraints: [list]. Compare the options in a table, list the three assumptions most likely to be wrong, and give a recommendation with the reasoning.`,
  },
  {
    id: 'b6',
    code: 'B6',
    title: 'Extract to JSON',
    category: 'Structured Data',
    pageNumber: 75,
    summary:
      'Pull clean fields out of messy notes or emails into valid JSON using null for any missing values.',
    template: `Extract the following fields from the text and return only valid JSON: [field names and types]. Use null for missing values. Do not guess.

<text>
[paste]
</text>`,
  },
  {
    id: 'b7',
    code: 'B7',
    title: 'Critique My Work',
    category: 'Evaluation',
    pageNumber: 76,
    summary:
      'Score a draft on explicit criteria before shipping so weaknesses stand out immediately.',
    template: `Review the draft below against these criteria: [criteria]. For each, give a score from 1 to 5 and one sentence of reasoning. Then list the three most valuable improvements.

<draft>
[paste]
</draft>`,
  },
  {
    id: 'b8',
    code: 'B8',
    title: 'Interview Me First',
    category: 'Planning',
    pageNumber: 76,
    summary:
      'Let the model gather missing context one question at a time instead of guessing your requirements.',
    template: `I want to [goal]. Before you start, ask me up to [number] questions, one at a time, that you need answered. When you have enough, produce the result.`,
  },
  {
    id: 'b9',
    code: 'B9',
    title: 'Study Plan',
    category: 'Learning',
    pageNumber: 76,
    summary:
      'Generate a realistic week-by-week learning roadmap sized to your actual weekly hours and skill level.',
    template: `Create a [number]-week plan to learn [skill] for someone with [level] and [hours] hours per week. Include weekly goals, one small project per week and a way to check progress.`,
  },
  {
    id: 'b10',
    code: 'B10',
    title: 'Debug My Prompt',
    category: 'Iteration',
    pageNumber: 76,
    summary:
      'Diagnose why a prompt drifted and get a targeted revision without losing your original intent.',
    template: `Here is my prompt and the output I got. Explain which parts could have caused the problem and propose a revised prompt that keeps the same goal.

Prompt: [prompt]
Output: [output]
What I wanted instead: [description]`,
  },
];

export const GLOSSARY_TERMS: GlossaryTermItem[] = [
  {
    term: 'Agent',
    definition: 'An AI system that takes multiple steps toward a goal, often using tools.',
    category: 'Engineering',
    pageNumber: 77,
  },
  {
    term: 'Chain-of-thought',
    definition: 'Prompting the model to reason through intermediate steps before answering.',
    category: 'Techniques',
    pageNumber: 77,
  },
  {
    term: 'Completion',
    definition: 'The text a model generates in response to a prompt.',
    category: 'Core',
    pageNumber: 77,
  },
  {
    term: 'Context engineering',
    definition: "Managing everything in the model's window: instructions, documents, tools, memory and history.",
    category: 'Engineering',
    pageNumber: 77,
  },
  {
    term: 'Context window',
    definition: 'The maximum amount of text a model can consider at once.',
    category: 'Core',
    pageNumber: 77,
  },
  {
    term: 'Evaluation (eval)',
    definition: 'A systematic test of how well a prompt or system performs on a set of examples.',
    category: 'Engineering',
    pageNumber: 77,
  },
  {
    term: 'Few-shot',
    definition: 'Including a small number of examples in a prompt.',
    category: 'Techniques',
    pageNumber: 77,
  },
  {
    term: 'Function calling',
    definition: 'A feature letting a model request that a defined tool or function be run.',
    category: 'Engineering',
    pageNumber: 77,
  },
  {
    term: 'Guardrails',
    definition: 'Checks and limits that keep an AI system within safe, intended behaviour.',
    category: 'Safety',
    pageNumber: 77,
  },
  {
    term: 'Hallucination',
    definition: 'A confident but false or invented statement produced by a model.',
    category: 'Safety',
    pageNumber: 77,
  },
  {
    term: 'Jailbreak',
    definition: 'An attempt to push a model into ignoring its safety rules.',
    category: 'Safety',
    pageNumber: 77,
  },
  {
    term: 'JSON',
    definition: 'A text format for structured data, widely used for model output.',
    category: 'Engineering',
    pageNumber: 77,
  },
  {
    term: 'LLM',
    definition: 'Large language model: a model trained on large amounts of text to generate language.',
    category: 'Core',
    pageNumber: 77,
  },
  {
    term: 'LLM-as-judge',
    definition: 'Using one model to grade the output of another against a rubric.',
    category: 'Engineering',
    pageNumber: 77,
  },
  {
    term: 'Meta-prompting',
    definition: 'Using a model to write or improve prompts.',
    category: 'Techniques',
    pageNumber: 77,
  },
  {
    term: 'Multimodal',
    definition: 'Able to work with more than text, such as images, audio or video.',
    category: 'Core',
    pageNumber: 77,
  },
  {
    term: 'Prompt',
    definition: 'The input given to a model to elicit a response.',
    category: 'Core',
    pageNumber: 77,
  },
  {
    term: 'Prompt chaining',
    definition: 'Feeding the output of one prompt into the next.',
    category: 'Techniques',
    pageNumber: 77,
  },
  {
    term: 'Prompt injection',
    definition: 'An attack where untrusted content contains instructions that try to hijack the model.',
    category: 'Safety',
    pageNumber: 77,
  },
  {
    term: 'RAG',
    definition: 'Retrieval-augmented generation: fetching relevant documents and giving them to the model to answer from.',
    category: 'Engineering',
    pageNumber: 77,
  },
  {
    term: 'ReAct',
    definition: 'A pattern alternating reasoning, actions and observations.',
    category: 'Techniques',
    pageNumber: 77,
  },
  {
    term: 'Reasoning model',
    definition: 'A model trained to reason internally before giving a final answer.',
    category: 'Core',
    pageNumber: 78,
  },
  {
    term: 'Role prompting',
    definition: 'Assigning the model a role or persona to shape its answers.',
    category: 'Techniques',
    pageNumber: 78,
  },
  {
    term: 'Schema',
    definition: 'A formal description of the structure and types of data.',
    category: 'Engineering',
    pageNumber: 78,
  },
  {
    term: 'Self-consistency',
    definition: 'Sampling several answers and choosing the most common.',
    category: 'Techniques',
    pageNumber: 78,
  },
  {
    term: 'System prompt',
    definition: "Standing instructions that set a model's behaviour for a whole conversation.",
    category: 'Core',
    pageNumber: 78,
  },
  {
    term: 'Temperature',
    definition: "A setting controlling randomness in the model's word choices.",
    category: 'Core',
    pageNumber: 78,
  },
  {
    term: 'Token',
    definition: 'A chunk of text, the unit models read and generate.',
    category: 'Core',
    pageNumber: 78,
  },
  {
    term: 'Tree of Thoughts',
    definition: 'Exploring multiple reasoning paths and evaluating them.',
    category: 'Techniques',
    pageNumber: 78,
  },
  {
    term: 'Zero-shot',
    definition: 'Giving an instruction with no examples.',
    category: 'Techniques',
    pageNumber: 78,
  },
];

export const FOUR_WEEK_PLAN: LearningPlanWeek[] = [
  {
    weekNumber: 1,
    title: 'Learning the Fundamentals of Prompting',
    handbookTitle: 'Appendix D · Week 1: Foundations',
    handbookReading: 'Parts 1 & 2 (Topics 1–24)',
    recommendedPages: [
      { label: 'Part 1: Foundations (p. 11)', page: 11 },
      { label: 'Part 2: Prompt Anatomy (p. 19)', page: 19 },
      { label: 'Appendix A Cheat Sheet (p. 73)', page: 73 },
    ],
    dailyCommitment: '20–30 min / day',
    objectives: [
      'Understand how language models interpret prompts, tokens, temperature, and context windows.',
      'Spot why vague prompts fail and apply the 4-question checklist (goal, audience, format, failure modes).',
      'Replace ad-hoc requests with clear instructions, constraints, and delimiters.',
    ],
    deliverable: 'Daily before-and-after prompt rewrites using the Universal Starter template (B1).',
    tasks: [
      {
        id: 'w1-t1',
        title: 'Read Part 1: Foundations (Topics 1–10)',
        description:
          'Learn what language models do, why hallucinations happen, and inspect the Topic 10 before-and-after example.',
        relatedPart: 1,
        relatedPage: 11,
      },
      {
        id: 'w1-t2',
        title: 'Read Part 2: Anatomy of a Great Prompt (Topics 11–24)',
        description:
          'Study core prompt elements: goal, context, audience, format, tone, constraints, and ordering.',
        relatedPart: 2,
        relatedPage: 19,
      },
      {
        id: 'w1-t3',
        title: 'Rewrite 3 everyday requests using Template B1 (Universal Starter)',
        description:
          'Pick an email, a study question, and a short plan; rewrite each with Task, Context, Audience, Format, Tone, and Success checks.',
        relatedPage: 74,
      },
      {
        id: 'w1-t4',
        title: 'Compare old vague outputs vs. structured outputs',
        description:
          'Run both your original short prompt and your Universal Starter rewrite side by side and note what improved.',
        relatedPage: 17,
      },
    ],
  },
  {
    weekNumber: 2,
    title: 'Understanding and Practicing Prompt Structures',
    handbookTitle: 'Appendix D · Week 2: Core Techniques',
    handbookReading: 'Part 2 XML/Delimiters & Part 3 (Topics 21–42)',
    recommendedPages: [
      { label: 'Topic 22: XML Tags (p. 26)', page: 26 },
      { label: 'Part 3: Core Techniques (p. 28)', page: 28 },
      { label: 'Templates B2–B4 (p. 74–75)', page: 74 },
    ],
    dailyCommitment: '20–30 min / day',
    objectives: [
      'Separate instructions, context, and untrusted input cleanly using delimiters and XML tags.',
      'Master zero-shot, one-shot, few-shot, role prompting, and task decomposition.',
      'Use iterative refinement and self-critique instead of guessing when outputs miss the mark.',
    ],
    deliverable: 'Two tested, reusable structured prompts saved from a real task you care about.',
    tasks: [
      {
        id: 'w2-t1',
        title: 'Practice XML tags & structural delimiters (Topics 21–24)',
        description:
          'Wrap instructions in <instructions> and pasted text in <document> or <text> tags on a multi-part prompt.',
        relatedPart: 2,
        relatedPage: 25,
      },
      {
        id: 'w2-t2',
        title: 'Read Part 3: Core Prompting Techniques (Topics 25–42)',
        description:
          'Review zero-shot, choosing strong few-shot examples, role prompting, and rubric-based evaluation.',
        relatedPart: 3,
        relatedPage: 28,
      },
      {
        id: 'w2-t3',
        title: 'Test zero-shot, few-shot, and role prompting on one real task',
        description:
          'Run all three approaches on the same real task (with 2–5 varied examples for few-shot) and compare consistency.',
        relatedPage: 29,
      },
      {
        id: 'w2-t4',
        title: 'Refine iteratively with Template B10 and save your 2 best prompts',
        description:
          'Use Debug My Prompt (B10) or Self-Critique (Topic 41) to polish your workflow and save the 2 best versions.',
        relatedPage: 76,
      },
    ],
  },
  {
    weekNumber: 3,
    title: 'Applying Advanced Prompting Techniques',
    handbookTitle: 'Appendix D · Week 3: Real Work & Advanced Workflows',
    handbookReading: 'Parts 4, 6 & 7 (Topics 43–54 & 63–86)',
    recommendedPages: [
      { label: 'Part 4: Reasoning & Agents (p. 39)', page: 39 },
      { label: 'Part 6: Different Models (p. 51)', page: 51 },
      { label: 'Part 7: Prompts for Real Work (p. 55)', page: 55 },
    ],
    dailyCommitment: '20–30 min / day',
    objectives: [
      'Apply chain-of-thought, ReAct, RAG, and reasoning-model best practices intentionally.',
      'Adapt prompts across OpenAI, Claude, Gemini, and open-weight models using outcome-first instructions.',
      'Build custom templates for high-leverage daily work and iterate through repeated real-world runs.',
    ],
    deliverable: 'Three work-specific templates used at least 3 times each and refined after each run.',
    tasks: [
      {
        id: 'w3-t1',
        title: 'Study reasoning, ReAct, RAG, and agent patterns (Part 4)',
        description:
          'Read Topics 43–54 to know when to trigger step-by-step reasoning and when reasoning models prefer concise outcome goals.',
        relatedPart: 4,
        relatedPage: 39,
      },
      {
        id: 'w3-t2',
        title: 'Read Part 6 & pick 3 real-work areas from Part 7',
        description:
          'Choose three areas relevant to you (e.g., writing, summarization, data analysis, coding, or decision support).',
        relatedPart: 7,
        relatedPage: 55,
      },
      {
        id: 'w3-t3',
        title: 'Build 3 custom templates tailored to your selected work areas',
        description:
          'Adapt Templates B3–B8 into domain-specific templates with explicit success criteria and output formatting.',
        relatedPage: 75,
      },
      {
        id: 'w3-t4',
        title: 'Use each template 3+ times and record an improvement each run',
        description:
          'Test your 3 templates on real tasks across different inputs and tighten ambiguous instructions after every run.',
        relatedPage: 79,
      },
    ],
  },
  {
    weekNumber: 4,
    title: 'Practical Projects and Revision',
    handbookTitle: 'Appendix D · Week 4: Reliability, Safety & Revision',
    handbookReading: 'Parts 5, 8 & 9 (Topics 55–62 & 87–100)',
    recommendedPages: [
      { label: 'Part 5: Structured Output (p. 46)', page: 46 },
      { label: 'Part 8: Evaluation & Context (p. 64)', page: 64 },
      { label: 'Part 9: Safety & Mistakes (p. 69)', page: 69 },
    ],
    dailyCommitment: '20–30 min / day',
    objectives: [
      'Enforce reliable structured JSON outputs and schema constraints for practical projects.',
      'Evaluate prompts systematically with a 10-example test set rather than single-input vibes.',
      'Audit workflows for prompt injection, sensitive data privacy, and the 12 common prompting mistakes.',
    ],
    deliverable: 'A 10-example eval set with measured improvement plus a complete safety & cheat-sheet revision.',
    tasks: [
      {
        id: 'w4-t1',
        title: 'Build a structured JSON project using Template B6 & Part 5',
        description:
          'Extract or classify real inputs into strict JSON keys with explicit types and null handling for missing fields.',
        relatedPart: 5,
        relatedPage: 47,
      },
      {
        id: 'w4-t2',
        title: 'Create a 10-example test set for your best template (Topics 91–94)',
        description:
          'Run your top template across 10 varied examples (including edge cases), score pass/fail, and make one measured improvement.',
        relatedPart: 8,
        relatedPage: 67,
      },
      {
        id: 'w4-t3',
        title: 'Audit safety, prompt injection & private data rules (Part 9)',
        description:
          'Review Topics 95–98 and list what sensitive personal or client data must never be pasted into an AI tool.',
        relatedPart: 9,
        relatedPage: 70,
      },
      {
        id: 'w4-t4',
        title: 'Complete final revision with Topic 99, Appendix A & Appendix C',
        description:
          'Review Twelve Common Prompting Mistakes (p. 72), run the 10-point Cheat Sheet (p. 73), and check Glossary definitions.',
        relatedPage: 72,
      },
    ],
  },
];

export const ALL_TOOLKIT_TASK_IDS: string[] = FOUR_WEEK_PLAN.flatMap((w) =>
  w.tasks.map((t) => t.id)
);
