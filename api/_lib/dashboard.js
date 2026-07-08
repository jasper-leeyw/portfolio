// Build the tracker's dashboard payload from accumulated solves. The output
// shape is IDENTICAL to the frontend's practiceData() sample, so the UI renders
// it with no changes — swapping fake → real is just a fetch.
//
// solves: [{ slug, title, difficulty, topic, date }] (topic = canonical)
import { CANON } from './topics.js';

function currentStreak(dateSet) {
  let streak = 0;
  const d = new Date();
  if (!dateSet.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (dateSet.has(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

export function buildDashboard(solves) {
  const topics = CANON.map(name => {
    const qs = solves.filter(s => s.topic === name);
    return {
      name,
      e: qs.filter(q => q.difficulty === 'Easy').length,
      m: qs.filter(q => q.difficulty === 'Medium').length,
      h: qs.filter(q => q.difficulty === 'Hard').length,
    };
  });

  const topicBreakdown = CANON.map(name => {
    const qs = solves.filter(s => s.topic === name).sort((a, b) => b.date.localeCompare(a.date));
    return {
      name,
      count: qs.length,
      dorm: qs.length === 0,
      questions: qs.map(q => ({ title: q.title, difficulty: q.difficulty, date: q.date })),
    };
  }).sort((a, b) => (a.dorm - b.dorm) || (b.count - a.count));

  const byDate = {};
  for (const s of solves) (byDate[s.date] = byDate[s.date] || []).push({ title: s.title, difficulty: s.difficulty, topic: s.topic });
  const dailyTimeline = Object.keys(byDate).sort((a, b) => b.localeCompare(a)).map(date => ({ date, items: byDate[date] }));

  const dates = new Set(solves.map(s => s.date));
  const month = new Date().toISOString().slice(0, 7);
  return {
    treeInput: { topics, stats: { streak: currentStreak(dates), month: solves.filter(s => s.date.slice(0, 7) === month).length } },
    topicBreakdown,
    dailyTimeline,
    totalSolved: solves.length,
  };
}
