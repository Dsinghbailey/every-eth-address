// ETH address generation tools
export function intToETH(n) {
  if (typeof n !== "bigint") {
    n = BigInt(n);
  }
  if (n < 0n) throw new Error("Number must be non-negative");
  if (n >= 1n << 160n) throw new Error("Number too large (max 160 bits)");

  // Convert to hex with padding to 40 characters (20 bytes)
  const hex = n.toString(16).padStart(40, "0");
  
  // Return with 0x prefix
  return `0x${hex}`;
}

// Simple function to convert index to ETH address
// ETH addresses are just 20-byte (40 hex digit) values with 0x prefix
export function indexToETH(index) {
  if (index >= BigInt(2) ** BigInt(160)) {
    throw new Error("Index out of range - must be less than 2^160");
  }
  if (index < 0n) {
    throw new Error("Index cannot be negative");
  }

  return intToETH(index);
}

// Convert ETH address back to index
export function ethToIndex(address) {
  // Remove 0x prefix if present
  const hex = address.startsWith("0x") ? address.slice(2) : address;
  
  // Validate hex format
  if (!/^[0-9a-f]{40}$/i.test(hex)) {
    throw new Error("Invalid ETH address format");
  }
  
  // Convert to BigInt
  return BigInt("0x" + hex);
}