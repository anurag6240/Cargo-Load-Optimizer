import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Package, Weight, MapPin, Calendar } from "lucide-react";
import { defaultTruckDimensions, Box } from "@/data/dummyData";
import { calculateSpaceUtilization } from "@/utils/boxStacking";
import jsPDF from "jspdf";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const Report = () => {
  const { toast } = useToast();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBoxes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('boxes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        setBoxes([]);
        return;
      }

      const transformedBoxes = data.map(box => {
        const dimensions = typeof box.dimensions === 'string' 
          ? JSON.parse(box.dimensions)
          : box.dimensions || { length: 0, width: 0, height: 0 };

        return {
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
      });
      setBoxes(transformedBoxes);
    } catch (error: any) {
      console.error('Error fetching boxes for report:', error);
      toast({
        title: "Error",
        description: "Failed to load report data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoxes();

    const subscription = supabase
      .channel('report_boxes_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'boxes' 
        }, 
        () => {
          fetchBoxes();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const utilization = calculateSpaceUtilization(boxes, defaultTruckDimensions);
  const totalWeight = boxes.reduce((sum, box) => sum + box.weight, 0);
  const fragileCount = boxes.filter(box => box.isFragile).length;

  const generatePDF = () => {
    const pdf = new jsPDF();
    
    // Header
    pdf.setFontSize(20);
    pdf.text("SmartLoad 3D - Delivery Report", 20, 30);
    
    // Date
    pdf.setFontSize(12);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
    
    // Summary
    pdf.setFontSize(14);
    pdf.text("Summary", 20, 65);
    pdf.setFontSize(10);
    pdf.text(`Total Boxes: ${boxes.length}`, 20, 75);
    pdf.text(`Total Weight: ${totalWeight.toFixed(1)}kg`, 20, 85);
    pdf.text(`Fragile Items: ${fragileCount}`, 20, 95);
    pdf.text(`Space Utilization: ${utilization.toFixed(2)}%`, 20, 105);
    
    // Box Details
    pdf.setFontSize(14);
    pdf.text("Box Details", 20, 125);
    
    let yPosition = 135;
    boxes.forEach((box, index) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(10);
      pdf.text(`${box.id} - ${box.destination}`, 20, yPosition);
      pdf.text(`${box.dimensions.length}×${box.dimensions.width}×${box.dimensions.height}cm, ${box.weight}kg`, 20, yPosition + 8);
      pdf.text(box.isFragile ? "FRAGILE" : "Standard", 20, yPosition + 16);
      
      yPosition += 25;
    });
    
    pdf.save("delivery-report.pdf");
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading report data...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Delivery Report</h1>
        <p className="text-gray-600">Generate and download comprehensive delivery reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Summary Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold">{boxes.length}</div>
                <div className="text-sm text-gray-600">Total Boxes</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Weight className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">{totalWeight.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Total Weight (kg)</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <div className="text-2xl font-bold">{fragileCount}</div>
                <div className="text-sm text-gray-600">Fragile Items</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{utilization.toFixed(2)}%</div>
                <div className="text-sm text-gray-600">Space Used</div>
              </CardContent>
            </Card>
          </div>

          {/* Box List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Box Inventory</CardTitle>
                <Button onClick={generatePDF} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {boxes.map((box) => (
                  <div key={box.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{box.id}</span>
                        <Badge variant={box.isFragile ? "destructive" : "secondary"}>
                          {box.isFragile ? "Fragile" : "Standard"}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {box.destination}
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {box.dimensions.length}×{box.dimensions.width}×{box.dimensions.height}cm
                        </div>
                        <div className="flex items-center gap-1">
                          <Weight className="h-3 w-3" />
                          {box.weight}kg
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <QRCodeSVG
                        value={JSON.stringify({
                          id: box.id,
                          destination: box.destination,
                          weight: box.weight
                        })}
                        size={50}
                        level="M"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Report Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={generatePDF} className="w-full" size="lg">
                <Download className="h-4 w-4 mr-2" />
                Generate PDF Report
              </Button>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Report Includes:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Complete box inventory</li>
                  <li>• Weight and dimension details</li>
                  <li>• Destination information</li>
                  <li>• Fragile item indicators</li>
                  <li>• Space utilization metrics</li>
                </ul>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-800">Generated:</h4>
                <p className="text-sm text-blue-600">{new Date().toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Report;
