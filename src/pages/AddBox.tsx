import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { retailers } from "@/data/dummyData";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Package, Plus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AddBox = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    length: "",
    width: "",
    height: "",
    weight: "",
    destination: "",
    isFragile: false
  });

  const generateBoxId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    setFormData({ ...formData, id: `BOX${timestamp}${random}`.toUpperCase() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form data
      if (!formData.id || !formData.length || !formData.width || !formData.height || !formData.weight || !formData.destination) {
        throw new Error("Please fill in all required fields");
      }

      // Convert string values to numbers
      const dimensions = {
        length: Number(formData.length),
        width: Number(formData.width),
        height: Number(formData.height)
      };

      const weight = Number(formData.weight);

      // Validate numeric values
      if (isNaN(dimensions.length) || isNaN(dimensions.width) || isNaN(dimensions.height) || isNaN(weight)) {
        throw new Error("Please enter valid numbers for dimensions and weight");
      }

      // Validate positive values
      if (dimensions.length <= 0 || dimensions.width <= 0 || dimensions.height <= 0 || weight <= 0) {
        throw new Error("Dimensions and weight must be greater than 0");
      }

      console.log('Submitting box data:', {
        id: formData.id,
        dimensions,
        weight,
        destination: formData.destination,
        is_fragile: formData.isFragile
      });

      const { data, error } = await supabase
        .from('boxes')
        .insert([
          {
            id: formData.id,
            dimensions,
            weight,
            destination: formData.destination,
            is_fragile: formData.isFragile
          }
        ])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Box added successfully:', data);

      toast({
        title: "Success",
        description: "Box added successfully",
      });

      // Reset form
      setFormData({
        id: "",
        length: "",
        width: "",
        height: "",
        weight: "",
        destination: "",
        isFragile: false
      });

      // Navigate to load view
      navigate('/load');
    } catch (error: any) {
      console.error('Error adding box:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add box. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Box</h1>
        <p className="text-gray-600">Add a new box to your truck inventory</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Box Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Box ID */}
            <div className="space-y-2">
              <Label htmlFor="boxId">Box ID</Label>
              <div className="flex gap-2">
                <Input
                  id="boxId"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="Enter box ID or generate one"
                  required
                />
                <Button type="button" variant="outline" onClick={generateBoxId}>
                  Generate ID
                </Button>
              </div>
            </div>

            {/* Dimensions */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Dimensions (cm)</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="length">Length</Label>
                  <Input
                    id="length"
                    type="number"
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                    placeholder="cm"
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    placeholder="cm"
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    placeholder="cm"
                    min="1"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="Enter weight in kg"
                min="0.1"
                required
              />
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <Label htmlFor="destination">Destination Retailer</Label>
              <Select
                value={formData.destination}
                onValueChange={(value) => setFormData({ ...formData, destination: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select retailer" />
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

            {/* Fragile Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="fragile"
                checked={formData.isFragile}
                onCheckedChange={(checked) => setFormData({ ...formData, isFragile: checked })}
              />
              <Label htmlFor="fragile">Fragile Item</Label>
            </div>

            {formData.isFragile && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This box will be marked as fragile and positioned accordingly in the truck.
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>Adding Box...</>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Box to Inventory
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddBox;
