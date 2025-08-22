
import { User } from '@/hooks/use-auth';

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const performBalancedSort = (players: User[], playersPerTeam: number): { teams: User[][], leftovers: User[] } => {
    // A. Balanced Sort (Snake Draft + Fine Tuning)
    const numTeams = Math.max(1, Math.floor(players.length / playersPerTeam));
    let teamsDraft: User[][] = Array.from({ length: numTeams }, () => []);
    
    // Phase 1: Snake Draft
    const playersByRating: Record<number, User[]> = {};
    players.forEach(p => {
        const rating = p.rating || 1;
        if (!playersByRating[rating]) playersByRating[rating] = [];
        playersByRating[rating].push(p);
    });
    
    Object.values(playersByRating).forEach(tier => shuffleArray(tier));

    let allPlayersTiered = Object.entries(playersByRating)
        .sort((a, b) => Number(b[0]) - Number(a[0])) // Sort tiers from 5 down to 1
        .flatMap(([, players]) => players);

    let playerIndex = 0;
    let forward = true;
    while(playerIndex < allPlayersTiered.length) {
        if(forward) {
            for(let i = 0; i < numTeams && playerIndex < allPlayersTiered.length; i++) {
                teamsDraft[i].push(allPlayersTiered[playerIndex++]);
            }
        } else {
            for(let i = numTeams - 1; i >= 0 && playerIndex < allPlayersTiered.length; i--) {
                teamsDraft[i].push(allPlayersTiered[playerIndex++]);
            }
        }
        forward = !forward;
    }

    // Phase 2: Fine-Tuning Swaps
    const getTeamSum = (team: User[]) => team.reduce((sum, p) => sum + (p.rating || 1), 0);
    
    for (let pass = 0; pass < 5; pass++) { // Run multiple passes for better optimization
        for (let i = 0; i < teamsDraft.length; i++) {
            for (let j = i + 1; j < teamsDraft.length; j++) {
                const teamA = teamsDraft[i];
                const teamB = teamsDraft[j];
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
    const leftovers: User[] = [];

    teamsDraft.forEach(team => {
        const mainTeam = team.slice(0, playersPerTeam);
        const teamLeftovers = team.slice(playersPerTeam);
        if (mainTeam.length > 0) {
            finalTeams.push(shuffleArray(mainTeam)); // Shuffle for presentation
        }
        leftovers.push(...teamLeftovers);
    });

    return { teams: finalTeams, leftovers };
};
