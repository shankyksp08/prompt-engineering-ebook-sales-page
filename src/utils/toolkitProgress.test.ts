import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROMPT_CHEAT_SHEET,
  PROMPT_TEMPLATES,
  GLOSSARY_TERMS,
  FOUR_WEEK_PLAN,
  ALL_TOOLKIT_TASK_IDS,
} from '../data/toolkitData.ts';
import {
  createEmptyToolkitProgress,
  sanitizeToolkitProgress,
  toggleTaskInProgress,
  toggleWeekCompletionInProgress,
  getWeekProgressStats,
  getOverallToolkitStats,
  getResumeRecommendation,
  selectAuthoritativeProgress,
} from './toolkitProgress.ts';

test('toolkit dataset contains all 4 authentic handbook appendices', () => {
  assert.equal(PROMPT_CHEAT_SHEET.checklist.length, 10);
  assert.equal(PROMPT_CHEAT_SHEET.fiveRules.length, 5);
  assert.equal(PROMPT_TEMPLATES.length, 10);
  assert.equal(GLOSSARY_TERMS.length, 30);
  assert.equal(FOUR_WEEK_PLAN.length, 4);
  assert.equal(ALL_TOOLKIT_TASK_IDS.length, 16);
});

test('toggling tasks updates weekly completion percentage and overall progress', () => {
  let state = createEmptyToolkitProgress();
  assert.deepEqual(getOverallToolkitStats(state), {
    completedTasks: 0,
    totalTasks: 16,
    percentage: 0,
    completedWeeksCount: 0,
    totalWeeks: 4,
  });

  state = toggleTaskInProgress(state, 'w1-t1', 1000);
  state = toggleTaskInProgress(state, 'w1-t2', 2000);

  const w1 = getWeekProgressStats(state, 1);
  assert.equal(w1.completedCount, 2);
  assert.equal(w1.totalCount, 4);
  assert.equal(w1.percentage, 50);
  assert.equal(w1.isCompleted, false);
  assert.equal(state.lastCompletedActivity?.taskId, 'w1-t2');
  assert.equal(state.lastCompletedActivity?.weekNumber, 1);

  // Completing remaining 2 tasks marks Week 1 completed automatically
  state = toggleTaskInProgress(state, 'w1-t3', 3000);
  state = toggleTaskInProgress(state, 'w1-t4', 4000);

  const w1Complete = getWeekProgressStats(state, 1);
  assert.equal(w1Complete.percentage, 100);
  assert.equal(w1Complete.isCompleted, true);
  assert.deepEqual(state.completedWeeks, [1]);

  const overall = getOverallToolkitStats(state);
  assert.equal(overall.completedTasks, 4);
  assert.equal(overall.percentage, 25);
  assert.equal(overall.completedWeeksCount, 1);
});

test('toggleWeekCompletionInProgress marks an entire week complete and can toggle back', () => {
  let state = createEmptyToolkitProgress();
  state = toggleWeekCompletionInProgress(state, 2, 5000);

  const w2 = getWeekProgressStats(state, 2);
  assert.equal(w2.completedCount, 4);
  assert.equal(w2.percentage, 100);
  assert.equal(w2.isCompleted, true);
  assert.deepEqual(state.completedWeeks, [2]);
  assert.equal(state.lastCompletedActivity?.weekNumber, 2);

  // Unmarking Week 2 removes its tasks and week sign-off
  state = toggleWeekCompletionInProgress(state, 2, 6000);
  const w2Reset = getWeekProgressStats(state, 2);
  assert.equal(w2Reset.completedCount, 0);
  assert.equal(w2Reset.percentage, 0);
  assert.equal(w2Reset.isCompleted, false);
  assert.deepEqual(state.completedWeeks, []);
});

test('getResumeRecommendation points to next activity after lastCompletedActivity', () => {
  let state = createEmptyToolkitProgress();
  const initialResume = getResumeRecommendation(state);
  assert.equal(initialResume.hasStarted, false);
  assert.equal(initialResume.nextWeekNumber, 1);
  assert.equal(initialResume.nextTask?.id, 'w1-t1');

  state = toggleTaskInProgress(state, 'w1-t1', 100);
  state = toggleTaskInProgress(state, 'w1-t2', 200);
  const midWeek1 = getResumeRecommendation(state);
  assert.equal(midWeek1.hasStarted, true);
  assert.equal(midWeek1.lastCompletedActivity?.taskId, 'w1-t2');
  assert.equal(midWeek1.nextWeekNumber, 1);
  assert.equal(midWeek1.nextTask?.id, 'w1-t3');

  // Complete all tasks across Weeks 1-4
  for (const w of [1, 2, 3, 4] as const) {
    state = toggleWeekCompletionInProgress(state, w, 1000 + w);
  }
  const done = getResumeRecommendation(state);
  assert.equal(done.isAllComplete, true);
  assert.equal(done.nextTask, null);
});

test('sanitizeToolkitProgress drops invalid task IDs and reconciles completed weeks', () => {
  const cleaned = sanitizeToolkitProgress({
    completedTaskIds: ['w1-t1', 'invalid-task', 'w1-t1'],
    completedWeeks: [2, 99],
    lastCompletedActivity: { weekNumber: 1, taskId: 'w1-t1', taskTitle: 'Tampered', completedAt: 1234 },
    updatedAt: 5000,
  });

  // Week 2 was marked completed so all 4 Week 2 tasks are reconciled, plus w1-t1
  assert.equal(cleaned.completedTaskIds.includes('w1-t1'), true);
  assert.equal(cleaned.completedTaskIds.includes('invalid-task'), false);
  assert.equal(cleaned.completedTaskIds.includes('w2-t4'), true);
  assert.deepEqual(cleaned.completedWeeks, [2]);
  assert.equal(cleaned.lastCompletedActivity?.taskTitle, 'Read Part 1: Foundations (Topics 1–10)');
});

test('selectAuthoritativeProgress restores server state onto a fresh device with empty local state', () => {
  const emptyLocal = createEmptyToolkitProgress();
  const serverState = toggleTaskInProgress(createEmptyToolkitProgress(), 'w1-t1', 9000);

  const resolved = selectAuthoritativeProgress(emptyLocal, serverState);
  assert.deepEqual(resolved.completedTaskIds, ['w1-t1']);
  assert.equal(resolved.updatedAt, 9000);
});
