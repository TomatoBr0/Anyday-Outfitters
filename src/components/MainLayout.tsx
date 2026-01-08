import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, Shirt, Sparkles, Settings, PlusCircle } from 'lucide-react'; // Changed Mirror to Sparkles, removed CalendarDays
import { MadeWithDyad } from './made-with-dyad';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Closet', path: '/closet', icon: Shirt },
  { name: 'Add Item', path: '/add-item', icon: PlusCircle },
  { name: 'Outfits', path: '/outfits', icon: Sparkles }, // Icon changed to Sparkles
  { name: 'Settings', path: '/settings', icon: Settings },
];

const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Top Navigation for larger screens */}
      <nav className="hidden md:flex justify-center p-4 border-b bg-card">
        <ul className="flex space-x-6">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto p-4 md:p-6">
        <Outlet />
      </main>

      {/* Bottom Navigation for mobile screens */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t md:hidden z-50">
        <ul className="flex justify-around py-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center p-2 text-xs transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )
                }
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <MadeWithDyad />
    </div>
  );
};

export default MainLayout;