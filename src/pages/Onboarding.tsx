import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    // In a real app, you'd save onboarding status to user data
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Welcome to AnyDay Outfitters!</CardTitle>
          <CardDescription className="text-lg mt-2">Your smart outfit planning and digital wardrobe assistant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Let's get you set up to revolutionize your daily style.
          </p>
          <Button onClick={handleStart} className="w-full py-3 text-lg">
            Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;