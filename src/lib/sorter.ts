
import { User } from '@/hooks/use-auth';

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const getTeamSum = (team: User[]) => team.reduce((sum, p) => sum + (p.rating || 1), 0);

const balanceFiveStarPlayers = (teams: User[][], leftovers: User[]) => {
    let needsSwap = true;
    while (needsSwap) {
        needsSwap = false;
        let overStarredTeamIndex = -1;
        let extraFiveStarPlayerIndex = -1;

        // Find a team with more than one 5-star player
        for (let i = 0; i < teams.length; i++) {
            const fiveStarPlayers = teams[i].filter(p => p.rating === 5);
            if (fiveStarPlayers.length > 1) {
                overStarredTeamIndex = i;
                // Find the index of the second 5-star player to swap them out
                extraFiveStarPlayerIndex = teams[i].findIndex(p => p.uid === fiveStarPlayers[1].uid);
                break;
            }
        }

        if (overStarredTeamIndex === -1) {
            break; // No teams with extra 5-star players, we are done.
        }

        let bestSwapTarget: { type: 'team' | 'leftover', teamIndex?: number, playerIndex: number, playerRating: number } | null = null;

        // Priority 1: Find the best player in a team with NO 5-star players
        for (let i = 0; i < teams.length; i++) {
            if (i === overStarredTeamIndex) continue;
            const hasFiveStar = teams[i].some(p => p.rating === 5);
            if (!hasFiveStar) {
                let bestPlayerIndex = -1;
                let bestPlayerRating = -1;
                teams[i].forEach((p, index) => {
                    if ((p.rating || 1) > bestPlayerRating) {
                        bestPlayerRating = p.rating || 1;
                        bestPlayerIndex = index;
                    }
                });
                if (bestPlayerIndex !== -1 && (!bestSwapTarget || bestPlayerRating > bestSwapTarget.playerRating)) {
                    bestSwapTarget = { type: 'team', teamIndex: i, playerIndex: bestPlayerIndex, playerRating: bestPlayerRating };
                }
            }
        }
        
        // Priority 2: If no suitable team is found, look in leftovers
        if (!bestSwapTarget && leftovers.length > 0) {
            let bestPlayerIndex = -1;
            let bestPlayerRating = -1;
            leftovers.forEach((p, index) => {
                // Ensure we are not swapping a 5-star for a 5-star in leftovers
                if ((p.rating || 1) < 5 && (p.rating || 1) > bestPlayerRating) {
                    bestPlayerRating = p.rating || 1;
                    bestPlayerIndex = index;
                }
            });
             if (bestPlayerIndex !== -1) {
                bestSwapTarget = { type: 'leftover', playerIndex: bestPlayerIndex, playerRating: bestPlayerRating };
            }
        }

        if (bestSwapTarget) {
            const sourceTeam = teams[overStarredTeamIndex];
            const playerToMove = sourceTeam[extraFiveStarPlayerIndex];

            if (bestSwapTarget.type === 'team' && bestSwapTarget.teamIndex !== undefined) {
                const targetTeam = teams[bestSwapTarget.teamIndex];
                const playerToReceive = targetTeam[bestSwapTarget.playerIndex];
                // Swap
                sourceTeam[extraFiveStarPlayerIndex] = playerToReceive;
                targetTeam[bestSwapTarget.playerIndex] = playerToMove;
            } else { // It's a leftover
                const playerToReceive = leftovers[bestSwapTarget.playerIndex];
                // Swap
                sourceTeam[extraFiveStarPlayerIndex] = playerToReceive;
                leftovers[bestSwapTarget.playerIndex] = playerToMove;
            }
            needsSwap = true; // Mark that a swap happened and we should re-run the check
        }
    }
};


export const performBalancedSort = (players: User[], playersPerTeam: number): { teams: User[][], leftovers: User[] } => {
    if (players.length === 0 || playersPerTeam <= 0) {
        return { teams: [], leftovers: players };
    }

    const numTeams = Math.max(1, Math.floor(players.length / playersPerTeam));
    let teams: User[][] = Array.from({ length: numTeams }, () => []);
    
    const playersByRating: Record<number, User[]> = {};
    players.forEach(p => {
        const rating = p.rating || 1;
        if (!playersByRating[rating]) playersByRating[rating] = [];
        playersByRating[rating].push(p);
    });
    
    Object.values(playersByRating).forEach(tier => shuffleArray(tier));

    let allPlayersTiered = Object.entries(playersByRating)
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .flatMap(([, playersInTier]) => playersInTier);
    
    // Snake Draft
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
    
    const finalTeams: User[][] = [];
    let leftovers: User[] = [];

    teams.forEach(team => {
        const mainTeam = team.slice(0, playersPerTeam);
        const teamLeftovers = team.slice(playersPerTeam);
        
        if (mainTeam.length > 0) {
            finalTeams.push(mainTeam);
        }
        leftovers.push(...teamLeftovers);
    });
    
    // Hard rule: Balance 5-star players, now considering leftovers
    balanceFiveStarPlayers(finalTeams, leftovers);

    // Final shuffle for presentation
    finalTeams.forEach(team => shuffleArray(team));

    return { teams: finalTeams, leftovers: shuffleArray(leftovers) };
};
