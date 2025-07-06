
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle, Mail, Lock, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const googleFormSchema = z.object({
    mobile: z.string().regex(/^\d{10}$/, { message: "Please enter a valid 10-digit mobile number." }),
    dob: z.date({ required_error: "Date of birth is required." }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,34.556,44,29.865,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);


export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { refetchUserData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const googleForm = useForm<z.infer<typeof googleFormSchema>>({
    resolver: zodResolver(googleFormSchema),
    defaultValues: {
        mobile: ""
    },
  });

  const createUserDocument = async (user: FirebaseUser, additionalData: { name?: string, mobile: string, dob: string }) => {
      if (!db) return;
      const userRef = doc(db, 'users', user.uid);
      const data = {
        name: user.displayName || additionalData.name,
        email: user.email,
        mobile: user.phoneNumber || additionalData.mobile,
        dob: additionalData.dob,
        registeredAt: serverTimestamp(),
      };
      await setDoc(userRef, data, { merge: true });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth) {
        toast({
            variant: "destructive",
            title: "Firebase Not Configured",
            description: "Please provide Firebase credentials in the .env file.",
        });
        return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: "Success", description: "Logged in successfully." });
      router.push("/");
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!auth || !db) {
        toast({
            variant: "destructive",
            title: "Firebase Not Configured",
            description: "Please provide Firebase credentials in the .env file.",
        });
        return;
    }
    setIsGoogleLoading(true);
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        
        const userDocRef = doc(db, 'users', result.user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            toast({ title: "Success", description: "Logged in successfully with Google." });
            router.push("/");
        } else {
            setGoogleUser(result.user);
            setIsGoogleModalOpen(true);
        }
    } catch (error: any) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Google Sign-In Failed",
            description: error.message || "Could not sign in with Google.",
        });
    } finally {
        setIsGoogleLoading(false);
    }
  }

  async function onGoogleSubmit(values: z.infer<typeof googleFormSchema>) {
    if (!googleUser || !db) {
         toast({
            variant: "destructive",
            title: "An Error Occurred",
            description: "Could not save your details. Please try again.",
         });
        return;
    }
    setIsGoogleLoading(true);
    try {
        await createUserDocument(googleUser, {
            mobile: values.mobile,
            dob: format(values.dob, 'yyyy-MM-dd')
        });
        await refetchUserData();
        toast({ title: "Success", description: "Account created and details saved." });
        setIsGoogleModalOpen(false);
        router.push("/");
    } catch (error: any) {
         console.error(error);
         toast({
            variant: "destructive",
            title: "An Error Occurred",
            description: "Could not save your details. Please try again.",
         });
    } finally {
        setIsGoogleLoading(false);
    }
  }

  return (
    <div className="space-y-6">
       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="name@example.com" {...field} className="pl-10" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="password" placeholder="••••••••" {...field} className="pl-10" />
                    </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Log In
          </Button>
        </form>
      </Form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
       <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
            {isGoogleLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2" />}
            Google
        </Button>
      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>

      <Dialog open={isGoogleModalOpen} onOpenChange={setIsGoogleModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Complete Your Profile</DialogTitle>
                <DialogDescription>
                    Welcome! Please provide a few more details to finish setting up your account.
                </DialogDescription>
            </DialogHeader>
            <Form {...googleForm}>
                <form onSubmit={googleForm.handleSubmit(onGoogleSubmit)} className="space-y-4 py-4">
                    <FormField
                        control={googleForm.control}
                        name="mobile"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mobile</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="9876543210" {...field} className="pl-10" />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={googleForm.control}
                        name="dob"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                                <DatePicker value={field.value} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isGoogleLoading}>
                        {isGoogleLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Save and Continue
                    </Button>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
