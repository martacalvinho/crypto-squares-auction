import { Alchemy, Network } from 'alchemy-sdk';

// Configure Alchemy SDK for future use
const config = {
  apiKey: process.env.VITE_ALCHEMY_API_KEY || 'demo',
  network: Network.SOL_MAINNET,
};

const alchemy = new Alchemy(config);

/**
 * Returns the starting price for an empty spot in SOL
 */
export function getStartingPrice(): number {
    return 0.005; // Starting price in SOL for empty spots
}

/**
 * Calculates the minimum bid required based on the current price and spot status
 * @param currentPrice Current price in SOL
 * @param isEmpty Whether the spot is empty
 * @returns Minimum bid amount in SOL
 */
export function getMinimumBid(currentPrice: number, isEmpty: boolean): number {
    // For empty spots, always start at 0.005 SOL
    if (isEmpty) {
        return getStartingPrice();
    }

    // For spots under 1 SOL: current price + 0.05 SOL
    if (currentPrice < 1) {
        return currentPrice + 0.05;
    }

    // For spots over 1 SOL: current price + 10%
    return currentPrice * 1.1;
}

/**
 * Formats a SOL amount to a consistent string format
 * @param amount Amount in SOL
 * @returns Formatted string with 3 decimal places
 */
export function formatSol(amount: number | undefined | null): string {
    if (amount === undefined || amount === null) return '0';
    return Number(amount.toFixed(3)).toString();
}
