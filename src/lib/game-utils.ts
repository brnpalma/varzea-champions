
interface GameDaySetting {
  selected: boolean;
  time: string;
  endTime: string;
}

export interface GameInfo {
  startDate: Date;
  endDate: Date;
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

export function getActiveOrNextGame(gameDays: Record<string, GameDaySetting>): GameInfo | null {
    if (!gameDays || Object.keys(gameDays).length === 0) return null;

    const now = new Date();
    const allGameInfos: GameInfo[] = [];

    // Look for games from the last 7 days up to 14 days in the future
    for (let i = -7; i < 14; i++) {
        const checkingDate = new Date();
        checkingDate.setDate(now.getDate() + i);
        const dayOfWeek = checkingDate.getDay();
        const dayId = Object.keys(dayOfWeekMap).find(key => dayOfWeekMap[key] === dayOfWeek);

        if (dayId && gameDays[dayId]?.selected && gameDays[dayId]?.time && gameDays[dayId]?.endTime) {
            const [startHours, startMinutes] = gameDays[dayId].time.split(':').map(Number);
            const [endHours, endMinutes] = gameDays[dayId].endTime.split(':').map(Number);
            
            const startDate = new Date(checkingDate);
            startDate.setHours(startHours, startMinutes, 0, 0);

            const endDate = new Date(checkingDate);
            endDate.setHours(endHours, endMinutes, 0, 0);

            allGameInfos.push({ startDate, endDate });
        }
    }

    if (allGameInfos.length === 0) return null;

    // Sort games by start date
    allGameInfos.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    // Find the current or next relevant game
    for (const gameInfo of allGameInfos) {
        // Is it the current game? (Now is between start and end)
        if (now >= gameInfo.startDate && now <= gameInfo.endDate) {
            return gameInfo;
        }
        // Is it a past game but still within a 24-hour grace period after it ended?
        const gracePeriodEnd = new Date(gameInfo.endDate.getTime() + 24 * 60 * 60 * 1000);
        if (now > gameInfo.endDate && now < gracePeriodEnd) {
             // Let's check if there's a future game scheduled soon. If so, prefer the future one.
            const nextGame = allGameInfos.find(g => g.startDate > now);
            if (nextGame && nextGame.startDate < gracePeriodEnd) {
                // If the next game starts before the grace period of the last one ends,
                // prioritize showing the upcoming game.
                continue; 
            }
            return gameInfo; // Otherwise, we're still in the "post-game" phase of this one.
        }
        // Is it the next upcoming game?
        if (gameInfo.startDate > now) {
            return gameInfo;
        }
    }

    // If no game is found within the grace period or in the future, return the most recent past one.
    const pastGames = allGameInfos.filter(g => g.endDate < now);
    if (pastGames.length > 0) {
        return pastGames[pastGames.length - 1];
    }
    
    return null;
}

export const formatDateToId = (date: Date): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (`0${d.getMonth() + 1}`).slice(-2);
    const day = (`0${d.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
}
