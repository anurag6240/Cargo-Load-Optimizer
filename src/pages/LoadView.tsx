import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Weight, MapPin, Edit2, Trash2 } from "lucide-react";
import { calculateBoxPositions, calculateSpaceUtilization } from "@/utils/boxStacking";
import TruckVisualization from "@/components/TruckVisualization";
import TruckCapacityConfig from "@/components/TruckCapacityConfig";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";
import { Box } from "@/data/dummyData";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { retailers } from "@/data/dummyData";

const defaultTruckDimensions = {
  length: 1000, // 10 meters in cm
  width: 250,   // 2.5 meters in cm
  height: 300   // 3 meters in cm
};

const LoadView = () => {
  const { toast } = useToast();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [truckDimensions, setTruckDimensions] = useState(defaultTruckDimensions);
  const [editingBox, setEditingBox] = useState<Box | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    length: "",
    width: "",
    height: "",
    weight: "",
    destination: "",
    isFragile: false
  });

  // Calculate positioned boxes and utilization using useMemo
  const positionedBoxes = useMemo(() => {
    console.log('Calculating positions for boxes:', boxes);
    const positions = calculateBoxPositions(boxes, truckDimensions);
    console.log('Calculated positions:', positions);
    return positions;
  }, [boxes, truckDimensions]);

  const utilization = useMemo(() => {
    console.log('Calculating utilization for boxes:', boxes);
    const util = calculateSpaceUtilization(boxes, truckDimensions);
    console.log('Calculated utilization:', util);
    return util;
  }, [boxes, truckDimensions]);

  const fetchBoxes = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching boxes from Supabase...');
      
      const { data, error } = await supabase
        .from('boxes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('No boxes found in database');
        setBoxes([]);
        return;
      }

      console.log('Raw data from Supabase:', data);

      // Transform the data to match our Box interface
      const transformedBoxes = data.map(box => {
        // Ensure dimensions is an object
        const dimensions = typeof box.dimensions === 'string' 
          ? JSON.parse(box.dimensions)
          : box.dimensions || { length: 0, width: 0, height: 0 };

        const transformedBox = {
          id: box.id,
          dimensions: {
            length: Number(dimensions.length) || 0,
            width: Number(dimensions.width) || 0,
            height: Number(dimensions.height) || 0
          },
          weight: Number(box.weight) || 0,
          destination: box.destination || '',
          isFragile: Boolean(box.is_fragile),
          createdAt: box.created_at,
          position: box.position || { x: 0, y: 0, z: 0 }
        };

        console.log('Transformed box:', transformedBox);
        return transformedBox;
      });

      console.log('All transformed boxes:', transformedBoxes);
      setBoxes(transformedBoxes);
    } catch (error: any) {
      console.error('Error fetching boxes:', error);
      toast({
        title: "Error",
        description: "Failed to load boxes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscription only
  useEffect(() => {
    // Initial fetch
    fetchBoxes();

    // Set up real-time subscription
    const subscription = supabase
      .channel('boxes_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'boxes' 
        }, 
        (payload) => {
          console.log('Change detected in database:', payload);
          fetchBoxes();
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Monitor state changes
  useEffect(() => {
    console.log('Current boxes state:', boxes);
    console.log('Positioned boxes:', positionedBoxes);
  }, [boxes, positionedBoxes]);

  const handleEditBox = (box: Box) => {
    setEditingBox(box);
    setEditForm({
      id: box.id,
      length: box.dimensions.length.toString(),
      width: box.dimensions.width.toString(),
      height: box.dimensions.height.toString(),
      weight: box.weight.toString(),
      destination: box.destination,
      isFragile: box.isFragile
    });
    setIsEditDialogOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingBox(null);
    setIsEditDialogOpen(false);
  };

  const handleUpdateBox = async () => {
    if (!editingBox) return;

    try {
      const updatedBox = {
        id: editForm.id,
        dimensions: {
          length: Number(editForm.length),
          width: Number(editForm.width),
          height: Number(editForm.height)
        },
        weight: Number(editForm.weight),
        destination: editForm.destination,
        is_fragile: editForm.isFragile
      };

      const { error } = await supabase
        .from('boxes')
        .update(updatedBox)
        .eq('id', editingBox.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Box updated successfully",
      });

      fetchBoxes();
      handleCancelEdit();
    } catch (error: any) {
      console.error('Error updating box:', error);
      toast({
        title: "Error",
        description: "Failed to update box. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBox = async (boxId: string) => {
    try {
      const { error } = await supabase
        .from('boxes')
        .delete()
        .eq('id', boxId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Box deleted successfully",
      });

      fetchBoxes();
    } catch (error: any) {
      console.error('Error deleting box:', error);
      toast({
        title: "Error",
        description: "Failed to delete box. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    fetchBoxes();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading boxes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">3D Truck Load View</h1>
        <p className="text-gray-600">Interactive 3D visualization of box placement and stacking</p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3D Visualization */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Truck Loading Visualization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gray-100 rounded-lg">
                <TruckVisualization 
                  boxes={positionedBoxes} 
                  truckDimensions={truckDimensions}
                />
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Space Utilization</span>
                  <span className="text-sm font-bold">{utilization}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      utilization > 100 ? 'bg-red-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(utilization, 100)}%` }}
                  ></div>
                </div>
                {utilization > 100 && (
                  <p className="text-sm text-red-600 mt-2">
                    Warning: Boxes exceed truck capacity by {utilization - 100}%
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Truck Capacity Config */}
          <TruckCapacityConfig
            dimensions={truckDimensions}
            onDimensionsChange={setTruckDimensions}
          />

        {/* Box List */}
          <Card>
            <CardHeader>
              <CardTitle>Loaded Boxes ({positionedBoxes.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading boxes...</p>
                </div>
              ) : positionedBoxes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No boxes loaded
                </div>
              ) : (
                positionedBoxes.map((box) => (
                <div key={box.id} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">{box.id}</span>
                      <div className="flex gap-2">
                    <Badge variant={box.isFragile ? "destructive" : "secondary"}>
                      {box.isFragile ? "Fragile" : "Standard"}
                    </Badge>
                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditBox(box)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Box</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Dimensions (cm)</Label>
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <Input
                                      type="number"
                                      value={editForm.length}
                                      onChange={(e) => setEditForm({ ...editForm, length: e.target.value })}
                                      placeholder="Length"
                                    />
                                  </div>
                                  <div>
                                    <Input
                                      type="number"
                                      value={editForm.width}
                                      onChange={(e) => setEditForm({ ...editForm, width: e.target.value })}
                                      placeholder="Width"
                                    />
                                  </div>
                                  <div>
                                    <Input
                                      type="number"
                                      value={editForm.height}
                                      onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                                      placeholder="Height"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Weight (kg)</Label>
                                <Input
                                  type="number"
                                  value={editForm.weight}
                                  onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                                  placeholder="Weight"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Destination</Label>
                                <Select
                                  value={editForm.destination}
                                  onValueChange={(value) => setEditForm({ ...editForm, destination: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select destination" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {retailers.map((retailer) => (
                                      <SelectItem key={retailer} value={retailer}>
                                        {retailer}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={editForm.isFragile}
                                  onCheckedChange={(checked) => setEditForm({ ...editForm, isFragile: checked })}
                                />
                                <Label>Fragile</Label>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={handleUpdateBox}>
                                  Save Changes
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBox(box.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {box.dimensions.length}×{box.dimensions.width}×{box.dimensions.height}cm
                    </div>
                    <div className="flex items-center gap-1">
                      <Weight className="h-3 w-3" />
                      {box.weight}kg
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {box.destination}
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="mt-3 flex justify-center">
                    <QRCodeSVG
                      value={JSON.stringify({
                        id: box.id,
                        destination: box.destination,
                        weight: box.weight
                      })}
                      size={60}
                      level="M"
                    />
                  </div>
                </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoadView;
