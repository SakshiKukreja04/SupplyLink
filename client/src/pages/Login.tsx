import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Mail, Lock, ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import { initAnimations, cleanupAnimations } from '@/lib/gsap';

interface LoginFormData {
  email: string;
  password: string;
  role: UserRole;
}

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [locationAccess, setLocationAccess] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    initAnimations();
    return () => cleanupAnimations();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      role: 'vendor',
    },
  });

  const selectedRole = watch('role');

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationAccess(true);
          toast({
            title: "Location Access Granted",
            description: "Your location has been successfully captured.",
          });
        },
        (error) => {
          toast({
            title: "Location Access Denied",
            description: "Please enable location access for better experience.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle(selectedRole);
      
      toast({
        title: "Login Successful",
        description: `Welcome back! Redirecting to your ${selectedRole} dashboard.`,
      });

      // Redirect based on role or intended destination
      const from = location.state?.from?.pathname;
      const redirectPath = from || (selectedRole === 'supplier' ? '/supplier-dashboard' : '/vendor-dashboard');
      navigate(redirectPath, { replace: true });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      await login(data.email, data.password, data.role);
      
      // If supplier, update location in backend
      if (data.role === 'supplier' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          try {
            // Get supplier _id from localStorage or backend (assumes login sets it)
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user && user.uid) {
              await fetch('/api/suppliers/location', {
                method: 'PATCH',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${await user.getIdToken()}`
                },
                body: JSON.stringify({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                })
              });
            }
          } catch (e) {
            // Ignore location update errors for now
            console.log('Location update failed:', e);
          }
        });
      }

      toast({
        title: "Login Successful",
        description: `Welcome back! Redirecting to your ${data.role} dashboard.`,
      });

      // Redirect based on role or intended destination
      const from = location.state?.from?.pathname;
      const redirectPath = from || (data.role === 'supplier' ? '/supplier-dashboard' : '/vendor-dashboard');
      navigate(redirectPath, { replace: true });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Header />
      
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="form-section w-full max-w-md">
          {/* Back to Home */}
          <Link 
            to="/" 
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <Card className="shadow-xl rounded-lg border-0 bg-white/80 backdrop-blur">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your SupplyLink account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Google Login */}
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                type="button"
              >
                {isGoogleLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Signing In...
                  </div>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Continue with Google
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    className="focus:ring-2 focus:ring-cyan-400 transition-all duration-300"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="focus:ring-2 focus:ring-cyan-400 transition-all duration-300"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <Label>I am a:</Label>
                  <RadioGroup
                    value={selectedRole}
                    onValueChange={(value: UserRole) => setValue('role', value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="supplier" id="supplier" />
                      <Label htmlFor="supplier">Supplier</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="vendor" id="vendor" />
                      <Label htmlFor="vendor">Vendor</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Location Access */}
                <div className="space-y-2">
                  <Label>Location Access</Label>
                  <Button
                    type="button"
                    variant={locationAccess ? "default" : "outline"}
                    onClick={requestLocation}
                    className="w-full"
                    disabled={locationAccess}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {locationAccess ? 'Location Granted' : 'Allow Location Access'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Help us provide better local supplier recommendations
                  </p>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Signing In...
                    </div>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              {/* Sign Up Link */}
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link to="/signup" className="text-primary hover:underline">
                  Sign up here
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;