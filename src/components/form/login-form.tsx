"use client";

import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"form" | "google" | "apple" | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading("form");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.ok) {
      router.push("/dashboard");
      return; // évite de remettre loading
    } else {
      setError("Identifiants invalides.");
      setLoading(null);
    }
  };

  const handleSocial = async (provider: "google" | "apple") => {
    try {
      setError("");
      setLoading(provider);
      // Redirige vers NextAuth (si le provider est configuré)
      await signIn(provider, { callbackUrl: "/dashboard" });
    } finally {
      // si NextAuth ne redirige pas (provider non configuré), on stoppe le loader
      setLoading(null);
    }
  };

  const isBusy = Boolean(loading);

  return (
    <div className={cn("flex items-center justify-center px-4", className)} {...props}>
      <div className={cn("flex w-full max-w-md flex-col gap-6")}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Connexion</CardTitle>
            <CardDescription>Connecte-toi avec ton compte Aarchive</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6">
                {/* Boutons sociaux (optionnels, affichent un loader si cliqués) */}
                <div className="flex flex-col gap-4">

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSocial("google")}
                    disabled={isBusy}
                  >
                    {loading === "google" ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connexion Google…
                      </span>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                          className="h-4 w-4" aria-hidden="true">
                          <path
                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                            fill="currentColor"
                          />
                        </svg>
                        Continuer avec Google
                      </>
                    )}
                  </Button>
                </div>

                {/* Divider */}
                <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                  <span className="bg-card text-muted-foreground relative z-10 px-2">
                    Ou continue avec
                  </span>
                </div>

                {/* Credentials */}
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isBusy}
                    />
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Link
                        href="/forgot-password"
                        className="ml-auto text-sm underline-offset-4 hover:underline"
                      >
                        Mot de passe oublié ?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isBusy}
                    />
                  </div>

                  {error && (
                    <p className="text-center text-sm text-red-500 -mt-2">{error}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={isBusy}>
                    {loading === "form" ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connexion…
                      </span>
                    ) : (
                      "Se connecter"
                    )}
                  </Button>
                </div>

                <div className="text-center text-sm">
                  Pas de compte ?{" "}
                  <Link href="/register" className="underline underline-offset-4">
                    Créer un compte
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
          En continuant, tu acceptes nos{" "}
          <Link href="/terms">Conditions d’utilisation</Link> et notre{" "}
          <Link href="/privacy">Politique de confidentialité</Link>.
        </div>
      </div>
    </div>
  );
}
