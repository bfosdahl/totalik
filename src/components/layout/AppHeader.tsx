import { Bell, Search, User, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-6">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Søk i systemet..."
          className="pl-10 bg-secondary/50 border-transparent focus:border-primary/30 focus:bg-background"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <HelpCircle className="w-5 h-5 text-muted-foreground" />
        </Button>
        
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
          >
            3
          </Badge>
        </Button>

        <div className="w-px h-8 bg-border mx-2" />

        <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-primary">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium">Ola Nordmann</span>
            <span className="text-xs text-muted-foreground">Administrator</span>
          </div>
        </button>
      </div>
    </header>
  );
}
