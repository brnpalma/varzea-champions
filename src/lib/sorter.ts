
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
    if (players.length === 0) {
        return { teams: [] };
    }

    // Treat "leftovers" as a team from the start
    const numTeams = Math.ceil(players.length / playersPerTeam);
    let teams: User[][] = Array.from({ length: numTeams }, () => []);
    
    const playersByRating: Record<number, User[]> = {};
    players.forEach(p => {
        const rating = p.rating || 1;
        if (!playersByRating[rating]) playersByRating[rating] = [];
        playersByRating[rating].push(p);
    });
    
    // Shuffle players within each rating tier
    Object.values(playersByRating).forEach(tier => shuffleArray(tier));

    let allPlayersTiered = Object.entries(playersByRating)
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .flatMap(([, playersInTier]) => playersInTier);
    
    // Snake Draft to distribute players
    let playerIndex = 0;
    let forward = true;
    while(playerIndex < allPlayersTiered.length) {
        if(forward) {
            for(let i = 0; i < numTeams && playerIndex < allPlayersTiered.length; i++) {
                teams[i].push(allPlayersTiered[playerIndex++]);
            }
        } else {
            for(let i = numTeams - 1; i >= 0 && playerIndex < allPlayersTiered.length; i--) {
                teams[i].push(allPlayersTiered[playerIndex++]);
            }
        }
        forward = !forward;
    }

    // Fine-Tuning Swaps for star sum balance
    for (let pass = 0; pass < 5; pass++) {
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                const teamA = teams[i];
                const teamB = teams[j];
                const sumA = getTeamSum(teamA);
                const sumB = getTeamSum(teamB);
                const initialDiff = Math.abs(sumA - sumB);

                let bestSwap: { pA_idx: number, pB_idx: number, newDiff: number } | null = null;
                
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
                
                if (bestSwap) {
                    const temp = teamA[bestSwap.pA_idx];
                    teamA[bestSwap.pA_idx] = teamB[bestSwap.pB_idx];
                    teamB[bestSwap.pB_idx] = temp;
                }
            }
        }
    }
    
    // Final shuffle for presentation
    teams.forEach(team => shuffleArray(team));

    return { teams };
};
