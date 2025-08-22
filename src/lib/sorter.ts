
import { User } from '@/hooks/use-auth';

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const getTeamSum = (team: User[]) => team.reduce((sum, p) => sum + (p.rating || 1), 0);

const balanceFiveStarPlayers = (teams: User[][]) => {
    // This function attempts to ensure no team has more than one 5-star player.
    let overStarredTeams: { teamIndex: number; playerIndex: number }[] = [];
    let underStarredTeams: { teamIndex: number; bestPlayerIndex: number; bestPlayerRating: number }[] = [];

    teams.forEach((team, teamIndex) => {
        const fiveStarPlayers = team.map((p, i) => ({ player: p, index: i })).filter(p => p.player.rating === 5);
        
        if (fiveStarPlayers.length > 1) {
            // Store all but one 5-star player for potential swapping
            for (let i = 1; i < fiveStarPlayers.length; i++) {
                overStarredTeams.push({ teamIndex: teamIndex, playerIndex: fiveStarPlayers[i].index });
            }
        } else if (fiveStarPlayers.length === 0) {
            let bestPlayerIndex = -1;
            let bestPlayerRating = -1;
            team.forEach((player, playerIndex) => {
                if ((player.rating || 1) > bestPlayerRating) {
                    bestPlayerRating = player.rating || 1;
                    bestPlayerIndex = playerIndex;
                }
            });
            if (bestPlayerIndex !== -1) {
                underStarredTeams.push({ teamIndex, bestPlayerIndex, bestPlayerRating });
            }
        }
    });

    // Sort teams to swap with by descending best player rating
    underStarredTeams.sort((a, b) => b.bestPlayerRating - a.bestPlayerRating);

    while (overStarredTeams.length > 0 && underStarredTeams.length > 0) {
        const source = overStarredTeams.pop()!;
        const target = underStarredTeams.shift()!;

        // Perform the swap
        const sourceTeam = teams[source.teamIndex];
        const targetTeam = teams[target.teamIndex];
        
        const fiveStarPlayer = sourceTeam[source.playerIndex];
        const bestPlayerFromTarget = targetTeam[target.bestPlayerIndex];

        sourceTeam[source.playerIndex] = bestPlayerFromTarget;
        targetTeam[target.bestPlayerIndex] = fiveStarPlayer;
    }
};


export const performBalancedSort = (players: User[], playersPerTeam: number): { teams: User[][], leftovers: User[] } => {
    if (players.length === 0) {
        return { teams: [], leftovers: [] };
    }

    const numTeams = Math.max(1, Math.floor(players.length / playersPerTeam));
    let teams: User[][] = Array.from({ length: numTeams }, () => []);
    
    // 1. Group players by rating (tier)
    const playersByRating: Record<number, User[]> = {};
    players.forEach(p => {
        const rating = p.rating || 1;
        if (!playersByRating[rating]) playersByRating[rating] = [];
        playersByRating[rating].push(p);
    });
    
    // 2. Shuffle each tier
    Object.values(playersByRating).forEach(tier => shuffleArray(tier));

    // 3. Create a single list sorted by tier (desc) for the snake draft
    let allPlayersTiered = Object.entries(playersByRating)
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .flatMap(([, playersInTier]) => playersInTier);

    // 4. Perform Snake Draft
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

    // 5. Fine-Tuning Swaps for star sum balance
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
    
    // 6. Hard rule: Balance 5-star players
    balanceFiveStarPlayers(teams);

    // 7. Separate leftovers and shuffle final teams for presentation
    const finalTeams: User[][] = [];
    const leftovers: User[] = [];

    teams.forEach(team => {
        // Sort team by rating desc to easily find leftovers
        team.sort((a, b) => (b.rating || 1) - (a.rating || 1));
        const mainTeam = team.slice(0, playersPerTeam);
        const teamLeftovers = team.slice(playersPerTeam);
        
        if (mainTeam.length > 0) {
            finalTeams.push(shuffleArray(mainTeam)); // Shuffle for presentation
        }
        leftovers.push(...teamLeftovers);
    });

    return { teams: finalTeams, leftovers: shuffleArray(leftovers) };
};
