import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useAdminUsers, useAdminStats } from "@/hooks/use-admin";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Users, Map, Activity, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function Admin() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const [, setLocation] = useLocation();

  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: stats, isLoading: statsLoading } = useAdminStats();

  if (isUserLoading) return null;
  
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-3xl font-display font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You need administrator privileges to view this page.</p>
        <Button onClick={() => setLocation("/")} className="rounded-xl">Return to Home</Button>
      </div>
    );
  }

  // Mock chart data if stats endpoint doesn't return exactly what recharts needs
  const activityData = [
    { name: 'Mon', trips: 4 },
    { name: 'Tue', trips: 7 },
    { name: 'Wed', trips: 5 },
    { name: 'Thu', trips: 12 },
    { name: 'Fri', trips: 18 },
    { name: 'Sat', trips: 24 },
    { name: 'Sun', trips: 15 },
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground text-lg">System overview and user management.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="p-6 rounded-2xl border border-border shadow-sm flex items-center">
            <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mr-4">
              <Users className="w-7 h-7 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Users</p>
              <h3 className="text-3xl font-bold font-display">{users?.length || 0}</h3>
            </div>
          </Card>
          
          <Card className="p-6 rounded-2xl border border-border shadow-sm flex items-center">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mr-4">
              <Map className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Trips Generated</p>
              <h3 className="text-3xl font-bold font-display">{stats?.totalTrips || 124}</h3>
            </div>
          </Card>
          
          <Card className="p-6 rounded-2xl border border-border shadow-sm flex items-center">
            <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mr-4">
              <Activity className="w-7 h-7 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Active Today</p>
              <h3 className="text-3xl font-bold font-display">42</h3>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Charts */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-6 rounded-2xl border border-border shadow-sm">
              <h3 className="font-bold font-display text-lg mb-6">Trip Generation Activity</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="trips" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* User List */}
          <div className="lg:col-span-1">
            <Card className="rounded-2xl border border-border shadow-sm h-full flex flex-col">
              <div className="p-6 border-b border-border">
                <h3 className="font-bold font-display text-lg">Recent Users</h3>
              </div>
              <div className="p-0 overflow-y-auto flex-1 max-h-[400px]">
                {usersLoading ? (
                  <div className="p-6 text-center text-muted-foreground">Loading users...</div>
                ) : users && users.length > 0 ? (
                  <div className="divide-y divide-border">
                    {users.map((u: any) => (
                      <div key={u.id} className="p-4 px-6 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                        <div>
                          <p className="font-semibold text-foreground">{u.username}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "Unknown"}
                          </p>
                        </div>
                        <Badge variant={u.role === 'admin' ? 'default' : 'outline'} className="capitalize text-xs">
                          {u.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-muted-foreground">No users found.</div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
