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
 * Calculates the minimum bid required based on the current price
 * For bids below 1 SOL: adds 0.005 SOL
 * For bids above 1 SOL: adds 10% of the current price
 * @param currentPrice Current price in SOL
 * @returns Minimum bid amount in SOL
 */
export function getMinimumBid(currentPrice: number): number {
    if (currentPrice >= 1) {
        // Above 1 SOL: new minimum is current price + 10%
        return currentPrice * 1.1;
    } else {
        // Below 1 SOL: new minimum is current price + 0.005 SOL
        return currentPrice + 0.005;
    }
}

/**
 * Formats a SOL amount to a consistent string format
 * @param amount Amount in SOL
 * @returns Formatted string with 4 decimal places
 */
export function formatSol(amount: number | undefined | null): string {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return '0.0000';
    }
    return amount.toFixed(4);
}
