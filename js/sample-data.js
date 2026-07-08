// Sample practice data for the tracker until the backend (/api/practice/*) is
// built. One entry per solved LeetCode problem, with real titles/difficulties.
// Dates are computed relative to today so the daily view always looks current;
// topics are studied oldest→newest so the timeline tells a chronological story.
// The last four canonical topics have no solves yet → dormant buds in the tree.

const CANON = [
  'Arrays & Hashing', 'Two Pointers', 'Sliding Window', 'Stack', 'Binary Search',
  'Linked List', 'Trees', 'Tries', 'Heap / PQ', 'Backtracking', 'Graphs',
  'Dynamic Programming', 'Greedy', 'Intervals', 'Bit Manipulation', 'Math & Geometry',
];

// [title, difficulty] per covered topic (order = study order, oldest first).
const POOLS = {
  'Arrays & Hashing': [['Two Sum', 'Easy'], ['Contains Duplicate', 'Easy'], ['Valid Anagram', 'Easy'], ['Group Anagrams', 'Medium'], ['Top K Frequent Elements', 'Medium'], ['Product of Array Except Self', 'Medium'], ['Valid Sudoku', 'Medium'], ['Encode and Decode Strings', 'Medium'], ['Longest Consecutive Sequence', 'Medium'], ['Majority Element', 'Easy'], ['Subarray Sum Equals K', 'Medium'], ['Sort Colors', 'Medium']],
  'Two Pointers': [['Valid Palindrome', 'Easy'], ['Two Sum II', 'Medium'], ['3Sum', 'Medium'], ['Container With Most Water', 'Medium'], ['Trapping Rain Water', 'Hard'], ['Remove Duplicates from Sorted Array', 'Easy'], ['4Sum', 'Medium']],
  'Sliding Window': [['Best Time to Buy and Sell Stock', 'Easy'], ['Longest Substring Without Repeating Characters', 'Medium'], ['Longest Repeating Character Replacement', 'Medium'], ['Permutation in String', 'Medium'], ['Minimum Window Substring', 'Hard'], ['Sliding Window Maximum', 'Hard']],
  'Stack': [['Valid Parentheses', 'Easy'], ['Min Stack', 'Medium'], ['Evaluate Reverse Polish Notation', 'Medium'], ['Daily Temperatures', 'Medium'], ['Car Fleet', 'Medium'], ['Generate Parentheses', 'Medium']],
  'Binary Search': [['Binary Search', 'Easy'], ['Search Insert Position', 'Easy'], ['Search a 2D Matrix', 'Medium'], ['Koko Eating Bananas', 'Medium'], ['Find Minimum in Rotated Sorted Array', 'Medium'], ['Search in Rotated Sorted Array', 'Medium'], ['Time Based Key-Value Store', 'Medium'], ['Median of Two Sorted Arrays', 'Hard']],
  'Linked List': [['Reverse Linked List', 'Easy'], ['Merge Two Sorted Lists', 'Easy'], ['Linked List Cycle', 'Easy'], ['Reorder List', 'Medium'], ['Remove Nth Node From End of List', 'Medium'], ['Copy List with Random Pointer', 'Medium'], ['Add Two Numbers', 'Medium']],
  'Trees': [['Invert Binary Tree', 'Easy'], ['Maximum Depth of Binary Tree', 'Easy'], ['Diameter of Binary Tree', 'Easy'], ['Balanced Binary Tree', 'Easy'], ['Same Tree', 'Easy'], ['Subtree of Another Tree', 'Easy'], ['Lowest Common Ancestor of a BST', 'Medium'], ['Binary Tree Level Order Traversal', 'Medium'], ['Validate Binary Search Tree', 'Medium'], ['Kth Smallest Element in a BST', 'Medium']],
  'Tries': [['Implement Trie (Prefix Tree)', 'Medium'], ['Design Add and Search Words', 'Medium'], ['Word Search II', 'Hard']],
  'Heap / PQ': [['Kth Largest Element in a Stream', 'Easy'], ['Last Stone Weight', 'Easy'], ['K Closest Points to Origin', 'Medium'], ['Task Scheduler', 'Medium'], ['Find Median from Data Stream', 'Hard']],
  'Backtracking': [['Subsets', 'Medium'], ['Combination Sum', 'Medium'], ['Permutations', 'Medium'], ['Word Search', 'Medium'], ['Palindrome Partitioning', 'Medium'], ['Letter Combinations of a Phone Number', 'Medium']],
  'Graphs': [['Number of Islands', 'Medium'], ['Clone Graph', 'Medium'], ['Pacific Atlantic Water Flow', 'Medium'], ['Course Schedule', 'Medium'], ['Rotting Oranges', 'Medium'], ['Max Area of Island', 'Medium'], ['Walls and Gates', 'Medium']],
  'Dynamic Programming': [['Climbing Stairs', 'Easy'], ['House Robber', 'Medium'], ['House Robber II', 'Medium'], ['Coin Change', 'Medium'], ['Longest Increasing Subsequence', 'Medium'], ['Word Break', 'Medium'], ['Partition Equal Subset Sum', 'Medium'], ['Longest Common Subsequence', 'Medium'], ['Edit Distance', 'Hard']],
};

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
function isoDaysAgo(daysAgo) { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString().slice(0, 10); }

// Flatten pools into individual solves, oldest topics ~60 days ago → newest today.
export const SOLVES = (() => {
  const out = [];
  let total = 0;
  for (const t of CANON) total += (POOLS[t] || []).length;
  let g = 0;
  for (const topic of CANON) {
    for (const [title, difficulty] of (POOLS[topic] || [])) {
      const base = Math.round(60 * (1 - g / (total - 1)));
      const jitter = ((g * 37) % 5) - 2;
      out.push({ slug: slugify(title), title, difficulty, topic, date: isoDaysAgo(Math.max(0, base + jitter)) });
      g++;
    }
  }
  return out;
})();

function currentStreak(dateSet) {
  let streak = 0;
  const d = new Date();
  if (!dateSet.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (dateSet.has(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

// Everything the tracker UI needs, derived from SOLVES so the tree, the
// per-topic view, and the daily view always agree. Shapes mirror what the
// future /api/practice endpoints will return.
export function practiceData() {
  const bySolvedDesc = (a, b) => b.date.localeCompare(a.date);

  const topics = CANON.map(name => {
    const qs = SOLVES.filter(s => s.topic === name);
    return {
      name,
      e: qs.filter(q => q.difficulty === 'Easy').length,
      m: qs.filter(q => q.difficulty === 'Medium').length,
      h: qs.filter(q => q.difficulty === 'Hard').length,
    };
  });

  const topicBreakdown = CANON.map(name => {
    const qs = SOLVES.filter(s => s.topic === name).sort(bySolvedDesc);
    return {
      name,
      count: qs.length,
      dorm: qs.length === 0,
      questions: qs.map(q => ({ title: q.title, difficulty: q.difficulty, date: q.date })),
    };
  }).sort((a, b) => (a.dorm - b.dorm) || (b.count - a.count));

  const byDate = {};
  for (const s of SOLVES) (byDate[s.date] = byDate[s.date] || []).push({ title: s.title, difficulty: s.difficulty, topic: s.topic });
  const dailyTimeline = Object.keys(byDate).sort((a, b) => b.localeCompare(a))
    .map(date => ({ date, items: byDate[date] }));

  const dates = new Set(SOLVES.map(s => s.date));
  const month = new Date().toISOString().slice(0, 7);
  return {
    treeInput: { topics, stats: { streak: currentStreak(dates), month: SOLVES.filter(s => s.date.slice(0, 7) === month).length } },
    topicBreakdown,
    dailyTimeline,
    totalSolved: SOLVES.length,
  };
}
