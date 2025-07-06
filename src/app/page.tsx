"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import dynamic from 'next/dynamic';

import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';

import { FlashFlowLogo } from "@/components/flashflow-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';
import { LoaderCircle } from 'lucide-react';

const Editor = dynamic(() => import('@/components/flashflow/editor').then(mod => mod.Editor), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
    </div>
  ),
});


const Header = () => {
  const { user, userData } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push('/login');
  };
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase();
  }

  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlashFlowLogo />
          <h1 className="text-2xl font-headline font-bold text-foreground">FlashFlow</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || ''} alt={userData?.name || ''} />
                    <AvatarFallback>{userData?.name ? getInitials(userData.name) : <User />}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className='w-56'>
                <DropdownMenuLabel>
                  <p className="font-medium">{userData?.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
     return (
        <div className="flex items-center justify-center h-screen">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Header />
      <main className="flex-1">
        <Editor />
      </main>
    </div>
  );
}
