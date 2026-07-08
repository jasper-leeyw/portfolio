// Canonical topic taxonomy (NeetCode-150 style) shared by the tree and the
// tracker views, plus a mapping from LeetCode's own topic tags onto it.
export const CANON = [
  'Arrays & Hashing', 'Two Pointers', 'Sliding Window', 'Stack', 'Binary Search',
  'Linked List', 'Trees', 'Tries', 'Heap / PQ', 'Backtracking', 'Graphs',
  'Dynamic Programming', 'Greedy', 'Intervals', 'Bit Manipulation', 'Math & Geometry',
];

// LeetCode tag names that indicate each canonical topic. Checked in this order,
// most-specific first, so e.g. a problem tagged [Array, Two Pointers] maps to
// "Two Pointers" rather than the catch-all "Arrays & Hashing".
const TOPIC_TAGS = [
  ['Dynamic Programming', ['Dynamic Programming', 'Memoization']],
  ['Backtracking', ['Backtracking']],
  ['Graphs', ['Graph', 'Union Find', 'Topological Sort', 'Shortest Path', 'Eulerian Circuit']],
  ['Trees', ['Tree', 'Binary Tree', 'Binary Search Tree', 'Segment Tree', 'Binary Indexed Tree']],
  ['Tries', ['Trie']],
  ['Heap / PQ', ['Heap (Priority Queue)']],
  ['Binary Search', ['Binary Search']],
  ['Sliding Window', ['Sliding Window']],
  ['Two Pointers', ['Two Pointers']],
  ['Stack', ['Stack', 'Monotonic Stack']],
  ['Linked List', ['Linked List']],
  ['Bit Manipulation', ['Bit Manipulation', 'Bitmask']],
  ['Greedy', ['Greedy']],
  ['Math & Geometry', ['Math', 'Geometry', 'Matrix', 'Number Theory']],
  ['Arrays & Hashing', ['Array', 'Hash Table', 'String', 'Counting', 'Prefix Sum', 'Sorting']],
];

// Map a problem's LeetCode topicTags (array of { name }) to a single canonical
// topic. Falls back to "Arrays & Hashing" when nothing matches.
export function mapTags(topicTags) {
  const names = (topicTags || []).map(t => (typeof t === 'string' ? t : t.name));
  for (const [canon, tags] of TOPIC_TAGS) {
    if (tags.some(t => names.includes(t))) return canon;
  }
  return 'Arrays & Hashing';
}
