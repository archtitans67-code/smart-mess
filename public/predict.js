/**
 * Weighted Prediction Formula
 * Predicts meal portions based on:
 * - 50% today's pre-registrations
 * - 30% average of last 7 days
 * - 20% same weekday last week
 */

function predict(meal, preRegistrations, wasteLog) {
  const today = new Date().toISOString().split('T')[0];

  // Get today's pre-registrations for this meal
  const todayReg = preRegistrations.filter(
    pr => pr.date === today && pr.meals.includes(meal)
  ).length;

  // Get average pre-registrations for this meal in last 7 days
  const avg7d = getAvg7Days(meal, preRegistrations);

  // Get pre-registrations for same weekday last week
  const sameWeekday = getSameWeekdayLast(meal, preRegistrations);

  // Weighted formula
  const prediction = (0.5 * todayReg) + (0.3 * avg7d) + (0.2 * sameWeekday);

  return {
    prediction: Math.round(prediction * 10) / 10, // Round to 1 decimal
    breakdown: {
      todayRegistrations: todayReg,
      avg7days: Math.round(avg7d * 10) / 10,
      sameWeekday: Math.round(sameWeekday * 10) / 10,
      weights: {
        today: '50%',
        avg7d: '30%',
        sameWeekday: '20%'
      }
    },
    formula: `(0.5 × ${todayReg}) + (0.3 × ${Math.round(avg7d * 10) / 10}) + (0.2 × ${Math.round(sameWeekday * 10) / 10}) = ${Math.round(prediction * 10) / 10}`
  };
}

function getAvg7Days(meal, preRegistrations) {
  const today = new Date();
  let total = 0;
  let count = 0;

  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayCount = preRegistrations.filter(
      pr => pr.date === dateStr && pr.meals.includes(meal)
    ).length;

    if (dayCount > 0) {
      total += dayCount;
      count++;
    }
  }

  return count > 0 ? total / count : 0;
}

function getSameWeekdayLast(meal, preRegistrations) {
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const dateStr = lastWeek.toISOString().split('T')[0];

  const count = preRegistrations.filter(
    pr => pr.date === dateStr && pr.meals.includes(meal)
  ).length;

  return count || 0;
}
