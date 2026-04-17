import request from '@/utils/request';

const COMPLETED_STATUSES = new Set([
  'completed',
  'complete',
  'done',
  'accepted',
  'success',
  'succeeded',
  'passed',
  'solved',
  'finish',
  'finished'
]);

function normalizeBoolean(rawValue) {
  if (rawValue === true || rawValue === 1 || rawValue === '1') return true;
  if (rawValue === false || rawValue === 0 || rawValue === '0') return false;

  const text = String(rawValue ?? '')
    .trim()
    .toLowerCase();
  if (['true', 'yes', 'y'].includes(text)) return true;
  if (['false', 'no', 'n'].includes(text)) return false;
  return null;
}

function normalizeCompletionStatus(rawStatus) {
  if (rawStatus === undefined || rawStatus === null || rawStatus === '') return '';

  if (typeof rawStatus === 'object') {
    return normalizeCompletionStatus(
      rawStatus.status ??
      rawStatus.completion_status ??
      rawStatus.state ??
      rawStatus.code ??
      rawStatus.name ??
      rawStatus.description ??
      rawStatus.label ??
      rawStatus.value ??
      rawStatus.id
    );
  }

  return String(rawStatus)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
}

function isCompletedCompletion(record) {
  const status = normalizeCompletionStatus(
    record?.status ??
    record?.completion_status ??
    record?.state ??
    record?.progress_status ??
    record?.result_status
  );

  if (status) return COMPLETED_STATUSES.has(status);

  const explicitDone = normalizeBoolean(
    record?.is_completed ??
    record?.completed ??
    record?.is_done ??
    record?.done
  );
  if (explicitDone !== null) return explicitDone;

  // If completion status is absent, avoid false positives.
  return false;
}

function extractCompletionProblemId(completion) {
  const value =
    completion?.problem_id ??
    completion?.problemId ??
    completion?.question_id ??
    completion?.questionId ??
    completion?.leetcode_problem_id ??
    completion?.leetcodeProblemId ??
    completion?.problem?.problem_id ??
    completion?.problem?.problemId ??
    completion?.problem?.id ??
    ((typeof completion?.problem === 'number' || typeof completion?.problem === 'string')
      ? completion.problem
      : undefined);

  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}

function extractCompletions(response) {
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.data?.completions)) return response.data.completions;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.completions)) return response.completions;
  if (Array.isArray(response?.data?.data?.results)) return response.data.data.results;
  if (Array.isArray(response?.data?.data?.completions)) return response.data.data.completions;
  return [];
}

export async function getUserCompletedProblemIds() {
  const { ids } = await getUserCompletedProblemIdsWithMeta();
  return ids;
}

export async function getUserCompletedProblemIdsWithMeta() {
  try {
    const token = localStorage.getItem('token') ||
                 localStorage.getItem('access_token') ||
                 localStorage.getItem('jwt_token');

    if (!token) {
      console.warn('No token found, user not logged in.');
      return { ids: new Set(), loaded: false };
    }

    const response = await request.get('/api/user/completions/');
    const completions = extractCompletions(response);
    const completedProblems = new Set();

    completions.forEach((completion) => {
      if (!completion || !isCompletedCompletion(completion)) return;

      const problemId = extractCompletionProblemId(completion);
      if (!Number.isFinite(problemId)) return;

      completedProblems.add(problemId);
    });

    return { ids: completedProblems, loaded: true };
  } catch (error) {
    console.warn('Failed to fetch user completed problem ids, use empty set.', error);
    return { ids: new Set(), loaded: false };
  }
}
