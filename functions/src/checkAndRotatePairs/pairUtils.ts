// Utility functions for handling pairs

import { Pair } from "./types";

/**
 * Returns a random color from a predefined list
 */
export const getRandomColor = (): string => {
  const colors = [
    "#FF5733",
    "#33FF57",
    "#3357FF",
    "#FF33A8",
    "#33FFF5",
    "#F5FF33",
    "#C733FF",
    "#33FFA8",
    "#FFC733",
    "#FF9933",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Returns a random number between 1 and 100
 */
export const getRandomNumber = (): number => {
  return Math.floor(Math.random() * 100) + 1;
};

/**
 * Creates a new pair with random color and number
 */
export const createPair = (
  pairIndex: number,
  users: string[]
): Pair => {
  return {
    id: `pair-${pairIndex}`,
    users,
    color: getRandomColor(),
    number: getRandomNumber(),
    isTriple: users.length === 3
  };
};

/**
 * Rotates pairs by shuffling all users and creating new pairs
 * Ensures no one is left solo by creating groups of 3 when necessary
 */
export const rotatePairs = (pairs: Pair[]): Pair[] => {
  if (pairs.length <= 1) {
    return pairs;
  }

  // Extract all users
  const allUsers: string[] = pairs.reduce(
    (acc, pair) => [...acc, ...pair.users],
    [] as string[]
  );

  // Shuffle users
  const shuffledUsers = shuffleArray([...allUsers]);
  
  // Create new pairs
  const newPairs: Pair[] = [];
  
  // If we have an odd number of users, we need to handle it specially
  if (shuffledUsers.length % 2 === 1) {
    // Take the last 3 users and make a group of 3
    const lastThreeUsers = shuffledUsers.splice(shuffledUsers.length - 3, 3);
    newPairs.push(createPair(Math.floor(shuffledUsers.length / 2), lastThreeUsers));
  }
  
  // Create pairs with the remaining users (which should be an even number)
  for (let i = 0; i < shuffledUsers.length; i += 2) {
    newPairs.push(createPair(i / 2, [shuffledUsers[i], shuffledUsers[i + 1]]));
  }

  return newPairs;
};

/**
 * Shuffles an array using the Fisher-Yates algorithm
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
