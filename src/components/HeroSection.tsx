import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, Users, Calendar, BookOpen, BadgeCheck, Search, Award } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-hero-pattern -z-10"></div>
      <div className="container max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Peer-to-peer skill exchange</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tighter">
              Exchange <span className="text-gradient">Skills</span>,<br />
              Grow <span className="text-gradient">Together</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              A peer-to-peer platform where you can teach what you know and learn what you don't. No payments, just skills.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <AnimatePresence>
                {!user && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link to="/signup">
                      <Button size="lg" className="w-full sm:w-auto group transition-all duration-300 hover:scale-105">
                        Join SkillSwap
                        <Users className="ml-2 h-4 w-4 transition-transform group-hover:scale-110" />
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
              <Link to="/marketplace">
                <Button size="lg" variant="outline" className="w-full sm:w-auto group hover:bg-accent/40 transition-all duration-300">
                  Explore Skills
                  <BookOpen className="ml-2 h-4 w-4 transition-transform group-hover:rotate-6" />
                </Button>
              </Link>
            </div>
          </div>
          
          {/* 3D Card Stack - Redesigned to match reference image */}
          <div className="relative">
            <div className="perspective-3d">
              <div className="card-stack">
                {/* Background cards */}
                <div className="card-layer card-layer-3 bg-[#8B5CF6]/30 rounded-2xl shadow-xl"></div>
                <div className="card-layer card-layer-2 bg-primary/40 rounded-2xl shadow-xl"></div>
                <div className="card-layer card-layer-1 bg-[#9b87f5]/50 rounded-2xl shadow-xl"></div>
                
                {/* Main Card */}
                <div className="card-main rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#1A1F2C] to-[#2A2F3C] border border-primary/20">
                  <div className="p-6 text-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-4 p-4 hover:bg-white/5 rounded-lg transition-colors duration-300">
                        <div className="h-12 w-12 rounded-full bg-primary/30 flex items-center justify-center">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Create Profile</h3>
                        <p className="text-sm text-gray-300">
                          List skills you can teach and skills you want to learn
                        </p>
                      </div>
                      <div className="flex flex-col gap-4 p-4 hover:bg-white/5 rounded-lg transition-colors duration-300">
                        <div className="h-12 w-12 rounded-full bg-primary/30 flex items-center justify-center">
                          <BadgeCheck className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Get Verified</h3>
                        <p className="text-sm text-gray-300">
                          Complete skill assessments to earn verification badges
                        </p>
                      </div>
                      <div className="flex flex-col gap-4 p-4 hover:bg-white/5 rounded-lg transition-colors duration-300">
                        <div className="h-12 w-12 rounded-full bg-primary/30 flex items-center justify-center">
                          <Search className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Find Matches</h3>
                        <p className="text-sm text-gray-300">
                          Discover people with complementary skill sets
                        </p>
                      </div>
                      <div className="flex flex-col gap-4 p-4 hover:bg-white/5 rounded-lg transition-colors duration-300">
                        <div className="h-12 w-12 rounded-full bg-primary/30 flex items-center justify-center">
                          <Award className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Exchange Skills</h3>
                        <p className="text-sm text-gray-300">
                          Schedule sessions and grow together
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-primary/30 z-[-1] blur-sm"></div>
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-[#8B5CF6]/20 z-[-1] blur-sm"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
