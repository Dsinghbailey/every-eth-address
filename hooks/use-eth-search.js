import React from "react";
import { ethToIndex, indexToETH } from "../lib/ethTools";
import { MAX_ETH_ADDRESS } from "../lib/constants";

// Pattern for a valid ETH address: 0x followed by 40 hex characters
const ETH_ADDRESS_PATTERN = /^0x[0-9a-f]{40}$/i;

function getAllValidPatterns(search) {
  // Lowercase search for consistency
  const cleanSearch = search.toLowerCase().replace(/[^0-9a-fx]/g, "");
  if (!cleanSearch) return [];
  
  // If search starts with 0x, we're looking for a specific prefix
  const searchWithoutPrefix = cleanSearch.startsWith("0x") 
    ? cleanSearch.slice(2) 
    : cleanSearch;
  
  // For ETH addresses, we only need to match the hex characters
  // We only care about positions that could create a valid address
  const patterns = [];
  
  // If the search is just "0x", any address works
  if (cleanSearch === "0x") {
    patterns.push({ pattern: "0x" + "X".repeat(40), leftPadding: 0 });
    return patterns;
  }
  
  // If the search has 0x prefix, it must be at the beginning
  if (cleanSearch.startsWith("0x")) {
    // Can only match at the beginning
    patterns.push({ 
      pattern: cleanSearch + "X".repeat(42 - cleanSearch.length), 
      leftPadding: 0 
    });
    return patterns;
  }
  
  // No 0x prefix, search can be anywhere in the 40 hex chars
  for (let leftPadding = 0; leftPadding <= 40 - searchWithoutPrefix.length; leftPadding++) {
    patterns.push({ 
      pattern: "0x" + "X".repeat(leftPadding) + searchWithoutPrefix + "X".repeat(40 - leftPadding - searchWithoutPrefix.length), 
      leftPadding: leftPadding + 2  // +2 for the "0x" prefix
    });
  }
  
  return patterns;
}

function generateRandomETH(pattern) {
  if (!pattern) return null;
  
  return pattern.replace(
    /X/g,
    () => "0123456789abcdef"[Math.floor(Math.random() * 16)]
  );
}

const SEARCH_LOOKBACK = 5000;
const SEARCH_LOOKAHEAD = 2500;
const RANDOM_SEARCH_ITERATIONS = 500;

export function useETHSearch({ virtualPosition, displayedAddresses }) {
  const [search, setSearch] = React.useState(null);
  const [address, setAddress] = React.useState(null);
  // Stack of complete states we've seen
  const [nextStates, setNextStates] = React.useState([]);

  const previousAddresses = React.useMemo(() => {
    let hasComputed = false;
    let value = null;
    const getValue = () => {
      const compute = () => {
        const prev = [];
        for (let i = 1; i <= SEARCH_LOOKBACK; i++) {
          i = BigInt(i);
          let index = BigInt(virtualPosition) - i;
          if (index < 0n) {
            index = MAX_ETH_ADDRESS + index;
          }
          const address = indexToETH(index);
          prev.push({ index, address });
        }
        return prev;
      };
      if (!hasComputed) {
        value = compute();
        hasComputed = true;
      }
      return value;
    };
    return getValue;
  }, [virtualPosition]);

  const nextAddresses = React.useMemo(() => {
    let hasComputed = false;
    let value = null;
    const getValue = () => {
      const compute = () => {
        const next = [];
        for (let i = 1; i <= SEARCH_LOOKAHEAD; i++) {
          i = BigInt(i);
          let index = virtualPosition + i;
          if (index > MAX_ETH_ADDRESS) {
            index = index - MAX_ETH_ADDRESS;
          }
          const address = indexToETH(index);
          next.push({ index, address });
        }
        return next;
      };
      if (!hasComputed) {
        value = compute();
        hasComputed = true;
      }
      return value;
    };
    return getValue;
  }, [virtualPosition]);

  const searchAround = React.useCallback(
    ({ input, wantHigher, canUseCurrentIndex }) => {
      if (wantHigher) {
        const startPosition = canUseCurrentIndex ? 0 : 1;
        for (let i = startPosition; i < displayedAddresses.length; i++) {
          const address = displayedAddresses[i].address;
          if (address.toLowerCase().includes(input.toLowerCase())) {
            return { address, index: displayedAddresses[i].index };
          }
        }
        const next = nextAddresses();
        for (let i = 0; i < next.length; i++) {
          const address = next[i].address;
          if (address.toLowerCase().includes(input.toLowerCase())) {
            return { address, index: next[i].index };
          }
        }
      } else {
        // canUseCurrentIndex isn't relevant when searching backwards!
        const prev = previousAddresses();
        for (const { address, index } of prev) {
          if (address.toLowerCase().includes(input.toLowerCase())) {
            return { address, index };
          }
        }
      }
      return null;
    },
    [displayedAddresses, previousAddresses, nextAddresses]
  );

  const searchRandomly = React.useCallback(
    ({ input, wantHigher }) => {
      const patterns = getAllValidPatterns(input);
      if (patterns.length === 0) return null;
      
      let best = null;
      let compareIndex = virtualPosition;
      
      for (let i = 0; i < RANDOM_SEARCH_ITERATIONS; i++) {
        const { pattern, leftPadding } =
          patterns[Math.floor(Math.random() * patterns.length)];
        const randomAddress = generateRandomETH(pattern);
        
        try {
          const index = ethToIndex(randomAddress);
          const satisfiesConstraint = wantHigher
            ? index > compareIndex
            : index < compareIndex;
          const notInHistory = !nextStates.some(
            ({ address: nextAddress }) => nextAddress === randomAddress
          );
          
          if (satisfiesConstraint && notInHistory) {
            const isBetter =
              best === null
                ? true
                : wantHigher
                  ? index < best.index
                  : index > best.index;
            if (isBetter) {
              best = { address: randomAddress, pattern, leftPadding, index };
            }
          }
        } catch (e) {
          // Skip invalid addresses
          continue;
        }
      }
      
      if (best) {
        return best;
      }
      
      // Fallback to any random match
      const { pattern: fallbackPattern, leftPadding: fallbackLeftPadding } =
        patterns[Math.floor(Math.random() * patterns.length)];
      const fallbackAddress = generateRandomETH(fallbackPattern);
      
      try {
        return {
          address: fallbackAddress,
          pattern: fallbackPattern,
          leftPadding: fallbackLeftPadding,
          index: ethToIndex(fallbackAddress),
        };
      } catch (e) {
        return null;
      }
    },
    [nextStates, address, virtualPosition]
  );

  const searchETH = React.useCallback(
    (input) => {
      // Clean input - only allow hex characters and 0x prefix
      const invalid = input.toLowerCase().replace(/[^0-9a-fx]/g, "");
      if (invalid !== input.toLowerCase()) {
        return null;
      }
      
      const newSearch = input.toLowerCase();
      if (!newSearch) return null;

      // Clear next states stack when search changes
      setNextStates([]);

      const inner = () => {
        const around = searchAround({
          input,
          wantHigher: true,
          canUseCurrentIndex: true,
        });
        if (around) return around;
        return searchRandomly({ input, wantHigher: true });
      };

      const result = inner();
      if (result) {
        setSearch(newSearch);
        setAddress(result.address);
        setNextStates((prev) => [...prev, result]);
      }
      return result?.address ?? null;
    },
    [searchAround, searchRandomly]
  );

  const nextETH = React.useCallback(() => {
    if (!address || !search) return null;
    const inner = () => {
      const around = searchAround({
        input: search,
        wantHigher: true,
        canUseCurrentIndex: false,
      });
      if (around) return around;
      return searchRandomly({ input: search, wantHigher: true });
    };
    const result = inner();
    if (result) {
      setAddress(result.address);
      setNextStates((prev) => [...prev, result]);
      return result.address;
    }
    return null;
  }, [address, search, searchAround, searchRandomly]);

  const previousETH = React.useCallback(() => {
    if (!address || !search) return null;

    if (nextStates.length > 1) {
      setNextStates((prev) => prev.slice(0, -1));
      const prevState = nextStates[nextStates.length - 2];
      setAddress(prevState.address);
      return prevState.address;
    }

    const inner = () => {
      const around = searchAround({
        input: search,
        wantHigher: false,
        canUseCurrentIndex: false,
      });
      if (around) return around;
      return searchRandomly({ input: search, wantHigher: false });
    };
    const result = inner();
    if (result) {
      setAddress(result.address);
      return result.address;
    }
    return null;
  }, [address, search, nextStates, searchAround, searchRandomly]);

  return {
    searchETH,
    nextETH,
    previousETH,
    currentAddress: address,
  };
}