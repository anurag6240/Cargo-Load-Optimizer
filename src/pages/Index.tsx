
import { Link } from "react-router-dom";
import { Truck, Package, BarChart3, FileText, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Index = () => {
  const features = [
    {
      icon: Package,
      title: "3D Truck Loading",
      description: "Visualize box placement with intelligent stacking algorithms",
      link: "/load",
      color: "text-blue-600"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track delivery metrics and space utilization",
      link: "/dashboard",
      color: "text-green-600"
    },
    {
      icon: FileText,
      title: "Delivery Reports",
      description: "Generate PDF reports with QR codes",
      link: "/report",
      color: "text-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-600 rounded-full">
              <Truck className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SmartLoad 3D
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Optimize truck space and manage inventory from warehouse to last-mile delivery 
            with intelligent 3D visualization and advanced logistics analytics
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/load">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Start Loading <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/add-box">
              <Button variant="outline" size="lg">
                Add New Box
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="group hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors">
                      <Icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Link to={feature.link}>
                    <Button variant="ghost" className="w-full group-hover:bg-gray-50">
                      Explore Feature
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Current Logistics Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">50</div>
              <div className="text-gray-600">Active Boxes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">5</div>
              <div className="text-gray-600">Retail Partners</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">82%</div>
              <div className="text-gray-600">Truck Utilization</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">12</div>
              <div className="text-gray-600">Deliveries Today</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
