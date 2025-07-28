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
import { MapPin, Mail, Lock, Phone, ArrowLeft, User } from 'lucide-react';
import Header from '@/components/layout/Header';
import { initAnimations, cleanupAnimations } from '@/lib/gsap';

interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  name: string;
  role: UserRole;
}

interface LocationData {
  latitude: number;
  longitude: number;
}

const SignUp: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationAccess, setLocationAccess] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
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
  } = useForm<SignUpFormData>({
    defaultValues: {
      role: 'vendor',
    },
  });

  const selectedRole = watch('role');
  const password = watch('password');

  // Set role from navigation state if available
  useEffect(() => {
    if (location.state?.selectedRole) {
      setValue('role', location.state.selectedRole);
    }
  }, [location.state, setValue]);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocationData(locationData);
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

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      // For Google signup, we need to prompt for additional information
      // since Google doesn't provide phone number
      if (selectedRole === 'vendor') {
        toast({
          title: "Additional Information Required",
          description: "Please use email signup for vendors to provide complete information including phone number.",
          variant: "destructive",
        });
        setIsGoogleLoading(false);
        return;
      }
      
      await loginWithGoogle(selectedRole);
      
      toast({
        title: "Account Created Successfully",
        description: `Welcome to SupplyLink! Redirecting to your ${selectedRole} dashboard.`,
      });

      // Redirect based on role
      const redirectPath = selectedRole === 'supplier' ? '/supplier-dashboard' : '/vendor-dashboard';
      navigate(redirectPath, { replace: true });
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message || "Failed to sign up with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    
    try {
      // Create user data for Firebase
      const userData = {
        role: data.role,
        name: data.name,
        phone: data.phone,
        location: locationData || undefined,
      };

      await signup(data.email, data.password, userData);
      
      // If supplier, update location in backend
      if (data.role === 'supplier' && locationData) {
        try {
          // Get supplier _id from localStorage or backend (assumes signup sets it)
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          if (user && user.uid) {
            await fetch(`${import.meta.env.VITE_API_URL || 'https://supplylink-ck4s.onrender.com'}/api/suppliers/location`, {
              method: 'PATCH',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await user.getIdToken()}`
              },
              body: JSON.stringify({
                lat: locationData.latitude,
                lng: locationData.longitude
              })
            });
          }
        } catch (e) {
          // Ignore location update errors for now
          console.log('Location update failed:', e);
        }
      }

      toast({
        title: "Account Created Successfully",
        description: `Welcome to SupplyLink! Redirecting to your ${data.role} dashboard.`,
      });

      // Redirect based on role
      const redirectPath = data.role === 'supplier' ? '/supplier-dashboard' : '/vendor-dashboard';
      navigate(redirectPath, { replace: true });
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message || "Failed to create account. Please try again.",
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
              <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
              <CardDescription>
                Join SupplyLink to connect with partners worldwide
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Google Sign Up */}
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleGoogleSignUp}
                disabled={isGoogleLoading}
                type="button"
              >
                {isGoogleLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Creating Account...
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

              {/* Sign Up Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="focus:ring-2 focus:ring-cyan-400 transition-all duration-300"
                    {...register('name', {
                      required: 'Full name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters',
                      },
                    })}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

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

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    className="focus:ring-2 focus:ring-cyan-400 transition-all duration-300"
                    {...register('phone', {
                      required: 'Phone number is required',
                      pattern: {
                        value: /^[+]?[\d\s\-\(\)]{10,}$/,
                        message: 'Invalid phone number',
                      },
                    })}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
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

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    className="focus:ring-2 focus:ring-cyan-400 transition-all duration-300"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) =>
                        value === password || 'Passwords do not match',
                    })}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
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
                  {locationData && (
                    <p className="text-xs text-muted-foreground">
                      Location: {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Help us connect you with nearby {selectedRole === 'supplier' ? 'vendors' : 'suppliers'}
                  </p>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Creating Account...
                    </div>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>

              {/* Login Link */}
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link to="/login" className="text-primary hover:underline">
                  Sign in here
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SignUp;