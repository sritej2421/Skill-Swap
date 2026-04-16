
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

// Define the login form schema
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle login submission
  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      await signIn(values.email, values.password);
      toast({
        title: "Login successful!",
        description: "You have successfully logged into your account.",
      });
      navigate("/");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="relative flex-grow flex flex-col justify-center items-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-login-mountains z-0">
          {/* Animated Blob */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl animate-blob"></div>
          <div className="absolute bottom-1/3 left-1/3 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 right-1/2 w-96 h-96 rounded-full bg-pink-500/20 blur-3xl animate-blob animation-delay-4000"></div>
          
          {/* Particles Effect */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <div 
                key={i}
                className="absolute bg-white rounded-full animate-float"
                style={{
                  width: Math.random() * 4 + 1 + "px",
                  height: Math.random() * 4 + 1 + "px",
                  top: Math.random() * 100 + "%",
                  left: Math.random() * 100 + "%",
                  opacity: Math.random() * 0.5 + 0.1,
                  animationDuration: Math.random() * 15 + 10 + "s",
                  animationDelay: Math.random() * 5 + "s"
                }}
              />
            ))}
          </div>
          
          {/* Soft gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>
        </div>
        
        {/* Login Card */}
        <motion.div 
          className="relative w-full max-w-md z-10 px-4"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-white font-playfair">Welcome Back to SkillSwap</h1>
            <p className="text-purple-200 mt-2">Continue growing through skill exchange</p>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card className="backdrop-blur-xl bg-black/40 border-purple-500/30 shadow-xl">
              <CardHeader className="space-y-1 px-6">
                <CardTitle className="text-xl font-semibold text-white text-center">Sign In</CardTitle>
                <CardDescription className="text-purple-200 text-center">
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-white">Email</FormLabel>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-300" />
                            <FormControl>
                              <Input 
                                placeholder="Enter your email" 
                                {...field} 
                                className="pl-10 bg-black/30 border-purple-500/30 text-white placeholder:text-purple-200 focus:border-purple-400 focus:ring-purple-400/30 transition-all"
                              />
                            </FormControl>
                          </div>
                          <FormMessage className="text-rose-300 text-xs" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-white">Password</FormLabel>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-300" />
                            <FormControl>
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="••••••••" 
                                {...field} 
                                className="pl-10 pr-10 bg-black/30 border-purple-500/30 text-white placeholder:text-purple-200 focus:border-purple-400 focus:ring-purple-400/30 transition-all"
                              />
                            </FormControl>
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <FormMessage className="text-rose-300 text-xs" />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 transform hover:translate-y-[-2px] active:translate-y-[0px]" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="px-2 text-purple-200 bg-black/30 backdrop-blur-sm">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button 
                      variant="google" 
                      className="w-full" 
                      disabled={isLoading} 
                      onClick={() => console.log("Google sign-in not implemented")}
                    >
                      <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512" fill="#4285F4">
                        <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                      </svg>
                      <span className="font-medium">Continue with Google</span>
                    </Button>
                  </div>
                </div>
                
                <div className="mt-6 text-center text-sm">
                  <span className="text-purple-200">New here? </span>
                  <Link to="/signup" className="text-purple-400 hover:text-white font-medium hover:underline transition-colors">
                    Create your account
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
