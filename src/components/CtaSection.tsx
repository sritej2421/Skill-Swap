
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="relative perspective-card">
          <div className="cta-card-stack">
            <div className="cta-card-layer cta-card-layer-1 bg-primary/5 rounded-2xl"></div>
            <div className="cta-card-layer cta-card-layer-2 bg-primary/10 rounded-2xl"></div>
            <div className="cta-card-layer cta-card-layer-3 bg-primary/20 rounded-2xl"></div>
            <div className="cta-card-main rounded-2xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 group-hover:from-primary/30 group-hover:to-primary/10 transition-colors duration-300"></div>
              <div className="gradient-border p-12 md:p-16 flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                  <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Ready to Start Your Learning Journey?
                </h2>
                <p className="text-muted-foreground max-w-2xl mb-8">
                  Join SkillSwap today and connect with people who can help you grow while sharing your expertise with others.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/signup">
                    <Button 
                      size="lg" 
                      className="min-w-32 group transition-all duration-300 bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg hover:shadow-primary/20"
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/how-it-works">
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="min-w-32 hover:bg-accent/40 transition-all duration-300 border-primary/30 text-primary hover:text-primary/80"
                    >
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
