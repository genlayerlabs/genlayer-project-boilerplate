// Normalize & validate bet form, and compute a stable bet_id.
export function normalizeDate(input) {
  if (!input) return "";
  const s = String(input).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return "";
  const [_, mm, dd, yyyy] = m;
  return `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
}

// KHÔNG xoá khoảng trắng; chỉ trim 2 đầu & lower-case để khớp contract + UI
export function computeBetId(date, t1, t2) {
  return `${date}_${t1.trim()}_${t2.trim()}`.toLowerCase();
}

export function validateBet({ date, team1, team2, predicted }) {
  const errors = {};
  const d = normalizeDate(date);
  if (!d) errors.date = "Invalid date. Use YYYY-MM-DD or MM/DD/YYYY.";
  if (!team1?.trim()) errors.team1 = "Team 1 is required.";
  if (!team2?.trim()) errors.team2 = "Team 2 is required.";
  if (team1 && team2 && team1.trim().toLowerCase() === team2.trim().toLowerCase()) {
    errors.team2 = "Teams must be different.";
  }
  if (predicted !== "1" && predicted !== "2") errors.predicted = "Pick the predicted winner (1 or 2).";
  return { ok: Object.keys(errors).length === 0, errors, date: d };
}
