
import { User } from '@/hooks/use-auth';

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const getTeamSum = (team: User[]) => team.reduce((sum, p) => sum + (p.rating || 1), 0);

export const performBalancedSort = (players: User[], playersPerTeam: number): { teams: User[][]} => {
    if (players.length === 0 || playersPerTeam <= 0) {
        return { teams: [] };
    }

    const numFullTeams = Math.floor(players.length / playersPerTeam);
    const numLeftoverPlayers = players.length % playersPerTeam;
    const hasLeftoverTeam = numLeftoverPlayers > 0;
    const totalTeams = numFullTeams + (hasLeftoverTeam ? 1 : 0);

    let teams: User[][] = Array.from({ length: totalTeams }, () => []);
    
    const playersByRating: Record<number, User[]> = {};
    players.forEach(p => {
        const rating = p.rating || 1;
        if (!playersByRating[rating]) playersByRating[rating] = [];
        playersByRating[rating].push(p);
    });
    
    // Shuffle players within each rating tier to add randomness
    Object.values(playersByRating).forEach(tier => shuffleArray(tier));

    // Get all players sorted by rating descending to ensure top players are distributed first
    let allPlayersTiered = Object.entries(playersByRating)
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .flatMap(([, playersInTier]) => playersInTier);
    
    // Distribute players into teams, filling full teams first
    for (let i = 0; i < numFullTeams; i++) {
        teams[i] = allPlayersTiered.splice(0, playersPerTeam);
    }
    
    // Add remaining players to the leftover team
    if (hasLeftoverTeam) {
        teams[numFullTeams] = allPlayersTiered;
    }

    // Balance the full teams by swapping players
    const fullTeams = teams.slice(0, numFullTeams);
    const leftoverTeam = hasLeftoverTeam ? teams[numFullTeams] : [];

    // Fine-Tuning Swaps for star sum balance only among full teams
    for (let pass = 0; pass < 5; pass++) { // Multiple passes for better balance
        for (let i = 0; i < fullTeams.length; i++) {
            for (let j = i + 1; j < fullTeams.length; j++) {
                const teamA = fullTeams[i];
                const teamB = fullTeams[j];
                const sumA = getTeamSum(teamA);
                const sumB = getTeamSum(teamB);
                const initialDiff = Math.abs(sumA - sumB);

                let bestSwap: { pA_idx: number, pB_idx: number, newDiff: number } | null = null;
                
                // Find the best swap between teamA and teamB
                for (let pA_idx = 0; pA_idx < teamA.length; pA_idx++) {
                    for (let pB_idx = 0; pB_idx < teamB.length; pB_idx++) {
                        const playerA = teamA[pA_idx];
                        const playerB = teamB[pB_idx];

                        const newSumA = sumA - (playerA.rating || 1) + (playerB.rating || 1);
                        const newSumB = sumB - (playerB.rating || 1) + (playerA.rating || 1);
                        const newDiff = Math.abs(newSumA - newSumB);

                        if (newDiff < (bestSwap?.newDiff ?? initialDiff)) {
                            bestSwap = { pA_idx, pB_idx, newDiff };
                        }
                    }
                }
                
                // Perform the best swap found
                if (bestSwap) {
                    const temp = teamA[bestSwap.pA_idx];
                    teamA[bestSwap.pA_idx] = teamB[bestSwap.pB_idx];
                    teamB[bestSwap.pB_idx] = temp;
                }
            }
        }
    }
    
    // Final shuffle for presentation within each team
    fullTeams.forEach(team => shuffleArray(team));
    if(hasLeftoverTeam) shuffleArray(leftoverTeam);

    const finalTeams = [...fullTeams, ...(hasLeftoverTeam ? [leftoverTeam] : [])];

    return { teams: finalTeams };
};
