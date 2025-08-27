
interface GameDaySetting {
  selected: boolean;
  time: string;
}

const dayOfWeekMap: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
};

export function getActiveOrNextGameDate(gameDays: Record<string, GameDaySetting>): Date | null {
    if (!gameDays || Object.keys(gameDays).length === 0) return null;

    const now = new Date();
    const allGameDates: Date[] = [];

    // Look for games from the last 7 days up to 14 days in the future
    for (let i = -7; i < 14; i++) {
        const checkingDate = new Date();
        checkingDate.setDate(now.getDate() + i);
        const dayOfWeek = checkingDate.getDay();
        const dayId = Object.keys(dayOfWeekMap).find(key => dayOfWeekMap[key] === dayOfWeek);

        if (dayId && gameDays[dayId]?.selected && gameDays[dayId]?.time) {
            const [hours, minutes] = gameDays[dayId].time.split(':').map(Number);
            const gameTime = new Date(checkingDate);
            gameTime.setHours(hours, minutes, 0, 0);
            allGameDates.push(gameTime);
        }
    }

    if (allGameDates.length === 0) return null;

    // Sort dates
    allGameDates.sort((a, b) => a.getTime() - b.getTime());

    const futureGames = allGameDates.filter(d => d > now);
    const pastGames = allGameDates.filter(d => d <= now);

    const mostRecentPastGame = pastGames.length > 0 ? pastGames[pastGames.length - 1] : null;
    const nextFutureGame = futureGames.length > 0 ? futureGames[0] : null;

    if (mostRecentPastGame) {
        let gracePeriodHours = 24; // Default grace period
        
        if (nextFutureGame) {
            const lastGameEndTime = new Date(mostRecentPastGame.getTime() + 2 * 60 * 60 * 1000); // Assuming 2h duration
            const hoursUntilNextGame = (nextFutureGame.getTime() - lastGameEndTime.getTime()) / (1000 * 60 * 60);
            
            if (hoursUntilNextGame < gracePeriodHours) {
              gracePeriodHours = Math.max(0, hoursUntilNextGame - 1);
            }
        }
        
        const gracePeriodEndDate = new Date(mostRecentPastGame.getTime() + gracePeriodHours * 60 * 60 * 1000);

        if (now < gracePeriodEndDate) {
            return mostRecentPastGame;
        }
    }

    return nextFutureGame;
}

export const formatDateToId = (date: Date): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (`0${d.getMonth() + 1}`).slice(-2);
    const day = (`0${d.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
}
