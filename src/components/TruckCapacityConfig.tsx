import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Truck } from "lucide-react";

interface TruckDimensions {
  length: number;
  width: number;
  height: number;
}

interface TruckCapacityConfigProps {
  dimensions: TruckDimensions;
  onDimensionsChange: (dimensions: TruckDimensions) => void;
}

const TruckCapacityConfig = ({ dimensions, onDimensionsChange }: TruckCapacityConfigProps) => {
  const handleChange = (field: keyof TruckDimensions, value: string) => {
    const numValue = parseFloat(value) || 0;
    onDimensionsChange({
      ...dimensions,
      [field]: numValue
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Truck Capacity Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="length">Length (cm)</Label>
              <Input
                id="length"
                type="number"
                value={dimensions.length}
                onChange={(e) => handleChange('length', e.target.value)}
                min="1"
                placeholder="Length"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="width">Width (cm)</Label>
              <Input
                id="width"
                type="number"
                value={dimensions.width}
                onChange={(e) => handleChange('width', e.target.value)}
                min="1"
                placeholder="Width"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                value={dimensions.height}
                onChange={(e) => handleChange('height', e.target.value)}
                min="1"
                placeholder="Height"
              />
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <div className="font-medium mb-1">Current Capacity:</div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-gray-500">Volume:</span>
                  <span className="ml-2 font-medium">
                    {((dimensions.length * dimensions.width * dimensions.height) / 1000000).toFixed(2)} m³
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Length:</span>
                  <span className="ml-2 font-medium">{dimensions.length} cm</span>
                </div>
                <div>
                  <span className="text-gray-500">Width:</span>
                  <span className="ml-2 font-medium">{dimensions.width} cm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TruckCapacityConfig; 