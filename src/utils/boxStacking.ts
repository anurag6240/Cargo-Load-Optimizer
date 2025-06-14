import { Box } from "@/data/dummyData";

export interface TruckDimensions {
  length: number;
  width: number;
  height: number;
}

// Sort boxes based on fragility, weight, and volume
export const sortBoxesForStacking = (boxes: Box[]): Box[] => {
  // For separate stacking logic, we need to ensure non-fragile come before fragile
  // And within each group, maintain existing sorting by weight and volume
  return [...boxes].sort((a, b) => {
    // Primary sort: non-fragile before fragile
    if (a.isFragile !== b.isFragile) {
      return a.isFragile ? 1 : -1; // Non-fragile (false) comes first (-1), Fragile (true) comes after (1)
    }
    // Secondary sort: by weight (heavier at bottom)
    if (a.weight !== b.weight) {
      return b.weight - a.weight;
    }
    // Tertiary sort: by volume (larger at bottom)
    const volumeA = a.dimensions.length * a.dimensions.width * a.dimensions.height;
    const volumeB = b.dimensions.length * b.dimensions.width * b.dimensions.height;
    return volumeB - volumeA;
  });
};

// Calculate box positions for 3D visualization
export const calculateBoxPositions = (boxes: Box[], truckDimensions: TruckDimensions): Box[] => {
  const sortedBoxes = sortBoxesForStacking(boxes);
  const positionedBoxes: Box[] = [];

  const GAP = 0; // Set GAP to 0 to remove space between boxes

  // Separate fragile and non-fragile boxes
  const nonFragileBoxes = sortedBoxes.filter(box => !box.isFragile);
  const fragileBoxes = sortedBoxes.filter(box => box.isFragile);

  let maxHeightOfNonFragile = 0;

  // --- Phase 1: Pack Non-Fragile Boxes ---
  let currentX_nonFragile = 0;
  let currentY_nonFragile = 0;
  let currentZ_nonFragile = 0;
  let shelfMaxHeight_nonFragile = 0; // Max height in the current X-Z plane for non-fragile
  let rowMaxDepth_nonFragile = 0;    // Max depth/width in the current X-row for non-fragile

  console.log("--- Packing Non-Fragile Boxes ---");
  for (const box of nonFragileBoxes) {
    const boxLength = box.dimensions.length;
    const boxWidth = box.dimensions.width;
    const boxHeight = box.dimensions.height;

    if (
      boxLength > truckDimensions.length ||
      boxWidth > truckDimensions.width ||
      boxHeight > truckDimensions.height
    ) {
      console.warn(`Non-fragile Box ${box.id} is too large for the truck and will be skipped.`);
      continue;
    }

    if (currentX_nonFragile + boxLength > truckDimensions.length) {
      currentX_nonFragile = 0;
      currentZ_nonFragile += rowMaxDepth_nonFragile + GAP;
      rowMaxDepth_nonFragile = 0;
    }

    if (currentZ_nonFragile + boxWidth > truckDimensions.width) {
      currentX_nonFragile = 0;
      currentZ_nonFragile = 0;
      currentY_nonFragile += shelfMaxHeight_nonFragile + GAP;
      shelfMaxHeight_nonFragile = 0;
      rowMaxDepth_nonFragile = 0;
    }

    if (currentY_nonFragile + boxHeight > truckDimensions.height) {
      console.warn(`Non-fragile Box ${box.id} would exceed truck height and will be skipped.`);
      continue;
    }

    positionedBoxes.push({
      ...box,
      position: {
        x: currentX_nonFragile,
        y: currentY_nonFragile,
        z: currentZ_nonFragile
      }
    });

    currentX_nonFragile += boxLength + GAP;
    rowMaxDepth_nonFragile = Math.max(rowMaxDepth_nonFragile, boxWidth);
    shelfMaxHeight_nonFragile = Math.max(shelfMaxHeight_nonFragile, boxHeight);

    maxHeightOfNonFragile = Math.max(maxHeightOfNonFragile, currentY_nonFragile + boxHeight);

    console.log(`Non-Fragile Box ${box.id} positioned at Y: ${currentY_nonFragile}, current max shelf height: ${shelfMaxHeight_nonFragile}`);
  }

  console.log(`Max height reached by non-fragile boxes: ${maxHeightOfNonFragile}`);
  console.log("--- Packing Fragile Boxes ---");

  // --- Phase 2: Pack Fragile Boxes ---
  let currentX_fragile = 0;
  let currentY_fragile = maxHeightOfNonFragile > 0 ? maxHeightOfNonFragile + GAP : 0; // Start fragile boxes above non-fragile
  let currentZ_fragile = 0;
  let shelfMaxHeight_fragile = 0;
  let rowMaxDepth_fragile = 0;

  console.log(`Fragile boxes start Y: ${currentY_fragile}`);
  for (const box of fragileBoxes) {
    const boxLength = box.dimensions.length;
    const boxWidth = box.dimensions.width;
    const boxHeight = box.dimensions.height;

    if (
      boxLength > truckDimensions.length ||
      boxWidth > truckDimensions.width ||
      boxHeight > truckDimensions.height
    ) {
      console.warn(`Fragile Box ${box.id} is too large for the truck and will be skipped.`);
      continue;
    }

    // Check if the box fits in the current X-row
    if (currentX_fragile + boxLength > truckDimensions.length) {
      currentX_fragile = 0;
      currentZ_fragile += rowMaxDepth_fragile + GAP;
      rowMaxDepth_fragile = 0;
    }

    // Check if the box fits in the current Z-lane
    if (currentZ_fragile + boxWidth > truckDimensions.width) {
      currentX_fragile = 0;
      currentZ_fragile = 0;
      currentY_fragile += shelfMaxHeight_fragile + GAP;
      shelfMaxHeight_fragile = 0;
      rowMaxDepth_fragile = 0;
    }

    // Check if box fits within total truck height
    if (currentY_fragile + boxHeight > truckDimensions.height) {
      console.warn(`Fragile Box ${box.id} would exceed truck height and will be skipped.`);
      continue;
    }

    positionedBoxes.push({
      ...box,
      position: {
        x: currentX_fragile,
        y: currentY_fragile,
        z: currentZ_fragile
      }
    });

    currentX_fragile += boxLength + GAP;
    rowMaxDepth_fragile = Math.max(rowMaxDepth_fragile, boxWidth);
    shelfMaxHeight_fragile = Math.max(shelfMaxHeight_fragile, boxHeight);

    console.log(`Fragile Box ${box.id} positioned at Y: ${currentY_fragile}, current max shelf height: ${shelfMaxHeight_fragile}`);
  }

  return positionedBoxes;
};

// Calculate space utilization percentage
export const calculateSpaceUtilization = (boxes: Box[], truckDimensions: TruckDimensions): number => {
  const truckVolume = truckDimensions.length * truckDimensions.width * truckDimensions.height;
  const totalBoxVolume = boxes.reduce((sum, box) => {
    return sum + (box.dimensions.length * box.dimensions.width * box.dimensions.height);
  }, 0);

  // Calculate utilization percentage and cap it at 100%
  const utilization = (totalBoxVolume / truckVolume) * 100;
  return Math.min(Math.round(utilization), 100);
};
