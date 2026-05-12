/**
 * Open edX API service — all calls go through the FutureLib backend (/api/v1/lms/*)
 * which proxies to Open edX and handles server-side OAuth2 + SSO provisioning.
 */
import api from './api';

// ─── LMS Config ──────────────────────────────────────────────────────────────

let _lmsConfigCache = null;

export async function getLmsConfig() {
  if (_lmsConfigCache) return _lmsConfigCache;
  const { data } = await api.get('/lms/config');
  _lmsConfigCache = data;
  return data;
}

// ─── Course Catalog (public) ─────────────────────────────────────────────────

export async function listCourses({ page = 1, pageSize = 20, search, org } = {}) {
  const params = { page, page_size: pageSize };
  if (search) params.search = search;
  if (org) params.org = org;
  const { data } = await api.get('/lms/courses', { params });
  return data;
}

export async function getCourse(courseId) {
  const { data } = await api.get(`/lms/courses/${encodeURIComponent(courseId)}`);
  return data;
}

// ─── Enrollment ──────────────────────────────────────────────────────────────

export async function enrollInCourse(courseId, mode = 'honor') {
  const { data } = await api.post('/lms/enroll', { course_id: courseId, mode });
  return data;
}

export async function getEnrollment(courseId) {
  const { data } = await api.get(`/lms/enrollment/${encodeURIComponent(courseId)}`);
  return data;
}

export async function getMyCourses() {
  const { data } = await api.get('/lms/my-courses');
  return Array.isArray(data) ? data : data.enrollments || [];
}

// ─── Progress & Completion ───────────────────────────────────────────────────

export async function getCourseProgress(courseId) {
  const { data } = await api.get(`/lms/progress/${encodeURIComponent(courseId)}`);
  return data;
}

export async function getCourseBlocks(courseId) {
  const { data } = await api.get(`/lms/blocks/${encodeURIComponent(courseId)}`);
  return data;
}

export async function getCompletionSummary(courseId) {
  const { data } = await api.get(`/lms/completion/${encodeURIComponent(courseId)}`);
  return data;
}

// ─── Grades ──────────────────────────────────────────────────────────────────

export async function getCourseGrades(courseId) {
  const { data } = await api.get(`/lms/grades/${encodeURIComponent(courseId)}`);
  return data;
}

// ─── Certificates ─────────────────────────────────────────────────────────────

export async function getMyCertificates() {
  const { data } = await api.get('/lms/certificates');
  return data.certificates || [];
}

// ─── SSO ─────────────────────────────────────────────────────────────────────

export async function getLmsSsoUrl(nextUrl = '/dashboard') {
  const { data } = await api.post('/lms/sso-url', { next_url: nextUrl });
  return data; // { sso_url, username }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a direct Open edX course URL for iframe embedding.
 * courseId is an Open edX course key, e.g. "course-v1:Org+Course+Run"
 */
export function buildCoursePlayerUrl(lmsBaseUrl, courseId) {
  return `${lmsBaseUrl}/courses/${encodeURIComponent(courseId)}/courseware`;
}

/**
 * Extract a human-readable progress percent from Open edX completion data.
 */
export function extractProgressPercent(completionData) {
  if (!completionData) return 0;
  const { completion_summary } = completionData;
  if (!completion_summary) return 0;
  const { complete_count, incomplete_count, locked_count } = completion_summary;
  const total = (complete_count || 0) + (incomplete_count || 0) + (locked_count || 0);
  if (total === 0) return 0;
  return Math.round(((complete_count || 0) / total) * 100);
}

/**
 * Normalise an Open edX course object into the shape FutureLib components expect.
 * This lets us swap data sources without touching every component.
 */
export function normaliseCourse(raw) {
  if (!raw) return null;
  return {
    id: raw.id || raw.course_id || '',
    title: raw.name || raw.display_name || raw.title || '',
    short_description: raw.short_description || raw.overview || '',
    description: raw.description || raw.overview || '',
    thumbnail_url: raw.media?.course_image?.uri
      ? `${raw.media.course_image.uri}`
      : raw.course_image_asset_path || raw.thumbnail_url || '',
    instructor_name: raw.org || raw.instructor_name || '',
    level: raw.effort || raw.level || 'beginner',
    is_free: raw.is_free ?? true,
    price: raw.price ?? 0,
    enrolled_count: raw.enrollment_count || raw.enrolled_count || 0,
    certificate_available: raw.certificate_available ?? true,
    category: raw.course_category || raw.category || '',
    tags: raw.course_categories || raw.tags || [],
    start: raw.start,
    end: raw.end,
    pacing: raw.pacing || 'instructor',
    lms_url: raw.course_url || '',
    blocks_url: raw.blocks_url || '',
  };
}
