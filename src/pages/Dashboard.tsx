import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Package, Truck, AlertTriangle, TrendingUp, Ruler, Percent, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Box, defaultTruckDimensions } from "@/data/dummyData";
import { calculateSpaceUtilization } from "@/utils/boxStacking";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
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
      console.error('Error fetching boxes for dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoxes();

    const subscription = supabase
      .channel('dashboard_boxes_changes')
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

  const totalBoxes = boxes.length;
  const fragileBoxes = boxes.filter(box => box.isFragile).length;
  const totalWeight = boxes.reduce((sum, box) => sum + box.weight, 0);

  const spaceUtilization = useMemo(() => {
    return calculateSpaceUtilization(boxes, defaultTruckDimensions);
  }, [boxes]);

  const boxesByDestination = useMemo(() => {
    return boxes.reduce((acc, box) => {
      acc[box.destination] = (acc[box.destination] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [boxes]);

  const chartData = Object.entries(boxesByDestination).map(([destination, count]) => ({
    destination,
    count,
  }));

  const monthlyVolumeData = useMemo(() => {
    const volumeMap: Record<string, number> = {};
    boxes.forEach(box => {
      const month = new Date(box.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
      volumeMap[month] = (volumeMap[month] || 0) + 1;
    });

    // Sort by month (basic sorting, ideally use a date library for proper chronological sort)
    const sortedMonths = Object.keys(volumeMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return sortedMonths.map(month => ({
      month,
      volume: volumeMap[month],
    }));
  }, [boxes]);

  const itemTypesData = useMemo(() => [
    { name: "Regular", value: totalBoxes - fragileBoxes, color: "#3b82f6" },
    { name: "Fragile", value: fragileBoxes, color: "#ef4444" }
  ], [totalBoxes, fragileBoxes]);

  console.log("Total Boxes:", totalBoxes);
  console.log("Fragile Boxes:", fragileBoxes);
  console.log("Item Types Data:", itemTypesData);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading dashboard data...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Track delivery metrics and optimize logistics performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Boxes</p>
                <p className="text-2xl font-bold text-gray-900">{totalBoxes}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Space Utilization</p>
                <p className="text-2xl font-bold text-gray-900">{spaceUtilization.toFixed(2)}%</p>
              </div>
              <Truck className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-4">
              <Progress value={spaceUtilization} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fragile Items</p>
                <p className="text-2xl font-bold text-gray-900">{fragileBoxes}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Weight</p>
                <p className="text-2xl font-bold text-gray-900">{totalWeight.toFixed(2)} kg</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Retailer Deliveries Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Deliveries by Destination</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="destination" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Volume Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Shipment Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyVolumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Fragile vs Regular Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Item Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={itemTypesData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {itemTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm">Regular</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm">Fragile</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {boxes.slice(0, 5).map((box) => (
                <div key={box.id} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${box.isFragile ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                  <span className="text-sm font-medium">Box {box.id.substring(0, 6)}... to {box.destination}</span>
                  <Badge variant="outline">{box.weight.toFixed(1)} kg</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Boxes by Destination Chart (Moved and renamed for clarity) */}
        <Card>
          <CardHeader>
            <CardTitle>Overview by Destination</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {Object.entries(boxesByDestination).sort(([, a], [, b]) => b - a).map(([destination, count]) => (
                <li key={destination} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <span className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" /> {destination}
                  </span>
                  <Badge>{count} boxes</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
