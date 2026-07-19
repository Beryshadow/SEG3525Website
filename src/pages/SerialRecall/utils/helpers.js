export const DEFAULT_LISTS = [
  {
    id: "1",
    title: "Biological Classification",
    items: ["Kingdom", "Phylum", "Class", "Order", "Family", "Genus", "Species"],
    mnemonic: "Kings Play Chess On Fine Glass Surfaces.",
    masteryLevel: 0,
    performanceScore: 0,
    dueDate: 0
  },
  {
    id: "2",
    title: "Order of Operation",
    items: ["Parentheses", "Exponents", "Multiplication", "Division", "Addition", "Subtraction"],
    mnemonic: "Please Excuse My Dear Aunt Sally.",
    masteryLevel: 0,
    performanceScore: 0,
    dueDate: 0
  }
];

export const levenshtein = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i += 1) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  return matrix[b.length][a.length];
};
