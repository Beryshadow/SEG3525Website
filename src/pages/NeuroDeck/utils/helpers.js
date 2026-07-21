export const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const getCorrectAnswers = (q) => {
  if (!q) return [];
  return q.correctAnswers || (q.correctAnswer ? [q.correctAnswer] : []);
};

export const getTokenHash = (token) => {
  if (!token) return "";
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = ((hash << 5) - hash) + token.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  return positive.toString(36).substring(0, 3).toUpperCase().padStart(3, '0');
};

