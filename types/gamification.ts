export type Rank = 'Novice' | 'Scout' | 'Vanguard' | 'Commander' | 'Legend';

export interface UserRank {
    id: Rank;
    label: string;
    minXp: number;
    color: string;
    perks: string[];
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    icon: string;
}

export const RANKS: UserRank[] = [
    {
        id: 'Novice',
        label: 'Trench Grunt',
        minXp: 0,
        color: 'text-zinc-500',
        perks: ['Access to General Chat', 'Basic Charting']
    },
    {
        id: 'Scout',
        label: 'Recon Scout',
        minXp: 1000,
        color: 'text-cyan-500',
        perks: ['View Clan Holdings', 'Vote in Minor Polls']
    },
    {
        id: 'Vanguard',
        label: 'Frontline Vanguard',
        minXp: 5000,
        color: 'text-emerald-500',
        perks: ['Post Alpha Signals', 'Access War Room Voice']
    },
    {
        id: 'Commander',
        label: 'War Commander',
        minXp: 20000,
        color: 'text-amber-500',
        perks: ['Create Clan Polls', 'Manage Treasury', 'Priority Support']
    },
    {
        id: 'Legend',
        label: 'Trench God',
        minXp: 100000,
        color: 'text-purple-500',
        perks: ['Global Leaderboard Flair', 'Revenue Share', 'Direct Line to Devs']
    }
];

export const BADGES: Badge[] = [
    {
        id: 'early_trencher',
        name: 'Early Trencher',
        description: 'Joined during the Alpha phase.',
        rarity: 'Epic',
        icon: '🛡️'
    },
    {
        id: 'whale_hunter',
        name: 'Whale Hunter',
        description: 'Executed a trade with >100% profit on a token with >$10M MC.',
        rarity: 'Legendary',
        icon: '🐋'
    },
    {
        id: 'rug_survivor',
        name: 'Rug Survivor',
        description: 'Held a token that went to zero... and lived to tell the tale.',
        rarity: 'Rare',
        icon: '🤕'
    },
    {
        id: 'diamond_hands',
        name: 'Diamond Hands',
        description: 'Held a position for >30 days without selling.',
        rarity: 'Rare',
        icon: '💎'
    }
];

// Helper to calculate rank based on XP
export const getRank = (xp: number): UserRank => {
    return RANKS.slice().reverse().find(rank => xp >= rank.minXp) || RANKS[0];
};
