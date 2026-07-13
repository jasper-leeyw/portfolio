import { DATA } from './data.js?v=3';
import {
  renderHeroTree,
  renderTopicBreakdown,
  renderDailyTimeline,
  renderLeetCode,
  renderFooter,
} from './render.js?v=15';
import { practiceData } from './sample-data.js?v=1';
import { fetchDashboard } from './api.js?v=1';

// Render sample data immediately (page always works), then upgrade to real data
// from the backend if it's available and has solves. The tree's container has no
// data-link here → the trunk is inert (the doorway lives only on the home hero).
function paint(pd) {
  renderHeroTree(pd.treeInput);
  renderTopicBreakdown(pd.topicBreakdown);
  renderDailyTimeline(pd.dailyTimeline);
}

paint(practiceData());
renderLeetCode(DATA.links);
renderFooter(DATA.links);

fetchDashboard().then(paint).catch(() => { /* keep sample data */ });
