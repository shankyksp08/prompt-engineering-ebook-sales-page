/**
 * Pure, isomorphic Complete Starter Toolkit progress calculations and state helpers.
 * Safe to import in both browser React components and Node/Vercel API endpoints.
 */

import { FOUR_WEEK_PLAN, ALL_TOOLKIT_TASK_IDS, ToolkitActivityTask } from '../data/toolkitData.ts';

export interface LastActivityRecord {
  weekNumber: 1 | 2 | 3 | 4;
  taskId: string;
  taskTitle: string;
  completedAt: number;
}

export interface ToolkitProgressState {
  completedTaskIds: string[];
  completedWeeks: number[];
  lastCompletedActivity: LastActivityRecord | null;
  updatedAt: number;
}

export interface WeekProgressStats {
  weekNumber: 1 | 2 | 3 | 4;
  completedCount: number;
  totalCount: number;
  percentage: number;
  isCompleted: boolean;
}

export interface OverallToolkitStats {
  completedTasks: number;
  totalTasks: number;
  percentage: number;
  completedWeeksCount: number;
  totalWeeks: number;
}

export interface ResumeRecommendation {
  hasStarted: boolean;
  isAllComplete: boolean;
  lastCompletedActivity: LastActivityRecord | null;
  nextWeekNumber: 1 | 2 | 3 | 4;
  nextTask: ToolkitActivityTask | null;
  statusLabel: string;
}

const VALID_TASK_ID_SET = new Set(ALL_TOOLKIT_TASK_IDS);

function findTaskMeta(taskId: string): { weekNumber: 1 | 2 | 3 | 4; task: ToolkitActivityTask } | null {
  for (const week of FOUR_WEEK_PLAN) {
    const task = week.tasks.find((t) => t.id === taskId);
    if (task) {
      return { weekNumber: week.weekNumber, task };
    }
  }
  return null;
}

export function createEmptyToolkitProgress(): ToolkitProgressState {
  return {
    completedTaskIds: [],
    completedWeeks: [],
    lastCompletedActivity: null,
    updatedAt: 0,
  };
}

/**
 * Normalizes and validates untrusted progress objects from disk/network/localStorage.
 * Automatically reconciles completedWeeks with completedTaskIds when all tasks in a week are checked.
 */
export function sanitizeToolkitProgress(raw: unknown): ToolkitProgressState {
  if (!raw || typeof raw !== 'object') {
    return createEmptyToolkitProgress();
  }

  const record = raw as Record<string, unknown>;

  const rawTasks = Array.isArray(record.completedTaskIds) ? record.completedTaskIds : [];
  const taskSet = new Set<string>();
  for (const item of rawTasks) {
    if (typeof item === 'string' && VALID_TASK_ID_SET.has(item)) {
      taskSet.add(item);
    }
  }

  const rawWeeks = Array.isArray(record.completedWeeks) ? record.completedWeeks : [];
  const weekSet = new Set<number>();
  for (const w of rawWeeks) {
    if (typeof w === 'number' && Number.isInteger(w) && w >= 1 && w <= 4) {
      weekSet.add(w);
    }
  }

  // Reconcile: if a week was marked completed, ensure all its tasks are included OR if all tasks are checked, week is completed
  for (const week of FOUR_WEEK_PLAN) {
    const allChecked = week.tasks.every((t) => taskSet.has(t.id));
    if (allChecked) {
      weekSet.add(week.weekNumber);
    } else if (weekSet.has(week.weekNumber)) {
      // Explicit week sign-off ensures all tasks in that week are counted
      for (const t of week.tasks) {
        taskSet.add(t.id);
      }
    }
  }

  let lastCompletedActivity: LastActivityRecord | null = null;
  if (record.lastCompletedActivity && typeof record.lastCompletedActivity === 'object') {
    const act = record.lastCompletedActivity as Record<string, unknown>;
    if (typeof act.taskId === 'string') {
      const meta = findTaskMeta(act.taskId);
      if (meta && taskSet.has(act.taskId)) {
        lastCompletedActivity = {
          weekNumber: meta.weekNumber,
          taskId: meta.task.id,
          taskTitle: meta.task.title,
          completedAt: typeof act.completedAt === 'number' && Number.isFinite(act.completedAt)
            ? act.completedAt
            : Date.now(),
        };
      }
    }
  }

  const updatedAt =
    typeof record.updatedAt === 'number' && Number.isFinite(record.updatedAt) && record.updatedAt >= 0
      ? record.updatedAt
      : 0;

  return {
    completedTaskIds: ALL_TOOLKIT_TASK_IDS.filter((id) => taskSet.has(id)),
    completedWeeks: ([1, 2, 3, 4] as const).filter((w) => weekSet.has(w)),
    lastCompletedActivity,
    updatedAt,
  };
}

/**
 * Toggles a single checklist activity inside a week and updates weekly completion & lastCompletedActivity.
 */
export function toggleTaskInProgress(
  state: ToolkitProgressState,
  taskId: string,
  nowMs: number = Date.now()
): ToolkitProgressState {
  const meta = findTaskMeta(taskId);
  if (!meta) return state;

  const taskSet = new Set(state.completedTaskIds);
  const weekSet = new Set(state.completedWeeks);
  let lastCompletedActivity = state.lastCompletedActivity;

  if (taskSet.has(taskId)) {
    taskSet.delete(taskId);
    weekSet.delete(meta.weekNumber);
    if (lastCompletedActivity?.taskId === taskId) {
      // Fall back to the most recent remaining completed task if any
      const remaining = ALL_TOOLKIT_TASK_IDS.filter((id) => taskSet.has(id));
      if (remaining.length > 0) {
        const lastId = remaining[remaining.length - 1];
        const fallbackMeta = findTaskMeta(lastId);
        lastCompletedActivity = fallbackMeta
          ? {
              weekNumber: fallbackMeta.weekNumber,
              taskId: fallbackMeta.task.id,
              taskTitle: fallbackMeta.task.title,
              completedAt: nowMs,
            }
          : null;
      } else {
        lastCompletedActivity = null;
      }
    }
  } else {
    taskSet.add(taskId);
    lastCompletedActivity = {
      weekNumber: meta.weekNumber,
      taskId: meta.task.id,
      taskTitle: meta.task.title,
      completedAt: nowMs,
    };
    const weekPlan = FOUR_WEEK_PLAN.find((w) => w.weekNumber === meta.weekNumber)!;
    if (weekPlan.tasks.every((t) => taskSet.has(t.id))) {
      weekSet.add(meta.weekNumber);
    }
  }

  return {
    completedTaskIds: ALL_TOOLKIT_TASK_IDS.filter((id) => taskSet.has(id)),
    completedWeeks: ([1, 2, 3, 4] as const).filter((w) => weekSet.has(w)),
    lastCompletedActivity,
    updatedAt: nowMs,
  };
}

/**
 * Explicitly marks an entire week as completed (or unmarks it if already completed).
 */
export function toggleWeekCompletionInProgress(
  state: ToolkitProgressState,
  weekNumber: 1 | 2 | 3 | 4,
  nowMs: number = Date.now()
): ToolkitProgressState {
  const week = FOUR_WEEK_PLAN.find((w) => w.weekNumber === weekNumber);
  if (!week) return state;

  const taskSet = new Set(state.completedTaskIds);
  const weekSet = new Set(state.completedWeeks);
  const isCurrentlyComplete = weekSet.has(weekNumber) || week.tasks.every((t) => taskSet.has(t.id));

  let lastCompletedActivity = state.lastCompletedActivity;

  if (isCurrentlyComplete) {
    weekSet.delete(weekNumber);
    for (const t of week.tasks) {
      taskSet.delete(t.id);
    }
    if (lastCompletedActivity && lastCompletedActivity.weekNumber === weekNumber) {
      const remaining = ALL_TOOLKIT_TASK_IDS.filter((id) => taskSet.has(id));
      if (remaining.length > 0) {
        const lastId = remaining[remaining.length - 1];
        const fallbackMeta = findTaskMeta(lastId);
        lastCompletedActivity = fallbackMeta
          ? {
              weekNumber: fallbackMeta.weekNumber,
              taskId: fallbackMeta.task.id,
              taskTitle: fallbackMeta.task.title,
              completedAt: nowMs,
            }
          : null;
      } else {
        lastCompletedActivity = null;
      }
    }
  } else {
    weekSet.add(weekNumber);
    for (const t of week.tasks) {
      taskSet.add(t.id);
    }
    const finalTask = week.tasks[week.tasks.length - 1];
    lastCompletedActivity = {
      weekNumber,
      taskId: finalTask.id,
      taskTitle: finalTask.title,
      completedAt: nowMs,
    };
  }

  return {
    completedTaskIds: ALL_TOOLKIT_TASK_IDS.filter((id) => taskSet.has(id)),
    completedWeeks: ([1, 2, 3, 4] as const).filter((w) => weekSet.has(w)),
    lastCompletedActivity,
    updatedAt: nowMs,
  };
}

export function getWeekProgressStats(
  state: ToolkitProgressState,
  weekNumber: 1 | 2 | 3 | 4
): WeekProgressStats {
  const week = FOUR_WEEK_PLAN.find((w) => w.weekNumber === weekNumber);
  if (!week || week.tasks.length === 0) {
    return {
      weekNumber,
      completedCount: 0,
      totalCount: 0,
      percentage: 0,
      isCompleted: false,
    };
  }

  const taskSet = new Set(state.completedTaskIds);
  const completedCount = week.tasks.filter((t) => taskSet.has(t.id)).length;
  const totalCount = week.tasks.length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  const isCompleted = state.completedWeeks.includes(weekNumber) || completedCount === totalCount;

  return {
    weekNumber,
    completedCount,
    totalCount,
    percentage,
    isCompleted,
  };
}

export function getOverallToolkitStats(state: ToolkitProgressState): OverallToolkitStats {
  const taskSet = new Set(state.completedTaskIds);
  const completedTasks = ALL_TOOLKIT_TASK_IDS.filter((id) => taskSet.has(id)).length;
  const totalTasks = ALL_TOOLKIT_TASK_IDS.length;
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const completedWeeksCount = FOUR_WEEK_PLAN.filter((w) =>
    getWeekProgressStats(state, w.weekNumber).isCompleted
  ).length;

  return {
    completedTasks,
    totalTasks,
    percentage,
    completedWeeksCount,
    totalWeeks: FOUR_WEEK_PLAN.length,
  };
}

/**
 * Calculates the next recommended activity so customers can resume right where they left off.
 */
export function getResumeRecommendation(state: ToolkitProgressState): ResumeRecommendation {
  const taskSet = new Set(state.completedTaskIds);
  const hasStarted = taskSet.size > 0;
  const isAllComplete = taskSet.size === ALL_TOOLKIT_TASK_IDS.length;

  if (isAllComplete) {
    return {
      hasStarted: true,
      isAllComplete: true,
      lastCompletedActivity: state.lastCompletedActivity,
      nextWeekNumber: 4,
      nextTask: null,
      statusLabel: 'All 4 weeks completed! Review any template, cheat sheet, or week below.',
    };
  }

  // Prefer scanning forward after lastCompletedActivity to pick up immediately from their spot
  if (state.lastCompletedActivity) {
    const lastIdx = ALL_TOOLKIT_TASK_IDS.indexOf(state.lastCompletedActivity.taskId);
    if (lastIdx >= 0) {
      for (let i = lastIdx + 1; i < ALL_TOOLKIT_TASK_IDS.length; i++) {
        const candidateId = ALL_TOOLKIT_TASK_IDS[i];
        if (!taskSet.has(candidateId)) {
          const meta = findTaskMeta(candidateId);
          if (meta) {
            return {
              hasStarted,
              isAllComplete: false,
              lastCompletedActivity: state.lastCompletedActivity,
              nextWeekNumber: meta.weekNumber,
              nextTask: meta.task,
              statusLabel: `Continue Week ${meta.weekNumber}: ${meta.task.title}`,
            };
          }
        }
      }
    }
  }

  // Fallback: first incomplete activity across Weeks 1..4
  for (const week of FOUR_WEEK_PLAN) {
    for (const task of week.tasks) {
      if (!taskSet.has(task.id)) {
        return {
          hasStarted,
          isAllComplete: false,
          lastCompletedActivity: state.lastCompletedActivity,
          nextWeekNumber: week.weekNumber,
          nextTask: task,
          statusLabel: hasStarted
            ? `Continue Week ${week.weekNumber}: ${task.title}`
            : `Start Week 1: ${task.title}`,
        };
      }
    }
  }

  return {
    hasStarted,
    isAllComplete: false,
    lastCompletedActivity: state.lastCompletedActivity,
    nextWeekNumber: 1,
    nextTask: FOUR_WEEK_PLAN[0]?.tasks[0] || null,
    statusLabel: 'Start Week 1',
  };
}

/**
 * Resolves remote account state vs local cached state using updatedAt timestamp.
 */
export function selectAuthoritativeProgress(
  localRaw: unknown,
  remoteRaw: unknown
): ToolkitProgressState {
  const local = sanitizeToolkitProgress(localRaw);
  const remote = sanitizeToolkitProgress(remoteRaw);

  if (remote.updatedAt >= local.updatedAt && (remote.updatedAt > 0 || remote.completedTaskIds.length > 0)) {
    return remote;
  }
  if (local.updatedAt > remote.updatedAt) {
    return local;
  }
  return remote;
}
