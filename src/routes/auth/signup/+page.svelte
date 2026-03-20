<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';
  import { Film, Mail, Lock, User, UserPlus } from '@lucide/svelte';

  let name = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let loading = $state(false);

  async function handleSignUp(e: Event) {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    loading = true;
    
    const signUpPromise = fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    toast.promise(signUpPromise, {
      loading: 'Creating account...',
      success: async (response) => {
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create account');
        }
        goto('/auth/signin?message=Account created successfully');
        return 'Account created! Please sign in.';
      },
      error: (err) => err.message || 'Failed to create account',
    });

    try {
      await signUpPromise;
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Sign Up — imguralt</title>
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
  <div class="w-full max-w-md space-y-6">
    <!-- Logo -->
    <div class="text-center">
      <a href="/" class="inline-flex items-center gap-2 text-2xl font-bold">
        <Film class="size-8 text-primary" />
        imguralt
      </a>
      <p class="text-muted-foreground mt-2">Create your account</p>
    </div>

    <!-- Sign Up Form -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-xl">Get started</Card.Title>
        <Card.Description>Create an account to upload and manage your videos</Card.Description>
      </Card.Header>
      <Card.Content class="space-y-4">
        <form onsubmit={handleSignUp} class="space-y-4">
          <div class="space-y-2">
            <label for="name" class="text-sm font-medium">Full Name</label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                bind:value={name}
                class="pl-10"
                required
              />
            </div>
          </div>

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
                placeholder="Create a password"
                bind:value={password}
                class="pl-10"
                required
              />
            </div>
          </div>

          <div class="space-y-2">
            <label for="confirmPassword" class="text-sm font-medium">Confirm Password</label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                bind:value={confirmPassword}
                class="pl-10"
                required
              />
            </div>
          </div>

          <Button type="submit" class="w-full" disabled={loading}>
            {#if loading}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {:else}
              <UserPlus class="size-4 mr-2" />
            {/if}
            Create Account
          </Button>
        </form>
      </Card.Content>
      <Card.Footer class="text-center">
        <p class="text-sm text-muted-foreground">
          Already have an account?
          <a href="/auth/signin" class="text-primary hover:underline font-medium">Sign in</a>
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