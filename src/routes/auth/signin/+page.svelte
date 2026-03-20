<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { signIn } from '@auth/sveltekit/client';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';
  import { Film, Mail, Lock, LogIn } from '@lucide/svelte';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);

  async function handleSignIn(e: Event) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    loading = true;
    
    const signInPromise = signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    toast.promise(signInPromise, {
      loading: 'Signing in...',
      success: (result) => {
        if (result?.error) {
          throw new Error('Invalid credentials');
        }
        goto('/dashboard');
        return 'Welcome back!';
      },
      error: 'Invalid email or password',
    });

    try {
      await signInPromise;
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Sign In — imguralt</title>
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
  <div class="w-full max-w-md space-y-6">
    <!-- Logo -->
    <div class="text-center">
      <a href="/" class="inline-flex items-center gap-2 text-2xl font-bold">
        <Film class="size-8 text-primary" />
        imguralt
      </a>
      <p class="text-muted-foreground mt-2">Sign in to your account</p>
    </div>

    <!-- Sign In Form -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-xl">Welcome back</Card.Title>
        <Card.Description>Enter your credentials to access your account</Card.Description>
      </Card.Header>
      <Card.Content class="space-y-4">
        <form onsubmit={handleSignIn} class="space-y-4">
          <div class="space-y-2">
            <label for="email" class="text-sm font-medium">Email</label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                bind:value={email}
                class="pl-10"
                required
              />
            </div>
          </div>

          <div class="space-y-2">
            <label for="password" class="text-sm font-medium">Password</label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                bind:value={password}
                class="pl-10"
                required
              />
            </div>
          </div>

          <Button type="submit" class="w-full" disabled={loading}>
            {#if loading}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {:else}
              <LogIn class="size-4 mr-2" />
            {/if}
            Sign In
          </Button>
        </form>
      </Card.Content>
      <Card.Footer class="text-center">
        <p class="text-sm text-muted-foreground">
          Don't have an account?
          <a href="/auth/signup" class="text-primary hover:underline font-medium">Sign up</a>
        </p>
      </Card.Footer>
    </Card.Root>

    <!-- Back to Home -->
    <div class="text-center">
      <a href="/" class="text-sm text-muted-foreground hover:text-foreground">
        ← Back to home
      </a>
    </div>
  </div>
</div>