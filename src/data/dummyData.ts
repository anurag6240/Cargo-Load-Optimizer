export interface Box {
  id: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  weight: number;
  destination: string;
  isFragile: boolean;
  createdAt: string;
  position?: {
    x: number;
    y: number;
    z: number;
  };
}

export const retailers = ["Walmart", "Flipkart", "Amazon", "JioMart", "Blinkit"];

export const dummyBoxes: Box[] = [
  {
    id: "BOX001",
    dimensions: { length: 30, width: 20, height: 15 },
    weight: 5.2,
    destination: "Walmart",
    isFragile: false,
    createdAt: "2025-01-15T10:30:00Z"
  },
  {
    id: "BOX002",
    dimensions: { length: 25, width: 25, height: 10 },
    weight: 2.8,
    destination: "Amazon",
    isFragile: true,
    createdAt: "2025-01-15T11:15:00Z"
  },
  {
    id: "BOX003",
    dimensions: { length: 40, width: 30, height: 25 },
    weight: 12.5,
    destination: "Flipkart",
    isFragile: false,
    createdAt: "2025-01-15T12:00:00Z"
  },
  {
    id: "BOX004",
    dimensions: { length: 15, width: 15, height: 20 },
    weight: 1.5,
    destination: "JioMart",
    isFragile: true,
    createdAt: "2025-01-15T13:45:00Z"
  },
  {
    id: "BOX005",
    dimensions: { length: 35, width: 25, height: 18 },
    weight: 8.7,
    destination: "Blinkit",
    isFragile: false,
    createdAt: "2025-01-15T14:20:00Z"
  }
];

export const monthlyVolumeData = [
  { month: "Jan", volume: 145 },
  { month: "Feb", volume: 168 },
  { month: "Mar", volume: 192 },
  { month: "Apr", volume: 178 },
  { month: "May", volume: 205 }
];

export const retailerDeliveryData = retailers.map(retailer => ({
  retailer,
  deliveries: Math.floor(Math.random() * 15) + 5
}));

export const defaultTruckDimensions = {
  length: 1000, // 10 meters in cm
  width: 250,   // 2.5 meters in cm
  height: 300   // 3 meters in cm
};
