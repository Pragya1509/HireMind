// frontend/src/pages/StudyMaterial.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudyMaterial.css';

const COMPANIES = [
  {
    id: 'google', name: 'Google', logo: '🔵', color: '#4285F4', bg: '#e8f0fe',
    hq: 'Mountain View, CA', founded: '1998',
    tagline: "Organize the world's information",
    culture: 'Data-driven, innovation-first, psychological safety',
    rounds: ['Phone Screen', 'Technical ×2', 'System Design', 'Googleyness', 'Team Match'],
    tips: "Google loves STAR format for behavioral. Think out loud — interviewers care about your process more than the final answer.",
    categories: {
      'Data Structures & Algorithms': [
        {
          q: 'Given an array of integers, find two numbers such that they add up to a specific target.',
          difficulty: 'Easy', topic: 'Hash Map', asked: '2023', frequency: 'Very High',
          complexity: 'Time: O(n) · Space: O(n)',
          hint: "Store each number's complement (target - num) in a hash map as you iterate. If the current number already exists in the map, you found your pair.",
          approach: 'Single-pass hash map. For each element, check if its complement exists in the map. If yes, return the pair. Otherwise, store the element.',
          fullAnswer: `function twoSum(nums, target) {
  const map = new Map(); // value → index

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];

    if (map.has(complement)) {
      return [map.get(complement), i]; // pair found!
    }

    map.set(nums[i], i); // store current number
  }
  return [];
}

// Examples:
// twoSum([2, 7, 11, 15], 9)  →  [0, 1]   (2 + 7 = 9)
// twoSum([3, 2, 4], 6)       →  [1, 2]   (2 + 4 = 6)
// twoSum([3, 3], 6)           →  [0, 1]

// Why O(n)?
// We make a single pass through the array.
// Each lookup and insert into the Map is O(1) on average.
// Total: O(n) time, O(n) space for the map.`,
        },
        {
          q: "Given a string containing just '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
          difficulty: 'Easy', topic: 'Stack', asked: '2023', frequency: 'High',
          complexity: 'Time: O(n) · Space: O(n)',
          hint: 'Use a stack. Push every opening bracket. When you see a closing bracket, pop from the stack and verify it matches.',
          approach: 'For each char: opening bracket → push to stack. Closing bracket → pop from stack and verify match. Valid if stack is empty at end.',
          fullAnswer: `function isValid(s) {
  const stack = [];
  const match = { ')': '(', '}': '{', ']': '[' };

  for (const char of s) {
    if ('({['.includes(char)) {
      stack.push(char);                    // push opening brackets
    } else {
      if (stack.pop() !== match[char]) {   // closing → verify match
        return false;
      }
    }
  }

  return stack.length === 0; // valid only if nothing leftover
}

// Examples:
// isValid("()")      → true
// isValid("()[]{}")  → true
// isValid("(]")      → false
// isValid("([)]")    → false
// isValid("{[]}")    → true

// Edge cases:
// isValid("")   → true  (empty string is valid)
// isValid("]")  → false (stack.pop() returns undefined ≠ '[')`,
        },
        {
          q: 'Find the longest substring without repeating characters.',
          difficulty: 'Medium', topic: 'Sliding Window', asked: '2023', frequency: 'Very High',
          complexity: 'Time: O(n) · Space: O(k)',
          hint: "Sliding window with two pointers. Expand the right pointer freely. When you hit a duplicate, shrink the window from the left until the duplicate is gone.",
          approach: 'Maintain a window [left, right]. Use a Map to track char → last seen index. On duplicate, jump left to lastSeen + 1. Track max window size.',
          fullAnswer: `function lengthOfLongestSubstring(s) {
  const charIndex = new Map(); // char → most recent index
  let left = 0;
  let maxLen = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];

    // If char is in current window, shrink window from left
    if (charIndex.has(char) && charIndex.get(char) >= left) {
      left = charIndex.get(char) + 1;
    }

    charIndex.set(char, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}

// Examples:
// "abcabcbb"  →  3  ("abc")
// "bbbbb"     →  1  ("b")
// "pwwkew"    →  3  ("wke")
// ""          →  0

// KEY INSIGHT:
// When we find a duplicate, we don't move left one step at a time.
// We jump directly to (lastSeen + 1) — this is O(n), not O(n²).
// The Map tells us exactly where the previous occurrence was.`,
        },
        {
          q: 'Given a binary tree, find the maximum path sum. The path may start and end at any node.',
          difficulty: 'Hard', topic: 'Tree DFS', asked: '2022', frequency: 'High',
          complexity: 'Time: O(n) · Space: O(h)',
          hint: 'At each node you have a choice: use it as a "bridge" (left → node → right) or just pass it upward as one arm. Track a global max. Clamp negative subtree gains to 0.',
          approach: 'Recursive DFS. At each node, compute max gain from left/right (clamped to 0). Update global max with node.val + leftGain + rightGain. Return node.val + max(leftGain, rightGain).',
          fullAnswer: `function maxPathSum(root) {
  let globalMax = -Infinity;

  function dfs(node) {
    if (!node) return 0;

    // Only take a subtree if it contributes positively
    const leftGain  = Math.max(dfs(node.left),  0);
    const rightGain = Math.max(dfs(node.right), 0);

    // This node as the "top" of a path through both children
    const pathThroughNode = node.val + leftGain + rightGain;
    globalMax = Math.max(globalMax, pathThroughNode);

    // Return gain to parent — can only pick ONE side
    return node.val + Math.max(leftGain, rightGain);
  }

  dfs(root);
  return globalMax;
}

// Example:
//        -10
//        /  \\
//       9   20
//           / \\
//          15   7
//
// At node 20: left=15, right=7 → path = 15+20+7 = 42
// globalMax = 42  ✓

// Why clamp to 0?
// If a subtree has negative sum, we're BETTER OFF not including it.
// Math.max(gain, 0) simply skips it.`,
        },
        {
          q: 'Implement an LRU Cache with O(1) get and put operations.',
          difficulty: 'Hard', topic: 'HashMap + LinkedList', asked: '2023', frequency: 'Very High',
          complexity: 'Time: O(1) all · Space: O(capacity)',
          hint: 'Combine a HashMap (O(1) lookup) with a Doubly Linked List (O(1) reorder). Head = most recent, Tail = least recent. Use dummy head/tail to avoid null checks.',
          approach: 'HashMap maps key → node. DLL maintains access order. get: find node, move to head. put: add at head, evict tail if over capacity.',
          fullAnswer: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map  = new Map();
    // Dummy sentinel nodes — avoids null checks
    this.head = { key: 0, val: 0 }; // most recent end
    this.tail = { key: 0, val: 0 }; // least recent end
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  _remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _insertFront(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    const node = this.map.get(key);
    this._remove(node);       // move to front (most recent)
    this._insertFront(node);
    return node.val;
  }

  put(key, val) {
    if (this.map.has(key)) this._remove(this.map.get(key));

    const node = { key, val };
    this._insertFront(node);
    this.map.set(key, node);

    if (this.map.size > this.capacity) {
      const lru = this.tail.prev;   // evict least recently used
      this._remove(lru);
      this.map.delete(lru.key);
    }
  }
}

// Usage:
// const cache = new LRUCache(2);
// cache.put(1, 1);   // {1:1}
// cache.put(2, 2);   // {1:1, 2:2}
// cache.get(1);      // 1, and moves 1 to front
// cache.put(3, 3);   // evicts 2 (LRU) → {1:1, 3:3}
// cache.get(2);      // -1 (was evicted)`,
        },
      ],
      'System Design': [
        {
          q: 'Design Google Search — the crawling, indexing, and ranking pipeline.',
          difficulty: 'Hard', topic: 'Distributed Systems', asked: '2023', frequency: 'High',
          complexity: 'N/A — System Design',
          hint: 'Think in 4 layers: Crawler → Indexer → Ranker → Serving. Each layer has its own data store, scale challenges, and consistency requirements.',
          approach: 'Start with requirements (100B pages, <200ms latency). Design each layer independently, then address cross-cutting concerns (freshness, deduplication, spam).',
          fullAnswer: `GOOGLE SEARCH — SYSTEM DESIGN

━━━ 1. REQUIREMENTS ━━━
  Scale: 100B+ web pages, 8.5B searches/day
  Latency: < 200ms end-to-end
  Freshness: news within minutes, regular pages within days

━━━ 2. CRAWLER ━━━
  Architecture: Distributed BFS with URL frontier (priority queue)
  Priority: based on PageRank, freshness, domain authority
  
  Key challenges:
  • Politeness: respect robots.txt, rate-limit per domain
  • Deduplication: SimHash detects near-duplicate pages
  • DNS caching: avoids re-lookup on every request
  • Scale: 10,000+ crawlers running in parallel
  
  Output: raw HTML → GCS blob storage

━━━ 3. INDEXING PIPELINE ━━━
  Parser: extract text, links, structured data (JSON-LD)
  
  Inverted Index:
    "apple" → [(doc42, pos:[3,17], tf:0.08), (doc99, pos:[1], tf:0.12)]
  
  Forward Index:
    doc42 → { title, url, snippet, pagerank, last_crawled }
  
  Storage: Bigtable for index data, sharded by word hash
  Updates: batch (daily) + incremental (realtime for news)

━━━ 4. RANKING ━━━
  Offline signals (pre-computed):
  • PageRank: iterative graph algorithm over link graph
  • Domain authority, HTTPS, Core Web Vitals
  
  Query-time signals:
  • TF-IDF / BM25: term frequency in document
  • Positional: title match > body match
  • Freshness: exponential decay over time
  
  ML re-ranking (RankBrain / MUM):
  • BERT embeddings for semantic understanding
  • User feedback signals (CTR, dwell time)

━━━ 5. SERVING ━━━
  Query → spell check → query expansion
  → Distributed index lookup (fan-out to 1000s of shards)
  → Top-K merge (each shard returns local top-100)
  → Global re-ranking → snippets → cache → response
  
  Cache (Redis): top 1M queries cover ~80% of traffic
  Cache TTL: 10min for dynamic, 1hr for stable queries

━━━ 6. KEY TRADE-OFFS ━━━
  • Freshness vs cost: crawl popular URLs more frequently
  • Coverage vs quality: spam scoring gates index entry
  • Recall vs precision: query expansion increases recall`,
        },
      ],
      'Behavioral (Googleyness)': [
        {
          q: 'Tell me about a time you disagreed with a team decision. How did you handle it?',
          difficulty: 'Medium', topic: 'Conflict Resolution', asked: '2023', frequency: 'Very High',
          complexity: 'N/A — Behavioral',
          hint: "Google values 'disagree and commit.' Show you raised concerns with data (not just opinion), respected the process, and fully committed after the decision was made.",
          approach: 'STAR format. Data-driven disagreement → genuine attempt to understand other view → graceful alignment. No passive resistance after decision.',
          fullAnswer: `SAMPLE STRONG ANSWER (STAR FORMAT)

SITUATION:
  During sprint planning, our team chose a third-party auth library that I 
  believed had serious security vulnerabilities based on recent CVE disclosures.

TASK:
  Raise my concern without derailing the sprint or seeming obstructionist, 
  while ensuring we don't ship potentially insecure code.

ACTION:
  1. Compiled a 1-page document listing 3 specific CVEs with CVSS scores
  2. Proposed a concrete alternative with a 2-hour validation spike
  3. Acknowledged the valid reasons for their choice (faster integration)
  4. Presented at the next standup — data first, not complaints

  The team discussed it. They decided to keep the original library 
  but add specific input validation layers as mitigation. I disagreed 
  with the final call but I understood the reasoning.

RESULT:
  • I fully committed to implementing the mitigation strategy
  • The discussion led us to add security scanning to our CI pipeline
  • No security incidents in the following 6 months
  • Team retrospective noted the "raise concerns with data" approach
    as a process we wanted to institutionalize

GOOGLEYNESS SIGNALS:
  ✓ Raised concern with evidence, not just intuition
  ✓ Proposed a solution alongside the concern
  ✓ Respected team's final decision completely
  ✓ "Disagree and commit" — turned it into a positive
  ✓ No side-channel complaints or passive resistance`,
        },
        {
          q: 'Describe a project where you had to learn something completely new quickly.',
          difficulty: 'Easy', topic: 'Learning Agility', asked: '2022', frequency: 'High',
          complexity: 'N/A — Behavioral',
          hint: 'Google values growth mindset. Show a structured learning plan — not just "I read the docs." Include what you did in day 1, week 1, and the measurable outcome.',
          approach: 'STAR. Show: identify gaps → prototype fast → seek expert review → ship → document learnings for the team.',
          fullAnswer: `SAMPLE STRONG ANSWER (STAR FORMAT)

SITUATION:
  Three weeks before launch, we needed a real-time WebSocket notification 
  system. I had zero production WebSocket experience.

TASK:
  Build a reliable, scalable WebSocket layer in 2 weeks solo while the 
  rest of the team focused on core features.

ACTION — Structured learning approach:

  Days 1-2: Knowledge gap audit
    → Listed exactly what I didn't know: WS protocol, lifecycle, 
      reconnection handling, Redis Pub/Sub for horizontal scaling.
    → Didn't start coding — mapped the unknowns first.

  Days 3-5: Progressive prototypes
    → Built 3 prototypes: echo server → multi-room chat → our use case
    → Made mistakes FAST in a safe environment
    → Hit memory leaks and dropped connections — understood why

  Days 6-8: Expert review
    → Read Stripe + Slack engineering blogs on WS architecture
    → Found 2 senior engineers on adjacent teams for 30-min reviews

  Days 9-14: Production build
    → Added monitoring, graceful reconnection, load testing (10K conn.)
    → Set measurable acceptance criteria before calling it done

RESULT:
  • Shipped on time. Zero WS-related incidents in the first month.
  • Wrote an internal guide — became the team's reference doc.
  • Used the same approach for 2 subsequent unfamiliar technologies.

KEY SIGNAL:
  Learning was structured, not random. Built → failed → learned → shipped.`,
        },
      ],
    },
  },
  {
    id: 'amazon', name: 'Amazon', logo: '🟠', color: '#FF9900', bg: '#fff3e0',
    hq: 'Seattle, WA', founded: '1994',
    tagline: "Earth's most customer-centric company",
    culture: 'Leadership Principles are everything. Bar Raiser culture.',
    rounds: ['Phone Screen', 'OA (2 hrs)', 'Virtual Loop ×4', 'Bar Raiser'],
    tips: "Every behavioral answer must reference a Leadership Principle. Prepare 3–4 strong STAR stories that flex across multiple LPs.",
    categories: {
      'Data Structures & Algorithms': [
        {
          q: 'Given a list of integers, find the k most frequent elements.',
          difficulty: 'Medium', topic: 'Heap + HashMap', asked: '2023', frequency: 'Very High',
          complexity: 'Time: O(n) bucket · O(n log k) heap · Space: O(n)',
          hint: 'Build a frequency map first, then you need the top-k by frequency. A min-heap of size k keeps only the k largest — pop when size exceeds k.',
          approach: 'Two approaches: (1) Bucket sort — O(n) time using frequency as index. (2) Min-heap size k — O(n log k). Bucket sort is faster but harder to code.',
          fullAnswer: `function topKFrequent(nums, k) {
  // ── Approach 1: Bucket Sort — O(n) time ──
  
  const freq = new Map();
  for (const n of nums) freq.set(n, (freq.get(n) || 0) + 1);

  // bucket[i] = all numbers with frequency i
  const bucket = Array.from({ length: nums.length + 1 }, () => []);
  for (const [num, count] of freq) {
    bucket[count].push(num);
  }

  const result = [];
  for (let i = bucket.length - 1; i >= 0 && result.length < k; i--) {
    result.push(...bucket[i]);
  }
  return result.slice(0, k);
}

// ── Approach 2: Min-Heap — O(n log k) time ──
// Better when k << n and streaming (can't use bucket sort)
function topKFrequentHeap(nums, k) {
  const freq = new Map();
  for (const n of nums) freq.set(n, (freq.get(n) || 0) + 1);

  // Maintain min-heap of size k (by frequency)
  const heap = []; // [count, num]
  for (const [num, count] of freq) {
    heap.push([count, num]);
    heap.sort((a, b) => a[0] - b[0]); // in production: proper heap
    if (heap.length > k) heap.shift(); // pop minimum
  }
  return heap.map(([, num]) => num);
}

// Examples:
// topKFrequent([1,1,1,2,2,3], 2)  →  [1, 2]
// topKFrequent([1], 1)            →  [1]`,
        },
        {
          q: 'Given a 2D grid of 0s and 1s, count the number of islands.',
          difficulty: 'Medium', topic: 'Graph DFS/BFS', asked: '2023', frequency: 'Very High',
          complexity: 'Time: O(m×n) · Space: O(m×n)',
          hint: "When you find a '1', increment counter and use DFS to 'sink' all connected 1s (set to 0). This marks them visited without extra memory.",
          approach: "Iterate the grid. On each '1', increment count, then DFS in 4 directions marking every connected '1' as '0'.",
          fullAnswer: `function numIslands(grid) {
  if (!grid?.length) return 0;

  const rows = grid.length;
  const cols = grid[0].length;
  let count  = 0;

  function dfs(r, c) {
    // Out of bounds or water — stop
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] === '0') {
      return;
    }
    grid[r][c] = '0'; // "sink" this land cell (mark visited)
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        count++;    // new island found
        dfs(r, c); // sink the entire island
      }
    }
  }
  return count;
}

// Example:
// [["1","1","0"],
//  ["0","0","1"],    →  2 islands
//  ["0","0","1"]]

// FOLLOW-UP QUESTIONS AMAZON MIGHT ASK:
// Q: What if modifying input is not allowed?
// A: Use a visited = new Set(), store "r,c" strings.
//
// Q: What if the grid is huge (doesn't fit in memory)?
// A: BFS with explicit queue, avoid deep recursion stack.
//    Process in chunks with external storage for frontier.`,
        },
        {
          q: 'Design a data structure with O(1) insert, delete, and getRandom.',
          difficulty: 'Hard', topic: 'HashMap + Array', asked: '2022', frequency: 'High',
          complexity: 'Time: O(1) all ops · Space: O(n)',
          hint: 'Arrays give O(1) random access. HashMaps give O(1) lookup. The key insight for O(1) delete: swap the target with the last element, update the map, then pop.',
          approach: 'Array stores values. Map stores value → array index. Delete: swap with last + update map + pop. getRandom: random array index.',
          fullAnswer: `class RandomizedSet {
  constructor() {
    this.map = new Map(); // value → index in array
    this.arr = [];        // stores all values
  }

  insert(val) {
    if (this.map.has(val)) return false;
    this.arr.push(val);
    this.map.set(val, this.arr.length - 1);
    return true;
  }

  remove(val) {
    if (!this.map.has(val)) return false;

    const idx     = this.map.get(val);      // index of target
    const lastVal = this.arr[this.arr.length - 1]; // last element

    // Move last element into target's slot
    this.arr[idx] = lastVal;
    this.map.set(lastVal, idx);

    // Remove last slot (now a duplicate)
    this.arr.pop();
    this.map.delete(val);
    return true;
  }

  getRandom() {
    const i = Math.floor(Math.random() * this.arr.length);
    return this.arr[i];
  }
}

// WHY THE SWAP TRICK ENABLES O(1) DELETE:
//
// Normal array delete = O(n) because you shift all elements.
// Swap with last + pop = O(1) — no shifting needed.
// The Map lets us find the index instantly, and update it after the swap.
//
// Edge case: if we're deleting the last element, 
// lastVal === val, the map.set is a no-op before we delete. ✓`,
        },
      ],
      'Amazon Leadership Principles': [
        {
          q: 'Tell me about a time you had to make a difficult decision with incomplete data.',
          difficulty: 'Medium', topic: 'Bias for Action', asked: '2023', frequency: 'Very High',
          complexity: 'N/A — Behavioral',
          hint: "LP #13: Bias for Action — 'Many decisions are reversible.' Show you assessed reversibility, set tripwires, and moved without waiting for perfect information.",
          approach: 'STAR. Show your decision framework: what data you had, how you assessed risk/reversibility, what safeguards you set up, and outcome.',
          fullAnswer: `SAMPLE STRONG ANSWER — Bias for Action

SITUATION:
  3 days before launch, our staging monitoring showed a 15% API latency spike.
  We couldn't reliably reproduce it. 48 hours to decide: delay or ship.

TASK:
  I was the tech lead. The call was mine to make with incomplete information.

ACTION — Decision Framework I applied:

  Step 1 — Reversibility check:
    Could we roll back quickly if issues appeared in production?
    Yes: 30-minute rollback procedure, tested and documented.

  Step 2 — Impact estimate:
    15% latency increase → affects ~3% of users on slow connections.
    Not revenue-critical in the first 48 hours (feature flag, internal).

  Step 3 — Set explicit tripwires:
    Defined EXACT metrics that would auto-trigger rollback:
    • P99 latency > 2s for 5 consecutive minutes
    • Error rate > 0.5%
    • Any 5xx spike > 10/min

  Step 4 — Communicate the risk:
    Wrote a 1-paragraph risk summary sent to PM and stakeholders 
    before launch. No surprises — just transparency.

  Decision: Launch with enhanced monitoring (60s intervals vs normal 5min).

RESULT:
  Latency issue appeared for ~2 hours in prod — turned out to be a 
  third-party CDN issue unrelated to our code. Our tripwires fired. 
  Rollback executed in 22 minutes. Re-launched next morning after CDN fix.

AMAZON LPs DEMONSTRATED:
  ✓ Bias for Action: launched instead of waiting
  ✓ Are Right A Lot: used a framework, not gut feel
  ✓ Ownership: set up safety net proactively
  ✓ Earn Trust: communicated risk before, not after`,
        },
        {
          q: 'Describe a situation where you went above and beyond for a customer.',
          difficulty: 'Easy', topic: 'Customer Obsession (LP #1)', asked: '2023', frequency: 'Very High',
          complexity: 'N/A — Behavioral',
          hint: "LP #1 — the most important LP. Key: you started with the customer, not with the feature. Show proactive empathy — you noticed the pain before they filed a ticket.",
          approach: 'STAR. Show you identified a customer pain proactively, owned the fix end-to-end, talked to real customers (not just analytics), and measured the outcome.',
          fullAnswer: `SAMPLE STRONG ANSWER — Customer Obsession

SITUATION:
  As a backend engineer, I noticed in our analytics that 23% of enterprise 
  customers abandoned our bulk import feature midway. No bug had been filed — 
  they were just silently giving up.

TASK:
  This wasn't in my sprint. But I felt responsible for the customer experience 
  even when they weren't explicitly complaining.

ACTION:
  Step 1 — Talk to actual customers (not just data):
    Reached out via our CS team. 3 of 5 contacted agreed to a 20-min call.
    
  Step 2 — Discover the REAL problem:
    Root cause: import had a hidden 500-row limit.
    Files >500 rows silently dropped the excess — no error, no warning.
    Customers thought the import worked — then found missing records later.

  Step 3 — Fix the right things:
    • Increased limit to 50,000 rows
    • Added pre-import validation (catches formatting errors upfront)
    • Added progress bar with row count
    • Added explicit error if limit was hit
    Shipped in one weekend sprint, no trade-offs on quality.

RESULT:
  • Import completion rate: 77% → 96% within 2 weeks
  • Support tickets for import issues: down 40%
  • 2 customers emailed our CEO directly to thank us
  • The pre-validation logic we wrote is still in use 2 years later

AMAZON SIGNAL:
  ✓ Proactive — no one asked me to fix it
  ✓ Talked to real customers before assuming the solution
  ✓ Worked backwards from customer pain
  ✓ Measured impact`,
        },
      ],
    },
  },
  {
    id: 'meta', name: 'Meta', logo: '🔷', color: '#0866FF', bg: '#e7f3ff',
    hq: 'Menlo Park, CA', founded: '2004',
    tagline: 'Build the future of human connection',
    culture: 'Move fast, be bold, focus on impact. Flat hierarchy.',
    rounds: ['Recruiter Screen', 'Technical Phone', 'Onsite ×4', 'HC Review'],
    tips: "Meta loves graphs, trees, and DP. Every answer should connect to measurable impact. 'Why Meta?' matters — they want mission believers.",
    categories: {
      'Data Structures & Algorithms': [
        {
          q: "Return the level order traversal of a binary tree's nodes' values.",
          difficulty: 'Medium', topic: 'Tree BFS', asked: '2023', frequency: 'Very High',
          complexity: 'Time: O(n) · Space: O(w)',
          hint: "BFS with a queue. The trick for grouping by level: snapshot the queue's size at the start of each iteration — that's exactly how many nodes are on the current level.",
          approach: 'Initialize queue with root. Snapshot size = current level count. Process exactly that many nodes, enqueue children. Push level array to result.',
          fullAnswer: `function levelOrder(root) {
  if (!root) return [];

  const result = [];
  const queue  = [root];

  while (queue.length > 0) {
    const levelSize = queue.length; // ← snapshot: current level width
    const level = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left)  queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(level);
  }

  return result;
}

// Example:
//       3
//      / \\
//     9  20
//        / \\
//       15   7
//
// Output: [[3], [9, 20], [15, 7]]

// VARIANTS META MIGHT ASK:
// • Zigzag level order (alternate left-right each level)
//   → Just reverse every other level before pushing
// • Right side view (last node of each level)
//   → Push only level[level.length - 1]
// • Average of levels → mean of each level array

// Performance note:
// queue.shift() is O(n) in JS. For large trees, use
// an index pointer instead of shift for O(1) dequeue.`,
        },
        {
          q: 'Detect if a linked list has a cycle.',
          difficulty: 'Easy', topic: "Two Pointers (Floyd's)", asked: '2023', frequency: 'High',
          complexity: 'Time: O(n) · Space: O(1)',
          hint: "Floyd's Tortoise and Hare: slow moves 1 step, fast moves 2. If a cycle exists, fast will eventually lap slow and they'll meet. If no cycle, fast exits.",
          approach: 'Two pointers at head. slow += 1, fast += 2. If they meet → cycle. If fast reaches null → no cycle.',
          fullAnswer: `// PART 1: Does a cycle exist?
function hasCycle(head) {
  let slow = head;
  let fast = head;

  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true; // they met — cycle!
  }

  return false; // fast exited — no cycle
}

// PART 2: Where does the cycle start? (Floyd's Algorithm Part 2)
function detectCycle(head) {
  let slow = head, fast = head;

  // Phase 1: find meeting point
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) break;
  }

  if (!fast || !fast.next) return null; // no cycle

  // Phase 2: find cycle start
  // Reset slow to head, keep fast at meeting point.
  // Both move 1 step — they meet EXACTLY at the cycle start.
  slow = head;
  while (slow !== fast) {
    slow = slow.next;
    fast = fast.next;
  }
  return slow; // cycle start node
}

// WHY PHASE 2 WORKS:
// If meeting point is k steps into the cycle, and the cycle
// starts at distance d from head, then d ≡ k (mod cycle_length).
// So resetting slow to head and moving both at speed 1 means
// they travel the same distance d to reach the cycle start.`,
        },
        {
          q: 'Generate all combinations of well-formed parentheses given n pairs.',
          difficulty: 'Medium', topic: 'Backtracking', asked: '2022', frequency: 'High',
          complexity: 'Time: O(4ⁿ/√n) · Space: O(n)',
          hint: "You can add '(' if open < n. You can add ')' if close < open. These two rules together guarantee all outputs are valid — no post-validation needed.",
          approach: 'Recursive backtracking with open_count and close_count. Base: string length = 2n. Branch: add ( if open < n, add ) if close < open.',
          fullAnswer: `function generateParenthesis(n) {
  const result = [];

  function backtrack(current, open, close) {
    if (current.length === 2 * n) {
      result.push(current);
      return;
    }

    if (open < n) {
      backtrack(current + '(', open + 1, close); // add opening
    }
    if (close < open) {
      backtrack(current + ')', open, close + 1); // add closing
    }
  }

  backtrack('', 0, 0);
  return result;
}

// generateParenthesis(3):
// ["((()))","(()())","(())()","()(())","()()()"]

// WHY THE CONDITIONS ENSURE VALIDITY:
//   open  < n     → we still have ( to place
//   close < open  → we have more opens than closes, safe to close
//   These two rules together mean we NEVER build an invalid string.
//   No need to validate after the fact.

// COUNT: outputs = Catalan(n) = C(2n,n)/(n+1)
//   n=1: 1    n=2: 2    n=3: 5    n=4: 14    n=5: 42

// FOLLOW-UP: Generate all valid bracket combinations
// with k types of brackets → same approach, just 2k choices
// at each step, same validity constraints per pair.`,
        },
      ],
      'System Design': [
        {
          q: 'Design Facebook News Feed — personalized feed generation and serving at scale.',
          difficulty: 'Hard', topic: 'Feed Generation + Ranking', asked: '2023', frequency: 'Very High',
          complexity: 'N/A — System Design',
          hint: 'Core tension: fan-out on write (push to all followers when you post) vs fan-out on read (pull from all friends when you open the app). Each has pros and cons. Think about celebrities.',
          approach: 'Hybrid: push for regular users, pull for celebrities. ML ranking layer. Redis cache for feeds. Cursor-based pagination.',
          fullAnswer: `FACEBOOK NEWS FEED — SYSTEM DESIGN

━━━ 1. REQUIREMENTS ━━━
  3B+ users, avg 300 friends each
  Feed: personalized, ranked, fresh, < 500ms P99

━━━ 2. FEED GENERATION ━━━

  Fan-out on Write (Push Model):
  → When Alice posts, push to ALL her friends' feed caches
  ✓ Fast reads — just fetch from Redis
  ✗ Expensive: if Alice has 100M followers, 100M writes per post

  Fan-out on Read (Pull Model):
  → When Bob opens feed, pull from all his friends' timelines
  ✓ Cheap writes
  ✗ Slow reads — must query N friend timelines and merge

  HYBRID (Meta's actual approach):
  • Regular users (< 10K followers)  → fan-out on write
  • Celebrities (Cristiano: 600M)    → fan-out on read
  • Inactive users (> 30 days)       → no pre-computed feed

━━━ 3. RANKING PIPELINE ━━━
  1000s of candidate posts → ML Scorer → Top 50 posts shown

  Ranking signals:
  • Affinity score: frequency of interactions with this person
  • Content type: video > photo > link > text (historically)
  • Recency: exponential time decay
  • Post performance: early reaction/comment velocity
  • Negative signals: hide, report, unfollow (strong downranks)

━━━ 4. DATA STORAGE ━━━
  Posts:       MySQL sharded by userID
  Timelines:   Cassandra (high write throughput)
  Feed cache:  Redis sorted set (score = timestamp + rank)
  Media:       Blob storage (S3) + CDN for images/video

━━━ 5. SERVING FLOW ━━━
  User opens feed
  → Auth + load user context (friends, settings)
  → Fetch from Redis feed cache
  → On cache miss: query Cassandra + recompute
  → Ranking model scores candidates
  → Apply business rules (dedup, content diversity)
  → Return paginated feed with cursor

━━━ 6. PAGINATION ━━━
  Cursor-based (NOT offset):
  Cursor = {last_seen_post_id, timestamp}
  
  Why not offset?
  Offset breaks when new posts arrive mid-scroll.
  Cursor is stable — always picks up exactly where you left off.`,
        },
      ],
      'Behavioral': [
        {
          q: 'Tell me about a time you had significant impact with limited resources.',
          difficulty: 'Medium', topic: 'Impact + Leverage', asked: '2023', frequency: 'High',
          complexity: 'N/A — Behavioral',
          hint: "Meta values 'impact per unit of resource.' Show leverage — outsized results relative to the time/people/budget you had. Show you built tools, not just delivered features.",
          approach: 'STAR. Quantify both the constraint and the outcome. Show where you found leverage — tooling, automation, reuse — not just heroic effort.',
          fullAnswer: `SAMPLE STRONG ANSWER

SITUATION:
  We needed to migrate 40M user records to a new DB schema 
  before a compliance deadline in 6 weeks. Typical estimate: 
  team of 4, 8 weeks. I was the only engineer assigned.

TASK:
  Deliver the migration solo, on time, without prod downtime.

ACTION — where I found leverage:

  1. Automated the code generation:
     Built a migration script generator from schema diffs.
     Turned a 2-week manual task → 2-day automated one.

  2. Smart batching:
     Migrated 10K records/batch with CPU-based backpressure.
     DB load stayed flat — no impact on live users.

  3. Zero-downtime strategy:
     Migrated on read replica → verified integrity → promoted.
     No maintenance window needed.

  4. Dual-write safety net:
     Kept dual-write active 2 weeks post-migration.
     Rollback window: 15 minutes if anything went wrong.

RESULT:
  • Completed in 3.5 weeks (vs 8 weeks estimated for a team of 4)
  • 5 days before the compliance deadline
  • 0 production incidents, 0 data loss
  • Migration scripts adopted as team standard —
    used for 3 subsequent migrations without modification

META SIGNALS:
  ✓ Outsized impact with minimal resources
  ✓ Built leverage through tooling, not just effort
  ✓ Systematic approach — not heroics
  ✓ Created institutional value beyond the immediate task`,
        },
      ],
    },
  },
  {
    id: 'apple', name: 'Apple', logo: '🍎', color: '#1d1d1f', bg: '#f5f5f7',
    hq: 'Cupertino, CA', founded: '1976',
    tagline: 'Think different',
    culture: 'Craft obsession, deep ownership, secrecy, attention to detail.',
    rounds: ['Recruiter Screen', 'Technical Screen', 'Team Onsite ×4', 'Executive Round'],
    tips: "Know your domain cold — Apple wants deep experts. Quality over velocity. They want people who lose sleep over imperfect products.",
    categories: {
      'Data Structures & Algorithms': [
        {
          q: 'Find the median of two sorted arrays in O(log(m+n)) time.',
          difficulty: 'Hard', topic: 'Binary Search', asked: '2023', frequency: 'High',
          complexity: 'Time: O(log(min(m,n))) · Space: O(1)',
          hint: 'Binary search on the SMALLER array for a partition point where left half ≤ right half across both arrays combined.',
          approach: 'Binary search on smaller array. At each partition, check if max(leftX, leftY) ≤ min(rightX, rightY). Adjust search range based on comparison.',
          fullAnswer: `function findMedianSortedArrays(nums1, nums2) {
  if (nums1.length > nums2.length) {
    return findMedianSortedArrays(nums2, nums1); // always search smaller
  }

  const m = nums1.length, n = nums2.length;
  let lo = 0, hi = m;

  while (lo <= hi) {
    const partX = Math.floor((lo + hi) / 2);
    const partY = Math.floor((m + n + 1) / 2) - partX;

    const maxLeftX  = partX === 0 ? -Infinity : nums1[partX - 1];
    const minRightX = partX === m ?  Infinity : nums1[partX];
    const maxLeftY  = partY === 0 ? -Infinity : nums2[partY - 1];
    const minRightY = partY === n ?  Infinity : nums2[partY];

    if (maxLeftX <= minRightY && maxLeftY <= minRightX) {
      // ✓ Correct partition
      if ((m + n) % 2 === 1) {
        return Math.max(maxLeftX, maxLeftY);
      }
      return (Math.max(maxLeftX, maxLeftY) + Math.min(minRightX, minRightY)) / 2;

    } else if (maxLeftX > minRightY) {
      hi = partX - 1; // too many elements from nums1 on left
    } else {
      lo = partX + 1; // too few elements from nums1 on left
    }
  }
}

// Examples:
// [1,3] + [2]   →  2.0
// [1,2] + [3,4] →  2.5

// KEY INSIGHT:
// We're looking for a partition where:
//   combined left half has exactly (m+n+1)/2 elements
//   max(left halves) ≤ min(right halves)
// Binary search finds this in O(log(min(m,n))).`,
        },
        {
          q: 'Merge k sorted linked lists and return as one sorted list.',
          difficulty: 'Hard', topic: 'Min-Heap', asked: '2022', frequency: 'High',
          complexity: 'Time: O(N log k) · Space: O(k)',
          hint: 'A min-heap of size k always gives you the global minimum across all lists in O(log k). Pop minimum, advance that list, push the next node.',
          approach: 'Push first node of each list into min-heap (by value). Pop min → append to result → push that node\'s next. Repeat until heap empty.',
          fullAnswer: `function mergeKLists(lists) {
  const heap = new MinHeap();

  // Initialize with the first node from each list
  for (const head of lists) {
    if (head) heap.push(head);
  }

  const dummy = new ListNode(0);
  let curr = dummy;

  while (!heap.isEmpty()) {
    const node = heap.pop(); // extract global minimum
    curr.next = node;
    curr = curr.next;
    if (node.next) heap.push(node.next); // advance this list
  }

  return dummy.next;
}

// ── MinHeap Implementation ──
class MinHeap {
  constructor() { this.h = []; }
  push(node) { this.h.push(node); this._up(this.h.length - 1); }
  pop() {
    const min = this.h[0];
    const last = this.h.pop();
    if (this.h.length) { this.h[0] = last; this._down(0); }
    return min;
  }
  isEmpty() { return this.h.length === 0; }
  _up(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.h[p].val > this.h[i].val) {
        [this.h[p], this.h[i]] = [this.h[i], this.h[p]]; i = p;
      } else break;
    }
  }
  _down(i) {
    const n = this.h.length;
    while (true) {
      let s = i, l = 2*i+1, r = 2*i+2;
      if (l < n && this.h[l].val < this.h[s].val) s = l;
      if (r < n && this.h[r].val < this.h[s].val) s = r;
      if (s === i) break;
      [this.h[s], this.h[i]] = [this.h[i], this.h[s]]; i = s;
    }
  }
}

// COMPLEXITY ANALYSIS:
// N = total nodes across all lists
// k = number of lists
// Each node: 1 push + 1 pop from heap = 2 × O(log k)
// Total: O(N log k) time, O(k) space for heap`,
        },
      ],
      'Behavioral': [
        {
          q: 'Describe a project where you cared deeply about quality and how that impacted the outcome.',
          difficulty: 'Medium', topic: 'Craft + Excellence', asked: '2023', frequency: 'Very High',
          complexity: 'N/A — Behavioral',
          hint: "Apple's entire brand is craftsmanship. Show you noticed imperfection others would have shipped, invested in the details that matter to users, and that it made a measurable difference.",
          approach: 'STAR. Show specific quality standards held under pressure, tested with real users (not just gut feel), and measurable impact.',
          fullAnswer: `SAMPLE STRONG ANSWER — Apple "Craft" Signal

SITUATION:
  I was building the onboarding flow for a mobile app.
  We had a working version ready 2 weeks before launch.
  Technically "done." But after testing with 5 real users, 
  everyone hesitated 2–3 seconds at step 3 of 6.

TASK:
  Ship vs. fix. The hesitation was brief — task still completed.
  But I knew that moment of confusion is where users decide 
  if an app "feels right."

ACTION:
  I ran a diagnostic instead of just shipping:
  
  Found: step 3 had a tap affordance that looked swipeable.
  Users were reading "swipe" when the intent was "tap."

  Iterated on 4 solutions, tested each with 3 users:
  1. Micro-animation on the tap target (winner)
  2. Haptic feedback on hover (paired with #1)
  3. Rewrote CTA: "Continue" → "Tap to continue"
  4. 400ms animation delay so CTA appeared AFTER content was read

  Total extra investment: 6 hours.

RESULT:
  • Follow-up user test: 4/5 tapped within 1 second, no hesitation
  • Day 1 retention post-launch: 68% vs. 45% industry benchmark
  • 12 of the first 50 App Store reviews mentioned "smooth onboarding"
  • Two enterprise customers cited the onboarding in their signup decision
    — said it "felt like an Apple app"

APPLE SIGNALS:
  ✓ Noticed imperfection others would have shipped
  ✓ Tested with REAL users, not just internal opinion
  ✓ Invested in the detail that created the lasting impression
  ✓ The extra 6 hours drove measurable business outcome`,
        },
      ],
    },
  },
  {
    id: 'netflix', name: 'Netflix', logo: '🔴', color: '#E50914', bg: '#fff0f0',
    hq: 'Los Gatos, CA', founded: '1997',
    tagline: 'Entertain the world',
    culture: 'Freedom & Responsibility. High performance. No brilliant jerks. Radical candor.',
    rounds: ['Recruiter Call', 'HM Screen', 'Technical Screen', 'Onsite ×4'],
    tips: "Culture fit is paramount — they hire 'stunning colleagues.' Be radically candid. Ready to openly discuss your mistakes. They value judgment over process.",
    categories: {
      'Data Structures & Algorithms': [
        {
          q: 'Given a stream of integers, find the running median after each element is added.',
          difficulty: 'Hard', topic: 'Two Heaps', asked: '2023', frequency: 'High',
          complexity: 'addNum: O(log n) · findMedian: O(1)',
          hint: 'Lower half in a max-heap, upper half in a min-heap. Keep them balanced (size diff ≤ 1). The median is always at the top(s).',
          approach: 'Add to lower (max-heap). Rebalance if max(lower) > min(upper). Then rebalance sizes if they differ by more than 1. Median = top of larger or avg of both tops.',
          fullAnswer: `class MedianFinder {
  constructor() {
    this.lower = new MaxHeap(); // lower half: smaller numbers
    this.upper = new MinHeap(); // upper half: larger numbers
  }

  addNum(num) {
    // Always add to lower half first
    this.lower.push(num);

    // Maintain invariant: max(lower) ≤ min(upper)
    if (this.lower.peek() > this.upper.peek()) {
      this.upper.push(this.lower.pop());
    }

    // Maintain size balance: |lower.size - upper.size| ≤ 1
    if (this.lower.size() < this.upper.size()) {
      this.lower.push(this.upper.pop());
    } else if (this.lower.size() > this.upper.size() + 1) {
      this.upper.push(this.lower.pop());
    }
  }

  findMedian() {
    if (this.lower.size() > this.upper.size()) {
      return this.lower.peek(); // odd total → larger heap has median
    }
    return (this.lower.peek() + this.upper.peek()) / 2; // even → average
  }
}

// Walkthrough:
// add(1): lower=[1]     upper=[]     → median = 1
// add(2): lower=[1]     upper=[2]    → median = 1.5
// add(3): lower=[1,2]   upper=[3]    → median = 2
// add(4): lower=[1,2]   upper=[3,4]  → median = 2.5
// add(5): lower=[1,2,3] upper=[4,5]  → median = 3

// INVARIANTS:
// 1. All lower ≤ all upper     (ordering invariant)
// 2. |lower.size - upper.size| ≤ 1  (balance invariant)
// These two together mean the median is always at the top(s).`,
        },
        {
          q: 'Given meeting time intervals, find the minimum number of conference rooms required.',
          difficulty: 'Medium', topic: 'Greedy + Min-Heap', asked: '2023', frequency: 'High',
          complexity: 'Time: O(n log n) · Space: O(n)',
          hint: "Sort meetings by start time. Min-heap tracks end times of currently running meetings. For each new meeting: if the earliest-ending room finishes before this meeting starts, reuse that room.",
          approach: 'Sort by start. Min-heap of end times. For each interval: if heap.top ≤ start time, pop (room is free). Push current end time. Answer = heap size.',
          fullAnswer: `function minMeetingRooms(intervals) {
  if (!intervals.length) return 0;

  // Sort by start time
  intervals.sort((a, b) => a[0] - b[0]);

  // Min-heap stores end times of ongoing meetings
  // heap[0] = meeting that ends soonest
  const endTimes = []; // we'll simulate a min-heap with a sorted array

  for (const [start, end] of intervals) {
    endTimes.sort((a, b) => a - b); // in production: use proper heap

    if (endTimes.length > 0 && endTimes[0] <= start) {
      endTimes.shift(); // room is free — reuse it
    }
    endTimes.push(end); // assign meeting to a room
  }

  return endTimes.length; // rooms currently in use
}

// Example:
// [[0,30],[5,10],[15,20]]
//
// Sort:    [0,30], [5,10], [15,20]
// [0,30]:  endTimes=[30]        → 1 room
// [5,10]:  30 > 5, no free room → endTimes=[10,30] → 2 rooms
// [15,20]: 10 ≤ 15, reuse!     → endTimes=[20,30] → 2 rooms
//
// Answer: 2

// GREEDY INTUITION:
// We only care about whether ANY room is available.
// The "best" room to reuse = the one ending soonest.
// That's exactly what a min-heap gives us: O(log n) per operation.
//
// Full O(n log n) solution uses a proper MinHeap —
// describe this in interviews, implement if asked.`,
        },
      ],
      'System Design': [
        {
          q: "Design Netflix's video streaming service — content delivery and adaptive bitrate.",
          difficulty: 'Hard', topic: 'CDN + Adaptive Streaming', asked: '2023', frequency: 'Very High',
          complexity: 'N/A — System Design',
          hint: "Think: how does a 4K movie get from Netflix's servers to your TV in under 2 seconds? The answer is: transcoding pipeline + CDN geography + client-side ABR algorithm.",
          approach: "Encode pipeline (ingest → transcode multiple qualities/codecs) → Open Connect CDN → client HLS/DASH manifest → client-side ABR adjusts quality to bandwidth.",
          fullAnswer: `NETFLIX STREAMING — SYSTEM DESIGN

━━━ 1. SCALE ━━━
  238M subscribers, 190 countries
  15% of global internet traffic at peak
  15,000+ titles, each stored in 20+ formats

━━━ 2. CONTENT INGESTION PIPELINE ━━━
  Studio delivers 4K RAW master (50–200 GB)
  ↓
  Quality check (automated + manual)
  ↓
  Transcoding to 20+ output formats per title:
    Resolutions:  240p, 480p, 720p, 1080p, 4K UHD
    Codecs:       H.264 (compatibility), H.265, VP9, AV1
    HDR:          HDR10, Dolby Vision
    Audio:        stereo, 5.1, Dolby Atmos
    Subtitles:    20+ language tracks

  Per-Scene Encoding (Netflix innovation):
    Action scenes → higher bitrate (lots of motion)
    Simple scenes → lower bitrate (credits, static shots)
    Result: 20% smaller files at same visual quality

━━━ 3. STORAGE + CDN ━━━
  Netflix built Open Connect (their own CDN):
    17,000+ servers in 158 countries
    Top ~1,000 titles proactively pushed to all edges
    Long-tail titles: pull-on-demand + regional caches

━━━ 4. ADAPTIVE BITRATE (ABR) STREAMING ━━━
  Format: MPEG-DASH or HLS
    Video split into 2–6 second segments
    Manifest file lists all quality levels + segment URLs

  Client Algorithm (BOLA / MPC at Netflix):
  Every ~2 seconds the client:
    1. Measures current download throughput
    2. Checks playback buffer (seconds ahead)
    3. Selects quality for next segment:
       • High bandwidth + full buffer  → step UP quality
       • Low bandwidth or thin buffer  → step DOWN quality

  Buffer target: maintain 15–30 seconds ahead
  Hysteresis: avoid switching quality too frequently (distracting)

━━━ 5. SERVING FLOW ━━━
  User presses Play
  → Auth service validates session
  → Playback service generates signed manifest URL
  → Steering service selects best Open Connect node
     (factors: user location, server load, title cached?)
  → Client fetches manifest → begins ABR playback

━━━ 6. RESILIENCE ━━━
  Chaos Monkey: randomly kills prod instances to test recovery
  Hystrix: circuit breakers on every inter-service call
  Fallback: central AWS servers if CDN unavailable`,
        },
      ],
      'Behavioral': [
        {
          q: 'Tell me about a time you gave or received difficult feedback.',
          difficulty: 'Medium', topic: 'Radical Candor', asked: '2023', frequency: 'Very High',
          complexity: 'N/A — Behavioral',
          hint: "Netflix's culture is radical candor — direct, specific, timely. Not softened. Not via annual reviews. Not as 'some people feel.' Show you can both give and receive truth gracefully.",
          approach: 'STAR. Show: specific behavior described (not personality), timely (not months later), care for the person alongside the directness, and behavioral change that resulted.',
          fullAnswer: `SAMPLE STRONG ANSWER — Giving Difficult Feedback

SITUATION:
  A senior engineer consistently dominated design reviews.
  He'd interrupt before others finished speaking and dismiss 
  ideas before the slides loaded. Two junior engineers had 
  privately told me they'd stopped contributing.

TASK:
  Address this directly. I was the tech lead — this was my job.
  The team's psychological safety was degrading.

ACTION:
  I scheduled a 1:1 the same week (not the next review cycle).

  I was direct:
  "I want to give you feedback because I respect you and want 
  you to succeed here. In the last 3 design reviews, you 
  interrupted [name] at least 4 times before she finished. 
  Last Tuesday you said 'that won't work' before the slide 
  finished loading. I've noticed two engineers have stopped 
  contributing in those sessions. I don't think you realize 
  you're doing it."

  I didn't soften it into a question.
  I didn't say "some people feel."
  I named specific behaviors with specific examples.

  He was quiet, then: "I didn't realize it was that visible."
  
  I suggested one concrete change:
  Wait 5 full seconds before responding in design reviews.

RESULT:
  • Next two reviews: noticeably different. He explicitly 
    invited quieter members to speak first.
  • One junior engineer thanked me — said she finally felt 
    heard in meetings.
  • He later told me it was the most useful feedback he'd 
    received in years — because it was specific and direct.

NETFLIX SIGNALS:
  ✓ Timely: same week, not months later
  ✓ Specific: named behaviors, not personality
  ✓ Direct: no softening, no passive voice
  ✓ Caring: delivered with respect, not judgment
  ✓ Resulted in real behavioral change`,
        },
      ],
    },
  },
];

const DIFF = {
  Easy:   { color: '#166534', bg: '#dcfce7', border: '#86efac' },
  Medium: { color: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
  Hard:   { color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
};
const FREQ = { 'Very High': '🔥🔥🔥', 'High': '🔥🔥', 'Medium': '🔥', 'Low': '⚡' };

export default function StudyMaterial() {
  const navigate = useNavigate();
  const [activeCompany, setActiveCompany] = useState('google');
  const [activeCat, setActiveCat]         = useState(null);
  const [expandedQ, setExpandedQ]         = useState(null);
  const [showHint, setShowHint]           = useState({});
  const [showApproach, setShowApproach]   = useState({});
  const [showAnswer, setShowAnswer]       = useState({});
  const [bookmarked, setBookmarked]       = useState({});
  const [solved, setSolved]               = useState({});
  const [diffFilter, setDiffFilter]       = useState('All');
  const [search, setSearch]               = useState('');

  const company   = COMPANIES.find(c => c.id === activeCompany);
  const cats      = Object.keys(company.categories);
  const cat       = activeCat || cats[0];
  const questions = company.categories[cat] || [];

  const filtered = questions.filter(q => {
    const md = diffFilter === 'All' || q.difficulty === diffFilter;
    const ms = !search || q.q.toLowerCase().includes(search.toLowerCase()) || q.topic.toLowerCase().includes(search.toLowerCase());
    return md && ms;
  });

  const totalQ   = COMPANIES.reduce((s, c) => s + Object.values(c.categories).flat().length, 0);
  const solvedCt = Object.values(solved).filter(Boolean).length;
  const bkCt     = Object.values(bookmarked).filter(Boolean).length;
  const tog      = (set, key) => set(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="sm-root">

      <header className="sm-nav">
        <button className="sm-back" onClick={() => navigate('/candidate-dashboard')}>← Dashboard</button>
        <div className="sm-nav-brand">
          <span className="sm-nav-icon">📚</span>
          <div>
            <div className="sm-nav-title">Study Material</div>
            <div className="sm-nav-sub">FAANG / MAANG Interview Prep</div>
          </div>
        </div>
        <div className="sm-nav-right">
          <span className="sm-pill green">✓ {solvedCt} solved</span>
          <span className="sm-pill amber">🔖 {bkCt} saved</span>
        </div>
      </header>

      <div className="sm-body">
        <aside className="sm-sidebar">
          <p className="sm-s-label">Companies</p>
          {COMPANIES.map(c => (
            <button key={c.id}
              className={`sm-co ${activeCompany === c.id ? 'active' : ''}`}
              style={{ '--cc': c.color, '--cb': c.bg }}
              onClick={() => { setActiveCompany(c.id); setActiveCat(null); setExpandedQ(null); setSearch(''); setDiffFilter('All'); }}
            >
              <span className="sm-co-logo">{c.logo}</span>
              <div>
                <div className="sm-co-name">{c.name}</div>
                <div className="sm-co-ct">{Object.values(c.categories).flat().length} questions</div>
              </div>
              {activeCompany === c.id && <span className="sm-co-bar" />}
            </button>
          ))}
          <div className="sm-s-sep" />
          <p className="sm-s-label">Your Stats</p>
          <div className="sm-s-stat"><span>✅ Solved</span><strong>{solvedCt}</strong></div>
          <div className="sm-s-stat"><span>🔖 Saved</span><strong>{bkCt}</strong></div>
          <div className="sm-s-stat"><span>📊 Total Qs</span><strong>{totalQ}</strong></div>
        </aside>

        <main className="sm-main">
          {/* Company hero */}
          <div className="sm-hero" style={{ '--cc': company.color, '--cb': company.bg }}>
            <div className="sm-hero-logo">{company.logo}</div>
            <div className="sm-hero-content">
              <h1 className="sm-hero-name">{company.name}</h1>
              <p className="sm-hero-tagline">"{company.tagline}"</p>
              <div className="sm-hero-meta">
                <span>📍 {company.hq}</span>
                <span>🏢 Est. {company.founded}</span>
              </div>
              <div className="sm-rounds">
                {company.rounds.map((r, i) => (
                  <span key={i} className="sm-round">{i > 0 && <em>→</em>} {r}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Culture + tip */}
          <div className="sm-cards-row">
            <div className="sm-info-card culture">
              <div className="sm-info-icon">🏛️</div>
              <div><div className="sm-info-label">Culture</div><p>{company.culture}</p></div>
            </div>
            <div className="sm-info-card tip">
              <div className="sm-info-icon">💡</div>
              <div><div className="sm-info-label">Interview Tip</div><p>{company.tips}</p></div>
            </div>
          </div>

          {/* Tabs */}
          <div className="sm-tabs">
            {cats.map(c => (
              <button key={c} className={`sm-tab ${cat === c ? 'active' : ''}`}
                style={{ '--cc': company.color }}
                onClick={() => { setActiveCat(c); setExpandedQ(null); setSearch(''); setDiffFilter('All'); }}>
                {c} <span className="sm-tab-n">{company.categories[c].length}</span>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="sm-filters">
            <div className="sm-search-wrap">
              <span>🔍</span>
              <input className="sm-search" placeholder="Search questions or topics…"
                value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button className="sm-clr" onClick={() => setSearch('')}>✕</button>}
            </div>
            <div className="sm-diffs">
              {['All','Easy','Medium','Hard'].map(d => (
                <button key={d} className={`sm-df ${diffFilter === d ? 'on' : ''}`}
                  style={diffFilter === d && d !== 'All' ? { background: DIFF[d]?.bg, color: DIFF[d]?.color, borderColor: DIFF[d]?.border } : {}}
                  onClick={() => setDiffFilter(d)}>{d}
                </button>
              ))}
            </div>
            <span className="sm-ct-lbl">{filtered.length} questions</span>
          </div>

          {/* Questions */}
          <div className="sm-ql">
            {!filtered.length && <div className="sm-empty">🔍 No questions match your filter.</div>}
            {filtered.map((q, i) => {
              const key  = `${company.id}-${cat}-${i}`;
              const open = expandedQ === key;
              const d    = DIFF[q.difficulty];
              return (
                <article key={key} className={`sm-qc ${open ? 'open' : ''} ${solved[key] ? 'done' : ''}`}>
                  <div className="sm-qc-top" onClick={() => setExpandedQ(open ? null : key)}>
                    <button className={`sm-cb ${solved[key] ? 'checked' : ''}`}
                      onClick={e => { e.stopPropagation(); tog(setSolved, key); }}>
                      {solved[key] ? '✓' : ''}
                    </button>
                    <div className="sm-qc-mid">
                      <p className="sm-q-text">{q.q}</p>
                      <div className="sm-q-meta">
                        <span className="sm-tag topic">{q.topic}</span>
                        <span className="sm-tag diff" style={{ background: d.bg, color: d.color, borderColor: d.border }}>{q.difficulty}</span>
                        <span className="sm-tag freq">{FREQ[q.frequency]}</span>
                        <span className="sm-tag year">Asked {q.asked}</span>
                        {q.complexity !== 'N/A — Behavioral' && q.complexity !== 'N/A — System Design' && (
                          <span className="sm-tag complex">{q.complexity}</span>
                        )}
                      </div>
                    </div>
                    <div className="sm-qc-right">
                      <button className={`sm-bk-btn ${bookmarked[key] ? 'on' : ''}`}
                        onClick={e => { e.stopPropagation(); tog(setBookmarked, key); }}>
                        {bookmarked[key] ? '🔖' : '🏷️'}
                      </button>
                      <span className="sm-chev">{open ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {open && (
                    <div className="sm-qc-body">
                      <div className="sm-reveal-row">
                        <button className="sm-rev hint" onClick={() => tog(setShowHint, key)}>
                          {showHint[key] ? '🙈 Hide Hint' : '💡 Hint'}
                        </button>
                        <button className="sm-rev approach" onClick={() => tog(setShowApproach, key)}>
                          {showApproach[key] ? '🙈 Hide Approach' : '🗺️ Approach'}
                        </button>
                        <button className="sm-rev answer" onClick={() => tog(setShowAnswer, key)}>
                          {showAnswer[key] ? '🙈 Hide Answer' : '📖 Full Answer'}
                        </button>
                      </div>

                      {showHint[key] && (
                        <div className="sm-box hint-box">
                          <div className="sm-box-lbl">💡 Hint</div>
                          <p>{q.hint}</p>
                        </div>
                      )}
                      {showApproach[key] && (
                        <div className="sm-box approach-box">
                          <div className="sm-box-lbl">🗺️ Approach</div>
                          <p>{q.approach}</p>
                        </div>
                      )}
                      {showAnswer[key] && (
                        <div className="sm-box answer-box">
                          <div className="sm-box-lbl">📖 Full Answer</div>
                          <pre className="sm-code">{q.fullAnswer}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}