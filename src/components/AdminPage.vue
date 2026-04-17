<template>
  <div class="admin-page">
    <div class="admin-header">
      <h1>管理员控制台</h1>
      <p v-if="hasPermission">欢迎，管理员！</p>
      <p v-else>您没有访问管理员页面的权限。</p>
      <div class="header-actions">
        <router-link to="/admin/nickname-reviews" class="review-entry-button">昵称审核</router-link>
        <button class="logout-button" @click="handleLogout">退出管理员登录</button>
      </div>
    </div>

    <div class="stats-section">
      <h2>用户活跃度统计</h2>
      <div class="stats-grid">
        <router-link to="/admin/users" class="stat-card-link">
          <div class="stat-card clickable">
            <div class="stat-value">{{ userStats.total_users }}</div>
            <div class="stat-label">总用户数</div>
            <div class="expand-indicator">→</div>
          </div>
        </router-link>
        <div class="stat-card clickable trend-card" @click="openTrendChart('week_active')">
          <div class="stat-value">{{ userStats.active_users }}</div>
          <div class="stat-label">本周活跃用户</div>
          <div class="expand-indicator">&#8599;</div>
        </div>
        <div class="stat-card clickable trend-card" @click="openTrendChart('today_logins')">
          <div class="stat-value">{{ userStats.today_logins }}</div>
          <div class="stat-label">今日登录</div>
          <div class="expand-indicator">&#8599;</div>
        </div>
        <div class="stat-card clickable trend-card" @click="openTrendChart('week_logins')">
          <div class="stat-value">{{ userStats.week_logins }}</div>
          <div class="stat-label">本周登录</div>
          <div class="expand-indicator">&#8599;</div>
        </div>
      </div>
    </div>

    <div class="stats-section">
      <h2>题目使用统计</h2>
      <div class="stats-grid">
        <router-link to="/admin/problems" class="stat-card-link">
          <div class="stat-card clickable">
            <div class="stat-value">{{ problemStats.total_problems }}</div>
            <div class="stat-label">总题目数</div>
            <div class="expand-indicator">→</div>
          </div>
        </router-link>
        <div class="stat-card">
          <div class="stat-value">{{ problemStats.solved_count }}</div>
          <div class="stat-label">已完成题目</div>
        </div>
        <div class="stat-card difficulty-easy">
          <div class="stat-value">{{ problemStats.easy_count }}</div>
          <div class="stat-label">简单题目</div>
        </div>
        <div class="stat-card difficulty-medium">
          <div class="stat-value">{{ problemStats.medium_count }}</div>
          <div class="stat-label">中等题目</div>
        </div>
        <div class="stat-card difficulty-hard">
          <div class="stat-value">{{ problemStats.hard_count }}</div>
          <div class="stat-label">困难题目</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ problemStats.avg_acceptance_rate }}%</div>
          <div class="stat-label">平均通过率</div>
        </div>
      </div>
    </div>

    <div class="detailed-stats">
      <div class="stats-table">
        <h3>题目难度分布</h3>
        <table class="stats-table-content">
          <thead>
            <tr>
              <th>难度</th>
              <th>题目数量</th>
              <th>完成数量</th>
              <th>完成率</th>
              <th>平均通过率</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="difficulty-easy">简单</td>
              <td>{{ problemStats.easy_count }}</td>
              <td>{{ problemStats.easy_solved }}</td>
              <td>{{ getCompletionRate(problemStats.easy_solved, problemStats.easy_count) }}%</td>
              <td>{{ problemStats.easy_acceptance_rate }}%</td>
            </tr>
            <tr>
              <td class="difficulty-medium">中等</td>
              <td>{{ problemStats.medium_count }}</td>
              <td>{{ problemStats.medium_solved }}</td>
              <td>{{ getCompletionRate(problemStats.medium_solved, problemStats.medium_count) }}%</td>
              <td>{{ problemStats.medium_acceptance_rate }}%</td>
            </tr>
            <tr>
              <td class="difficulty-hard">困难</td>
              <td>{{ problemStats.hard_count }}</td>
              <td>{{ problemStats.hard_solved }}</td>
              <td>{{ getCompletionRate(problemStats.hard_solved, problemStats.hard_count) }}%</td>
              <td>{{ problemStats.hard_acceptance_rate }}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="stats-table">
        <h3>用户活跃度趋势</h3>
        <table class="stats-table-content">
          <thead>
            <tr>
              <th>时间段</th>
              <th>新注册用户</th>
              <th>活跃用户</th>
              <th>登录次数</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>今日</td>
              <td>{{ userStats.today_registrations }}</td>
              <td>{{ userStats.today_active }}</td>
              <td>{{ userStats.today_logins }}</td>
            </tr>
            <tr>
              <td>本周</td>
              <td>{{ userStats.week_registrations }}</td>
              <td>{{ userStats.week_active }}</td>
              <td>{{ userStats.week_logins }}</td>
            </tr>
            <tr>
              <td>本月</td>
              <td>{{ userStats.month_registrations }}</td>
              <td>{{ userStats.month_active }}</td>
              <td>{{ userStats.month_logins }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="stats-section">
      <div class="nickname-review-header">
        <h2>昵称审核</h2>
        <button class="review-refresh-btn" :disabled="nicknameReviewsLoading" @click="loadPendingNicknameReviews">
          {{ nicknameReviewsLoading ? '刷新中...' : '刷新待审核' }}
        </button>
      </div>

      <div v-if="nicknameReviewsError" class="nickname-review-state nickname-review-error">
        {{ nicknameReviewsError }}
      </div>
      <div v-else-if="nicknameReviewsLoading && !pendingNicknameReviews.length" class="nickname-review-state">
        加载中...
      </div>
      <div v-else-if="!pendingNicknameReviews.length" class="nickname-review-state">
        当前没有待审核昵称
      </div>
      <div v-else class="nickname-review-table-wrapper">
        <table class="nickname-review-table">
          <thead>
            <tr>
              <th>用户ID</th>
              <th>用户名</th>
              <th>提交昵称</th>
              <th>当前展示名</th>
              <th>提交时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in pendingNicknameReviews" :key="item.rowKey">
              <td>{{ item.userId || '-' }}</td>
              <td>{{ item.username || '-' }}</td>
              <td>{{ item.pendingNickname || '-' }}</td>
              <td>{{ item.currentDisplayName || '-' }}</td>
              <td>{{ item.submittedAtText }}</td>
              <td class="nickname-review-actions">
                <button
                  class="review-action-btn approve"
                  :disabled="!item.userId || processingReviewIds.has(item.rowKey)"
                  @click="approveNickname(item)"
                >
                  通过
                </button>
                <button
                  class="review-action-btn reject"
                  :disabled="!item.userId || processingReviewIds.has(item.rowKey)"
                  @click="rejectNickname(item)"
                >
                  驳回
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div v-if="trendDialog.visible" class="trend-dialog-overlay" @click="closeTrendChart">
    <div class="trend-dialog" @click.stop>
      <div class="trend-dialog-header">
        <div>
          <h3 class="trend-dialog-title">{{ trendDialog.title }}</h3>
          <p class="trend-dialog-subtitle">{{ trendDialog.subtitle }}</p>
        </div>
        <button class="trend-close-button" @click="closeTrendChart">×</button>
      </div>

      <div v-if="trendDialog.loading" class="trend-dialog-state">加载中...</div>
      <div v-else-if="trendDialog.error" class="trend-dialog-state trend-dialog-error">
        {{ trendDialog.error }}
      </div>
      <div v-else-if="!trendDialog.series.values.length" class="trend-dialog-state">暂无登录数据</div>
      <div v-else class="trend-chart-area">
        <svg
          class="trend-chart-svg"
          viewBox="0 0 760 320"
          preserveAspectRatio="none"
          role="img"
          aria-label="trend-line-chart"
        >
          <g>
            <line
              v-for="tick in trendChartMeta.yTicks"
              :key="`grid-${tick.value}-${tick.y}`"
              x1="56"
              :y1="tick.y"
              x2="728"
              :y2="tick.y"
              class="trend-grid-line"
            />
            <text
              v-for="tick in trendChartMeta.yTicks"
              :key="`ylabel-${tick.value}-${tick.y}`"
              x="50"
              :y="tick.y + 4"
              text-anchor="end"
              class="trend-axis-label"
            >
              {{ tick.value }}
            </text>
          </g>
          <path :d="trendChartMeta.path" class="trend-line" />
          <circle
            v-for="point in trendChartMeta.points"
            :key="`point-${point.index}`"
            :cx="point.x"
            :cy="point.y"
            r="3.5"
            class="trend-point"
          />
          <text
            v-for="mark in trendChartMeta.xMarks"
            :key="`xlabel-${mark.index}`"
            :x="mark.x"
            y="306"
            text-anchor="middle"
            class="trend-axis-label"
          >
            {{ mark.label }}
          </text>
        </svg>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';

const USER_STATS_DEFAULT = {
  total_users: 0,
  active_users: 0,
  today_registrations: 0,
  week_registrations: 0,
  month_registrations: 0,
  today_active: 0,
  week_active: 0,
  month_active: 0,
  today_logins: 0,
  week_logins: 0,
  month_logins: 0
};

const PROBLEM_STATS_DEFAULT = {
  total_problems: 0,
  solved_count: 0,
  easy_count: 0,
  medium_count: 0,
  hard_count: 0,
  easy_solved: 0,
  medium_solved: 0,
  hard_solved: 0,
  avg_acceptance_rate: 0,
  easy_acceptance_rate: 0,
  medium_acceptance_rate: 0,
  hard_acceptance_rate: 0
};

function unwrapData(value, depth = 0) {
  if (depth > 6 || value == null) return value;
  if (Array.isArray(value)) return value;

  if (typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'data')) {
    const data = value.data;
    const outerKeys = Object.keys(value).filter((k) => k !== 'data');
    const outerLikelyWrapper =
      outerKeys.length === 0 ||
      outerKeys.every((k) => ['code', 'msg', 'message', 'status', 'success'].includes(k));

    if (outerLikelyWrapper || typeof data === 'object') {
      return unwrapData(data, depth + 1);
    }
  }

  return value;
}

function toNumber(value, fallback = 0) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'string') {
    const cleaned = value.replace('%', '').trim();
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function firstNumber(values, fallback = 0) {
  for (const item of values) {
    const num = toNumber(item, NaN);
    if (!Number.isNaN(num)) return num;
  }
  return fallback;
}

function firstPositiveOrNumber(values, fallback = 0) {
  const parsed = values
    .map((item) => toNumber(item, NaN))
    .filter((num) => !Number.isNaN(num));

  if (parsed.length === 0) return fallback;
  const positive = parsed.find((num) => num > 0);
  return positive !== undefined ? positive : parsed[0];
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function firstNumberFromPaths(obj, paths, fallback = 0, preferPositive = false) {
  const values = paths.map((path) => getByPath(obj, path));
  return preferPositive ? firstPositiveOrNumber(values, fallback) : firstNumber(values, fallback);
}

function extractList(raw, candidateKeys = []) {
  const payload = unwrapData(raw);
  if (Array.isArray(payload)) return payload;

  const obj = asObject(payload);
  for (const key of candidateKeys) {
    if (Array.isArray(obj[key])) return obj[key];
  }

  if (Array.isArray(obj.results)) return obj.results;
  if (Array.isArray(obj.items)) return obj.items;

  return [];
}

function extractPagination(raw) {
  const payload = unwrapData(raw);
  const obj = asObject(payload);
  const pagination = asObject(obj.pagination);

  return {
    currentPage: Math.max(1, toNumber(pagination.current_page ?? obj.current_page, 1)),
    totalPages: Math.max(1, toNumber(pagination.total_pages ?? obj.total_pages, 1)),
    pageSize: Math.max(1, toNumber(pagination.page_size ?? obj.page_size, 20)),
    totalCount: Math.max(0, toNumber(pagination.total_count ?? obj.total_count, 0))
  };
}

async function fetchAllProblems() {
  const pageSize = 100;
  const firstPageRes = await request.get('/api/leetcode/problems/', {
    params: { page: 1, page_size: pageSize }
  });

  const allProblems = extractList(firstPageRes, ['problems', 'results', 'data']);
  const { totalPages } = extractPagination(firstPageRes);

  if (totalPages <= 1) return allProblems;

  const remainingRequests = [];
  for (let page = 2; page <= totalPages; page += 1) {
    remainingRequests.push(
      request.get('/api/leetcode/problems/', {
        params: { page, page_size: pageSize }
      })
    );
  }

  const remainingResponses = await Promise.allSettled(remainingRequests);
  remainingResponses.forEach((res) => {
    if (res.status !== 'fulfilled') return;
    allProblems.push(...extractList(res.value, ['problems', 'results', 'data']));
  });

  return allProblems;
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getBoundaries() {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const startWeek = new Date(startToday);
  const weekday = (startWeek.getDay() + 6) % 7; // Monday = 0
  startWeek.setDate(startWeek.getDate() - weekday);

  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return { now, startToday, startWeek, startMonth };
}

function countByRange(items, dateGetter, start, end) {
  let count = 0;
  for (const item of items) {
    const date = parseDate(dateGetter(item));
    if (date && date >= start && date <= end) count += 1;
  }
  return count;
}

function toDayKeyLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDayLabel(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

function getRecentDays(dayCount) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = [];

  for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
    const current = new Date(todayStart);
    current.setDate(todayStart.getDate() - offset);
    days.push(current);
  }

  return days;
}

function getActivityDate(item) {
  return parseDate(item?.created_at ?? item?.createdAt ?? item?.timestamp ?? item?.time);
}

function getActivityUserKey(item) {
  return String(item?.user_username ?? item?.username ?? item?.user ?? item?.ip_address ?? '').trim();
}

function buildWeekLoginsSeries(activities) {
  const days = getRecentDays(7);
  const dayIndex = new Map(days.map((day, index) => [toDayKeyLocal(day), index]));
  const values = Array(days.length).fill(0);

  activities.forEach((activity) => {
    const date = getActivityDate(activity);
    if (!date) return;
    const idx = dayIndex.get(toDayKeyLocal(date));
    if (idx === undefined) return;
    values[idx] += 1;
  });

  return {
    labels: days.map((day) => formatDayLabel(day)),
    values
  };
}

function buildWeekActiveSeries(activities) {
  const days = getRecentDays(7);
  const dayIndex = new Map(days.map((day, index) => [toDayKeyLocal(day), index]));
  const dayUsers = Array.from({ length: days.length }, () => new Set());

  activities.forEach((activity) => {
    const date = getActivityDate(activity);
    if (!date) return;

    const idx = dayIndex.get(toDayKeyLocal(date));
    if (idx === undefined) return;

    const userKey = getActivityUserKey(activity);
    if (!userKey) return;
    dayUsers[idx].add(userKey);
  });

  return {
    labels: days.map((day) => formatDayLabel(day)),
    values: dayUsers.map((set) => set.size)
  };
}

function buildTodayLoginsSeries(activities) {
  const today = new Date();
  const todayKey = toDayKeyLocal(today);
  const labels = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`);
  const values = Array(24).fill(0);

  activities.forEach((activity) => {
    const date = getActivityDate(activity);
    if (!date || toDayKeyLocal(date) !== todayKey) return;
    values[date.getHours()] += 1;
  });

  return { labels, values };
}

function buildTrendChartMeta(series) {
  const labels = Array.isArray(series?.labels) ? series.labels : [];
  const values = Array.isArray(series?.values) ? series.values : [];
  const width = 760;
  const height = 320;
  const left = 56;
  const right = 32;
  const top = 20;
  const bottom = 44;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maxValue = Math.max(...values, 1);
  const yTickCount = 4;

  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => {
    const ratio = i / yTickCount;
    const value = Math.round((maxValue * (1 - ratio)) * 100) / 100;
    return {
      y: top + chartHeight * ratio,
      value
    };
  });

  if (!values.length) {
    return { path: '', points: [], xMarks: [], yTicks };
  }

  const stepX = values.length > 1 ? chartWidth / (values.length - 1) : 0;
  const points = values.map((value, index) => ({
    index,
    value,
    x: left + stepX * index,
    y: top + chartHeight - (value / maxValue) * chartHeight
  }));

  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  const xStep = labels.length <= 8 ? 1 : Math.ceil(labels.length / 6);
  const xMarks = points
    .filter((point) => point.index === 0 || point.index === labels.length - 1 || point.index % xStep === 0)
    .map((point) => ({
      index: point.index,
      x: point.x,
      label: labels[point.index]
    }));

  return { path, points, xMarks, yTicks };
}

function normalizeDifficulty(raw) {
  const num = toNumber(raw, NaN);
  if (!Number.isNaN(num)) {
    if (num === 1) return 'easy';
    if (num === 2) return 'medium';
    if (num === 3) return 'hard';
  }

  const text = String(raw || '').trim().toLowerCase();
  if (text === 'easy') return 'easy';
  if (text === 'medium') return 'medium';
  if (text === 'hard') return 'hard';

  return '';
}

function normalizeAcceptanceRate(raw) {
  const num = toNumber(raw, NaN);
  if (Number.isNaN(num)) return 0;
  return num <= 1 ? num * 100 : num;
}

function normalizeCompletionStatus(raw) {
  return String(raw ?? '').trim().toLowerCase();
}

function extractProblemId(item) {
  return toNumber(
    item?.problem_id ?? item?.problemId ?? item?.id ?? item?.problem?.id ?? item?.problem,
    NaN
  );
}

function computeProblemMetrics(problemList, completionList) {
  const solvedSet = new Set();
  completionList.forEach((item) => {
    const status = normalizeCompletionStatus(item?.status ?? item?.completion_status);
    if (status !== 'completed') return;

    const id = extractProblemId(item);
    if (!Number.isNaN(id)) solvedSet.add(id);
  });

  let total = 0;
  let totalAcceptance = 0;

  let easyCount = 0;
  let mediumCount = 0;
  let hardCount = 0;

  let easySolved = 0;
  let mediumSolved = 0;
  let hardSolved = 0;

  let easyAcceptance = 0;
  let mediumAcceptance = 0;
  let hardAcceptance = 0;

  problemList.forEach((problem) => {
    const difficulty = normalizeDifficulty(problem?.difficulty);
    const acceptance = normalizeAcceptanceRate(problem?.acceptance_rate);
    const problemId = extractProblemId(problem);
    const solved = !Number.isNaN(problemId) && solvedSet.has(problemId);

    total += 1;
    totalAcceptance += acceptance;

    if (difficulty === 'easy') {
      easyCount += 1;
      easyAcceptance += acceptance;
      if (solved) easySolved += 1;
    } else if (difficulty === 'medium') {
      mediumCount += 1;
      mediumAcceptance += acceptance;
      if (solved) mediumSolved += 1;
    } else if (difficulty === 'hard') {
      hardCount += 1;
      hardAcceptance += acceptance;
      if (solved) hardSolved += 1;
    }
  });

  const avg = total > 0 ? totalAcceptance / total : 0;
  const easyAvg = easyCount > 0 ? easyAcceptance / easyCount : 0;
  const mediumAvg = mediumCount > 0 ? mediumAcceptance / mediumCount : 0;
  const hardAvg = hardCount > 0 ? hardAcceptance / hardCount : 0;

  return {
    total_problems: total,
    solved_count: solvedSet.size,
    easy_count: easyCount,
    medium_count: mediumCount,
    hard_count: hardCount,
    easy_solved: easySolved,
    medium_solved: mediumSolved,
    hard_solved: hardSolved,
    avg_acceptance_rate: Math.round(avg * 100) / 100,
    easy_acceptance_rate: Math.round(easyAvg * 100) / 100,
    medium_acceptance_rate: Math.round(mediumAvg * 100) / 100,
    hard_acceptance_rate: Math.round(hardAvg * 100) / 100
  };
}

function pickDifficultyCount(problemApi, key, fallback) {
  const distribution = asObject(problemApi.difficulty_distribution);
  return firstNumber(
    [
      problemApi[`${key}_count`],
      problemApi[`${key}_total`],
      distribution[key]
    ],
    fallback
  );
}

function buildUserStats(apiStats, users) {
  const api = asObject(unwrapData(apiStats));
  const { now, startToday, startWeek, startMonth } = getBoundaries();

  const regDate = (u) => u?.date_joined || u?.created_at || u?.created_time || u?.registered_at;
  const activeDate = (u) => u?.last_login || u?.last_active || u?.updated_at;

  const fallbackTotalUsers = users.length;

  const todayRegistrationsFallback = countByRange(users, regDate, startToday, now);
  const weekRegistrationsFallback = countByRange(users, regDate, startWeek, now);
  const monthRegistrationsFallback = countByRange(users, regDate, startMonth, now);

  const todayActiveFallback = countByRange(users, activeDate, startToday, now);
  const weekActiveFallback = countByRange(users, activeDate, startWeek, now);
  const monthActiveFallback = countByRange(users, activeDate, startMonth, now);

  // Login count fallback uses activity-derived values.
  const todayLoginsFallback = todayActiveFallback;
  const weekLoginsFallback = weekActiveFallback;
  const monthLoginsFallback = monthActiveFallback;

  const todayRegistrations = firstNumberFromPaths(
    api,
    [
      'registrations_today',
      'today_registrations',
      'new_users_today',
      'registration.today',
      'registrations.today',
      'trend.today.registrations',
      'activity.today.registrations'
    ],
    todayRegistrationsFallback,
    true
  );
  const weekRegistrationsRaw = firstNumberFromPaths(
    api,
    [
      'registrations_week',
      'week_registrations',
      'new_users_week',
      'registration.week',
      'registrations.week',
      'trend.week.registrations',
      'activity.week.registrations'
    ],
    weekRegistrationsFallback,
    true
  );
  const monthRegistrationsRaw = firstNumberFromPaths(
    api,
    [
      'registrations_month',
      'month_registrations',
      'new_users_month',
      'registration.month',
      'registrations.month',
      'trend.month.registrations',
      'activity.month.registrations'
    ],
    monthRegistrationsFallback,
    true
  );

  const todayActive = firstNumberFromPaths(
    api,
    [
      'active_users_today',
      'today_active',
      'active_today',
      'activity.today.active_users',
      'trend.today.active',
      'daily_active_users'
    ],
    todayActiveFallback,
    true
  );
  const weekActiveRaw = firstNumberFromPaths(
    api,
    [
      'active_users_week',
      'week_active',
      'active_week',
      'activity.week.active_users',
      'trend.week.active',
      'weekly_active_users'
    ],
    weekActiveFallback,
    true
  );
  const monthActiveRaw = firstNumberFromPaths(
    api,
    [
      'active_users_month',
      'month_active',
      'active_month',
      'activity.month.active_users',
      'trend.month.active',
      'monthly_active_users'
    ],
    monthActiveFallback,
    true
  );

  const todayLoginFallbackByActive = firstPositiveOrNumber([todayActive], todayLoginsFallback);
  const weekLoginFallbackByActive = firstPositiveOrNumber([weekActiveRaw, todayActive], weekLoginsFallback);
  const monthLoginFallbackByActive = firstPositiveOrNumber(
    [monthActiveRaw, weekActiveRaw, todayActive],
    monthLoginsFallback
  );

  const todayLogins = firstNumberFromPaths(
    api,
    [
      'logins_today',
      'today_logins',
      'login_count_today',
      'activity.today.logins',
      'trend.today.logins',
      'today_login_count'
    ],
    todayLoginFallbackByActive,
    true
  );
  const weekLoginsRaw = firstNumberFromPaths(
    api,
    [
      'logins_week',
      'week_logins',
      'login_count_week',
      'activity.week.logins',
      'trend.week.logins',
      'weekly_login_count'
    ],
    weekLoginFallbackByActive,
    true
  );
  const monthLoginsRaw = firstNumberFromPaths(
    api,
    [
      'logins_month',
      'month_logins',
      'login_count_month',
      'activity.month.logins',
      'trend.month.logins',
      'monthly_login_count'
    ],
    monthLoginFallbackByActive,
    true
  );

  // Ensure aggregate ranges remain non-decreasing.
  const weekRegistrations = Math.max(weekRegistrationsRaw, todayRegistrations);
  const monthRegistrations = Math.max(monthRegistrationsRaw, weekRegistrations);
  const weekActive = Math.max(weekActiveRaw, todayActive);
  const monthActive = Math.max(monthActiveRaw, weekActive);
  const weekLogins = Math.max(weekLoginsRaw, todayLogins);
  const monthLogins = Math.max(monthLoginsRaw, weekLogins);

  // Prefer active users from real login activity.
  const activeUsers = firstPositiveOrNumber(
    [
      api.active_users,
      api.active_user_count,
      api.active_users_total,
      api.summary?.active_users,
      weekActive,
      todayActive,
      monthActive
    ],
    weekActiveFallback
  );

  return {
    total_users: firstPositiveOrNumber(
      [
        api.total_users,
        api.users_total,
        api.user_count,
        api.total_user_count,
        api.summary?.total_users
      ],
      fallbackTotalUsers
    ),
    active_users: activeUsers,
    today_registrations: todayRegistrations,
    week_registrations: weekRegistrations,
    month_registrations: monthRegistrations,
    today_active: todayActive,
    week_active: weekActive,
    month_active: monthActive,
    today_logins: todayLogins,
    week_logins: weekLogins,
    month_logins: monthLogins
  };
}

function buildProblemStats(problemStatsApi, userStatsApi, computedMetrics) {
  const problemApi = asObject(unwrapData(problemStatsApi));
  const userApi = asObject(unwrapData(userStatsApi));

  const totalProblems = firstNumber(
    [problemApi.total_problems, userApi.total_problems],
    computedMetrics.total_problems
  );

  const solvedCount = firstNumber(
    [
      problemApi.solved_count,
      problemApi.total_solved,
      problemApi.completed_problem_count,
      problemApi.problems_solved,
      userApi.problems_completed_total,
      userApi.total_completed_problems,
      userApi.problems_completed
    ],
    computedMetrics.solved_count
  );

  const easyCount = pickDifficultyCount(problemApi, 'easy', computedMetrics.easy_count);
  const mediumCount = pickDifficultyCount(problemApi, 'medium', computedMetrics.medium_count);
  const hardCount = pickDifficultyCount(problemApi, 'hard', computedMetrics.hard_count);

  const avgAcceptance = firstNumber(
    [
      problemApi.avg_acceptance_rate,
      problemApi.average_acceptance_rate,
      problemApi.avg_acceptance
    ],
    computedMetrics.avg_acceptance_rate
  );

  return {
    total_problems: totalProblems,
    solved_count: solvedCount,
    easy_count: easyCount,
    medium_count: mediumCount,
    hard_count: hardCount,
    easy_solved: firstNumber(
      [
        problemApi.easy_solved,
        problemApi.solved_easy,
        userApi.problems_completed_easy,
        userApi.completed_easy_problems
      ],
      computedMetrics.easy_solved
    ),
    medium_solved: firstNumber(
      [
        problemApi.medium_solved,
        problemApi.solved_medium,
        userApi.problems_completed_medium,
        userApi.completed_medium_problems
      ],
      computedMetrics.medium_solved
    ),
    hard_solved: firstNumber(
      [
        problemApi.hard_solved,
        problemApi.solved_hard,
        userApi.problems_completed_hard,
        userApi.completed_hard_problems
      ],
      computedMetrics.hard_solved
    ),
    avg_acceptance_rate: Math.round(avgAcceptance * 100) / 100,
    easy_acceptance_rate: Math.round(
      firstNumber(
        [problemApi.easy_acceptance_rate, problemApi.avg_easy_acceptance],
        computedMetrics.easy_acceptance_rate
      ) * 100
    ) / 100,
    medium_acceptance_rate: Math.round(
      firstNumber(
        [problemApi.medium_acceptance_rate, problemApi.avg_medium_acceptance],
        computedMetrics.medium_acceptance_rate
      ) * 100
    ) / 100,
    hard_acceptance_rate: Math.round(
      firstNumber(
        [problemApi.hard_acceptance_rate, problemApi.avg_hard_acceptance],
        computedMetrics.hard_acceptance_rate
      ) * 100
    ) / 100
  };
}

function formatDateTimeLabel(value) {
  const parsed = parseDate(value);
  if (!parsed) return '-';
  return parsed.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function normalizeNicknameReviewItem(raw, index = 0) {
  const item = asObject(raw);
  const user = asObject(item.user);
  const userIdRaw = item.user_id ?? item.userId ?? user.id ?? item.id ?? '';
  const userIdText = String(userIdRaw ?? '').trim();
  const pendingNickname = String(
    item.nickname_pending ??
    item.pending_nickname ??
    item.nickname ??
    item.candidate_nickname ??
    ''
  ).trim();
  const currentDisplayName = String(
    item.display_name ??
    item.nickname_approved ??
    item.current_display_name ??
    user.display_name ??
    user.nickname_approved ??
    user.nickname ??
    ''
  ).trim();
  const username = String(item.username ?? user.username ?? item.user_username ?? '').trim();
  const submittedAt =
    item.submitted_at ??
    item.created_at ??
    item.createdAt ??
    item.updated_at ??
    item.updatedAt ??
    '';

  return {
    rowKey: userIdText || `${username || 'anonymous'}-${pendingNickname || 'empty'}-${index}`,
    userId: userIdText,
    username,
    pendingNickname,
    currentDisplayName,
    submittedAt,
    submittedAtText: formatDateTimeLabel(submittedAt),
  };
}

export default {
  name: 'AdminPage',
  setup() {
    const hasPermission = ref(false);
    const router = useRouter();

    const userStats = ref({ ...USER_STATS_DEFAULT });
    const problemStats = ref({ ...PROBLEM_STATS_DEFAULT });
    const loginActivities = ref([]);
    const pendingNicknameReviews = ref([]);
    const nicknameReviewsLoading = ref(false);
    const nicknameReviewsError = ref('');
    const processingReviewIds = reactive(new Set());
    const trendDialog = ref({
      visible: false,
      loading: false,
      error: '',
      title: '',
      subtitle: '',
      series: {
        labels: [],
        values: []
      }
    });

    const getCompletionRate = (solved, total) => {
      const safeTotal = toNumber(total, 0);
      if (safeTotal <= 0) return 0;
      return Math.round((toNumber(solved, 0) / safeTotal) * 100);
    };

    const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('is_admin');
      localStorage.removeItem('user_id');
      localStorage.removeItem('username');
      router.push('/login');
    };

    const trendChartMeta = computed(() => buildTrendChartMeta(trendDialog.value.series));

    const closeTrendChart = () => {
      trendDialog.value.visible = false;
    };

    const loadLoginActivities = async () => {
      if (loginActivities.value.length > 0) return loginActivities.value;

      const collected = [];
      const pageSize = 200;
      let page = 1;
      let totalPages = 1;

      while (page <= totalPages) {
        const response = await request.get('/api/admin/activities/', {
          params: {
            days: 7,
            type: 'login',
            page,
            page_size: pageSize
          }
        });

        collected.push(...extractList(response, ['activities', 'results', 'data']));
        totalPages = extractPagination(response).totalPages;
        page += 1;
      }

      loginActivities.value = collected;
      return collected;
    };

    const openTrendChart = async (chartType) => {
      const chartMetaMap = {
        week_active: {
          title: '本周活跃用户趋势',
          subtitle: '最近7天按天统计，口径为登录去重用户数'
        },
        today_logins: {
          title: '今日登录趋势',
          subtitle: '今日按小时统计登录次数'
        },
        week_logins: {
          title: '本周登录趋势',
          subtitle: '最近7天按天统计登录次数'
        }
      };

      const selectedMeta = chartMetaMap[chartType] ?? chartMetaMap.week_logins;

      trendDialog.value.visible = true;
      trendDialog.value.loading = true;
      trendDialog.value.error = '';
      trendDialog.value.title = selectedMeta.title;
      trendDialog.value.subtitle = selectedMeta.subtitle;
      trendDialog.value.series = { labels: [], values: [] };

      try {
        const activities = await loadLoginActivities();
        const series =
          chartType === 'week_active'
            ? buildWeekActiveSeries(activities)
            : chartType === 'today_logins'
              ? buildTodayLoginsSeries(activities)
              : buildWeekLoginsSeries(activities);
        trendDialog.value.series = series;
      } catch (error) {
        console.error('加载趋势数据失败', error);
        trendDialog.value.error = '趋势数据加载失败，请稍后重试';
      } finally {
        trendDialog.value.loading = false;
      }
    };

    const loadDashboardStats = async () => {
      const [userStatsRes, problemStatsRes, usersRes, problemsRes] = await Promise.allSettled([
        request.get('/api/admin/statistics/users/'),
        request.get('/api/leetcode/stats/'),
        request.get('/api/admin/users/'),
        fetchAllProblems()
      ]);

      const userStatsApi = userStatsRes.status === 'fulfilled' ? userStatsRes.value : {};
      const problemStatsApi = problemStatsRes.status === 'fulfilled' ? problemStatsRes.value : {};

      const users =
        usersRes.status === 'fulfilled'
          ? extractList(usersRes.value, ['users', 'results', 'data'])
          : [];

      const problems =
        problemsRes.status === 'fulfilled'
          ? extractList(problemsRes.value, ['problems', 'results', 'data'])
          : [];

      const computedProblemMetrics = computeProblemMetrics(problems, []);
      userStats.value = buildUserStats(userStatsApi, users);
      problemStats.value = buildProblemStats(problemStatsApi, userStatsApi, computedProblemMetrics);
    };

    const loadPendingNicknameReviews = async () => {
      nicknameReviewsLoading.value = true;
      nicknameReviewsError.value = '';

      try {
        const response = await request.get('/api/admin/nickname-reviews', {
          params: { status: 'pending' }
        });
        const list = extractList(response, ['nickname_reviews', 'reviews', 'results', 'items', 'data']);
        pendingNicknameReviews.value = list
          .map((item, index) => normalizeNicknameReviewItem(item, index))
          .filter((item) => item.pendingNickname || item.userId || item.username);
      } catch (error) {
        console.error('加载待审核昵称失败', error);
        pendingNicknameReviews.value = [];
        nicknameReviewsError.value =
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          '待审核昵称加载失败，请稍后重试';
      } finally {
        nicknameReviewsLoading.value = false;
      }
    };

    const approveNickname = async (item) => {
      if (!item?.userId) {
        ElMessage.error('该条记录缺少用户ID，无法审核');
        return;
      }

      processingReviewIds.add(item.rowKey);
      try {
        await request.post(`/api/admin/nickname-reviews/${item.userId}/approve`, {});
        ElMessage.success(`已通过用户 ${item.username || item.userId} 的昵称`);
        await loadPendingNicknameReviews();
      } catch (error) {
        console.error('审核通过失败', error);
        ElMessage.error(
          error?.response?.data?.detail ||
            error?.response?.data?.message ||
            '审核通过失败，请重试'
        );
      } finally {
        processingReviewIds.delete(item.rowKey);
      }
    };

    const rejectNickname = async (item) => {
      if (!item?.userId) {
        ElMessage.error('该条记录缺少用户ID，无法审核');
        return;
      }

      const input = window.prompt(`请输入驳回用户「${item.username || item.userId}」昵称的原因`);
      if (input === null) return;
      const reason = String(input).trim();
      if (!reason) {
        ElMessage.warning('驳回原因不能为空');
        return;
      }

      processingReviewIds.add(item.rowKey);
      try {
        await request.post(`/api/admin/nickname-reviews/${item.userId}/reject`, {
          reason,
          reject_reason: reason
        });
        ElMessage.success(`已驳回用户 ${item.username || item.userId} 的昵称`);
        await loadPendingNicknameReviews();
      } catch (error) {
        console.error('审核驳回失败', error);
        ElMessage.error(
          error?.response?.data?.detail ||
            error?.response?.data?.message ||
            '审核驳回失败，请重试'
        );
      } finally {
        processingReviewIds.delete(item.rowKey);
      }
    };

    onMounted(async () => {
      const isAdmin = localStorage.getItem('is_admin') === 'true';
      const token = localStorage.getItem('token');

      if (!token || !isAdmin) {
        router.push('/main');
        return;
      }

      hasPermission.value = true;

      try {
        await loadDashboardStats();
      } catch (error) {
        console.error('加载管理员统计数据失败', error);
        userStats.value = { ...USER_STATS_DEFAULT };
        problemStats.value = { ...PROBLEM_STATS_DEFAULT };
      }

      try {
        await loadPendingNicknameReviews();
      } catch (error) {
        console.error('加载昵称审核列表失败', error);
      }
    });

    return {
      hasPermission,
      userStats,
      problemStats,
      pendingNicknameReviews,
      nicknameReviewsLoading,
      nicknameReviewsError,
      processingReviewIds,
      trendDialog,
      trendChartMeta,
      getCompletionRate,
      handleLogout,
      openTrendChart,
      closeTrendChart,
      loadPendingNicknameReviews,
      approveNickname,
      rejectNickname
    };
  }
};
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #fff;
  padding: 20px;
}

.admin-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.admin-header h1 {
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
}

/* 閫€鍑虹櫥褰曟寜閽牱寮?*/
.logout-button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.logout-button:hover {
  background-color: #c82333;
}

.review-entry-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  background-color: #1f78ff;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.review-entry-button:hover {
  background-color: #1664d9;
}

.stats-section {
  margin-bottom: 40px;
}

.stats-section h2 {
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.nickname-review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.review-refresh-btn {
  border: none;
  border-radius: 6px;
  background: #1f78ff;
  color: #fff;
  font-size: 13px;
  padding: 8px 14px;
  cursor: pointer;
}

.review-refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.nickname-review-state {
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #d0d7e2;
  border-radius: 10px;
  color: #556070;
  background: #fafcff;
}

.nickname-review-error {
  color: #b42318;
  border-color: #fda29b;
  background: #fff4f4;
}

.nickname-review-table-wrapper {
  overflow-x: auto;
  border: 1px solid #e4e7ec;
  border-radius: 10px;
  background: #fff;
}

.nickname-review-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

.nickname-review-table th,
.nickname-review-table td {
  border-bottom: 1px solid #eef2f7;
  padding: 10px 12px;
  text-align: left;
  font-size: 13px;
  color: #344054;
}

.nickname-review-table th {
  background: #f8fafc;
  color: #1f2937;
  font-weight: 600;
}

.nickname-review-table tr:last-child td {
  border-bottom: none;
}

.nickname-review-actions {
  display: flex;
  gap: 8px;
}

.review-action-btn {
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
}

.review-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.review-action-btn.approve {
  color: #05603a;
  background: #d1fadf;
}

.review-action-btn.reject {
  color: #b42318;
  background: #fee4e2;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: transform 0.2s ease;
  position: relative;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* 可点击的统计卡片 */
.stat-card.clickable {
  cursor: pointer;
  background: #e9f5ff;
}

.stat-card.clickable:hover {
  background: #d1e9ff;
}

/* 统计卡片链接 */
.stat-card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.stat-card-link:hover {
  text-decoration: none;
}

/* 灞曞紑鎸囩ず鍣?*/
.expand-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 16px;
  color: #007bff;
  transition: transform 0.3s ease;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.difficulty-easy {
  background-color: #dbf0df !important;
  border-left: 4px solid #28a745;
}

.difficulty-medium {
  background-color: #fef8dc !important;
  border-left: 4px solid #ffc107;
}

.difficulty-hard {
  background-color: #ffe0e0 !important;
  border-left: 4px solid #dc3545;
}

.detailed-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.stats-table h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 15px;
}

.stats-table-content {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stats-table-content th,
.stats-table-content td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.stats-table-content th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.stats-table-content tr:last-child td {
  border-bottom: none;
}

.stats-table-content td.difficulty-easy {
  color: #28a745;
  font-weight: 600;
}

.stats-table-content td.difficulty-medium {
  color: #ffc107;
  font-weight: 600;
}

.stats-table-content td.difficulty-hard {
  color: #dc3545;
  font-weight: 600;
}

.trend-card .expand-indicator {
  color: #1f78ff;
}

.trend-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.trend-dialog {
  width: min(920px, 96vw);
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.3);
  padding: 16px 18px 18px;
}

.trend-dialog-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.trend-dialog-title {
  margin: 0;
  font-size: 20px;
  color: #1f2937;
}

.trend-dialog-subtitle {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.trend-close-button {
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  border: none;
  background: #eef2ff;
  color: #334155;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.trend-close-button:hover {
  background: #dbeafe;
}

.trend-dialog-state {
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  font-size: 14px;
}

.trend-dialog-error {
  color: #dc2626;
}

.trend-chart-area {
  margin-top: 12px;
}

.trend-chart-svg {
  width: 100%;
  height: 320px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: linear-gradient(180deg, #fbfdff 0%, #f4f8ff 100%);
}

.trend-grid-line {
  stroke: #dbe7fb;
  stroke-width: 1;
}

.trend-axis-label {
  font-size: 11px;
  fill: #64748b;
}

.trend-line {
  fill: none;
  stroke: #1f78ff;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.trend-point {
  fill: #1f78ff;
  stroke: #ffffff;
  stroke-width: 1.5;
}

/* 鍝嶅簲寮忚璁?*/
@media (max-width: 1200px) {
  .detailed-stats {
    grid-template-columns: 1fr;
  }
  
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .logout-button {
    align-self: flex-end;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .nickname-review-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .review-refresh-btn {
    align-self: flex-end;
  }

  .trend-dialog {
    width: 100%;
    padding: 14px;
  }

  .trend-chart-svg {
    height: 280px;
  }
  
  .admin-header h1 {
    font-size: 20px;
  }
  
  .stat-value {
    font-size: 20px;
  }
}
</style>


