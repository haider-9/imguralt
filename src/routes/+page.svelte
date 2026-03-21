<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Progress } from '$lib/components/ui/progress';
  import { Input } from '$lib/components/ui/input';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';
  import {
    Upload,
    Film,
    ImagePlay,
    Copy,
    Check,
    X,
    Eye,
    Clock,
    Loader2,
    LogIn,
    User,
    Settings
  } from '@lucide/svelte';
  import { CLOUDINARY_UPLOAD_URL, UPLOAD_PRESET } from '$lib/cloudinary';

  let { data } = $props();
  const user = $derived(data?.user);
  let videos = $state<any[]>([]);
  
  // Initialize videos from data
  $effect(() => {
    if (data?.videos) {
      videos = [...data.videos];
    }
  });

  // Upload state
  let dragOver = $state(false);
  let uploading = $state(false);
  let progress = $state(0);
  let uploadedVideo = $state<null | Record<string, string | number>>(null);
  let errorMsg = $state('');
  let fileInput = $state<HTMLInputElement | null>(null);

  // Copy state
  let copiedStates = $state<Record<string, boolean>>({});

  function formatBytes(bytes: number): string {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function formatDuration(s: number): string {
    if (!s) return '—';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  }

  function formatDate(d: string | number | Date): string {
    return new Date(d as string).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  async function copy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    copiedStates[id] = true;
    toast.success('Copied to clipboard!');
    setTimeout(() => (copiedStates[id] = false), 2000);
  }

  function validateFile(file: File): string | null {
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi'];
    if (!file.type.startsWith('video/') && !allowed.includes(file.type)) {
      return 'Please upload a video file (MP4, WebM, MOV, AVI).';
    }
    if (file.size > 200 * 1024 * 1024) {
      return 'File is too large. Max size is 200 MB.';
    }
    return null;
  }

  async function handleUpload(file: File) {
    if (!user) {
      toast.error('Please sign in to upload videos');
      goto('/auth/signin');
      return;
    }

    const err = validateFile(file);
    if (err) {
      errorMsg = err;
      toast.error(err);
      return;
    }

    uploading = true;
    progress = 0;
    errorMsg = '';
    uploadedVideo = null;

    const uploadPromise = (async () => {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('resource_type', 'video');

      const cloudinaryResult = await new Promise<Record<string, unknown>>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', CLOUDINARY_UPLOAD_URL);

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            progress = Math.round((e.loaded / e.total) * 85);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Cloudinary error ${xhr.status}: ${xhr.responseText}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        xhr.send(formData);
      });

      progress = 90;

      // Save to database
      const saveRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloudinaryResult)
      });

      if (!saveRes.ok) {
        const d = await saveRes.json();
        throw new Error(d.error || 'Failed to save video');
      }

      const { video } = await saveRes.json();
      progress = 100;
      uploadedVideo = video;
      videos.unshift(video);
      return video;
    })();

    toast.promise(uploadPromise, {
      loading: 'Uploading video...',
      success: 'Video uploaded successfully!',
      error: (err) => err.message || 'Upload failed',
    });

    try {
      await uploadPromise;
    } catch (e: unknown) {
      errorMsg = e instanceof Error ? e.message : 'Upload failed. Please try again.';
    } finally {
      uploading = false;
    }
  }

  function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) handleUpload(file);
    input.value = '';
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) handleUpload(file);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    dragOver = true;
  }

  function reset() {
    uploadedVideo = null;
    progress = 0;
    errorMsg = '';
  }
</script>

<svelte:head>
	<title>imguralt — Video hosting with instant GIF links</title>
	<meta name="description" content="Upload videos and get shareable GIF links instantly, like Imgur." />
</svelte:head>

<div class="min-h-screen bg-background">
  <!-- Header -->
  <header class="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
    <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Film class="size-5 text-primary" />
        <span class="font-bold text-lg tracking-tight">imguralt</span>
      </div>
      
      <div class="flex items-center gap-3">
        {#if user}
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <User class="size-4" />
            {user.name}
          </div>
          <Button href="/dashboard" variant="outline" size="sm">
            <Settings class="size-4 mr-2" />
            Dashboard
          </Button>
        {:else}
          <Button href="/auth/signin" variant="outline" size="sm">
            <LogIn class="size-4 mr-2" />
            Sign In
          </Button>
        {/if}
      </div>
    </div>
  </header>

  <main class="max-w-5xl mx-auto px-4 py-10 space-y-12">
    <!-- Hero + Uploader -->
    <section class="space-y-6">
      <div class="text-center space-y-2">
        <h1 class="text-4xl font-extrabold tracking-tight">
          Drop a video.<br />
          <span class="text-primary">Get a GIF link.</span>
        </h1>
        <p class="text-muted-foreground text-lg max-w-md mx-auto">
          Upload any video and we'll give you a shareable animated GIF URL — just like Imgur.
        </p>
      </div>

      <!-- Upload zone -->
      {#if !uploadedVideo && !uploading}
        <div
          role="button"
          aria-label="Upload video"
          class="relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer
            {dragOver
            ? 'border-primary bg-primary/10 scale-[1.01]'
            : 'border-border hover:border-primary/60 hover:bg-muted/30'}"
          ondrop={onDrop}
          ondragover={onDragOver}
          ondragleave={() => (dragOver = false)}
          onclick={() => fileInput?.click()}
          onkeydown={(e) => e.key === 'Enter' && fileInput?.click()}
          tabindex="0"
        >
          <input
            bind:this={fileInput}
            type="file"
            accept="video/*"
            class="sr-only"
            onchange={onFileChange}
          />
          <div class="flex flex-col items-center justify-center gap-4 py-20 px-6 text-center select-none">
            <div class="rounded-full bg-primary/10 p-5 border border-primary/20">
              <Upload class="size-10 text-primary" />
            </div>
            <div>
              <p class="text-lg font-semibold">
                {user ? 'Drag & drop your video here' : 'Sign in to upload videos'}
              </p>
              <p class="text-sm text-muted-foreground mt-1">
                {user ? 'or click to browse' : 'Create an account to get started'}
              </p>
            </div>
            {#if user}
              <div class="flex flex-wrap justify-center gap-2 mt-2">
                {#each ['MP4', 'WebM', 'MOV', 'AVI'] as fmt}
                  <Badge variant="secondary" class="text-xs">{fmt}</Badge>
                {/each}
                <Badge variant="outline" class="text-xs">Max 200 MB</Badge>
              </div>
            {:else}
              <div class="flex gap-2 mt-4">
                <Button href="/auth/signin">Sign In</Button>
                <Button href="/auth/signup" variant="outline">Sign Up</Button>
              </div>
            {/if}
          </div>
        </div>

        {#if errorMsg}
          <div class="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm">
            <X class="size-4 shrink-0" />
            {errorMsg}
          </div>
        {/if}
      {/if}

      <!-- Upload in progress -->
      {#if uploading}
        <Card.Root class="border-primary/20">
          <Card.Content class="pt-6 pb-6 space-y-4">
            <div class="flex items-center gap-3">
              <Loader2 class="size-5 text-primary animate-spin shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="font-medium text-sm">
                  {progress < 86 ? 'Uploading to Cloudinary…' : 'Saving to database…'}
                </p>
                <p class="text-xs text-muted-foreground mt-0.5">{progress}% complete</p>
              </div>
              <span class="text-sm font-mono text-primary">{progress}%</span>
            </div>
            <Progress value={progress} class="h-2" />
          </Card.Content>
        </Card.Root>
      {/if}

      <!-- Upload success -->
      {#if uploadedVideo}
        <Card.Root class="border-2 border-primary/30 bg-primary/5 shadow-lg">
          <Card.Header class="pb-3">
            <div class="flex items-center justify-between">
              <Card.Title class="text-lg flex items-center gap-2 text-primary">
                <Check class="size-5" /> Upload complete!
              </Card.Title>
              <Button variant="ghost" size="sm" onclick={reset} class="text-muted-foreground">
                <X class="size-4" />
              </Button>
            </div>
            <Card.Description>
              Your video is live. Copy the GIF link below and share it anywhere.
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-4">
            <!-- Video preview -->
            <div class="rounded-lg overflow-hidden bg-black aspect-video w-full max-w-xl mx-auto">
              <!-- svelte-ignore a11y_media_has_caption -->
              <video
                src={uploadedVideo.originalUrl as string}
                poster={uploadedVideo.thumbnailUrl as string}
                controls
                loop
                playsinline
                class="w-full h-full object-contain"
              ></video>
            </div>

            <!-- GIF link -->
            <div class="space-y-2">
              <label class="text-xs font-semibold uppercase tracking-wide text-primary flex items-center gap-1.5">
                <ImagePlay class="size-3.5" /> GIF Link
              </label>
              <div class="flex gap-2">
                <div class="flex-1 bg-background border border-border rounded-md px-3 py-2 text-xs font-mono text-muted-foreground truncate">
                  {uploadedVideo.gifUrl}
                </div>
                <Button
                  size="sm"
                  onclick={() => copy(uploadedVideo!.gifUrl as string, 'gif')}
                >
                  {#if copiedStates['gif']}
                    <Check class="size-4 mr-1.5" /> Copied!
                  {:else}
                    <Copy class="size-4 mr-1.5" /> Copy
                  {/if}
                </Button>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-wrap gap-2 pt-1">
              <Button variant="ghost" size="sm" onclick={reset} class="text-muted-foreground">
                <Upload class="size-4 mr-1.5" /> Upload another
              </Button>
            </div>
          </Card.Content>
        </Card.Root>
      {/if}
    </section>

    <!-- Gallery -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold">Recent uploads</h2>
      </div>

      {#if videos.length === 0}
        <div class="text-center py-16 text-muted-foreground">
          <Film class="size-10 mx-auto mb-3 opacity-30" />
          <p>No videos yet. Upload one above!</p>
          <p class="text-xs mt-2 opacity-60">
            Note: Database connection required for persistent storage
          </p>
        </div>
      {:else}
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {#each videos as video}
            <div class="group relative rounded-xl overflow-hidden bg-muted border border-border hover:border-primary/50 hover:shadow-md transition-all duration-200">
              <!-- Thumbnail -->
              <div class="aspect-video bg-black overflow-hidden">
                <img
                  src={video.thumbnailUrl as string}
                  alt={video.title as string}
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              <!-- GIF badge overlay -->
              <div class="absolute top-2 right-2">
                <Badge class="text-[10px] py-0.5 px-1.5 bg-black/70 text-white border-0 backdrop-blur-sm">
                  GIF
                </Badge>
              </div>

              <!-- Duration overlay -->
              {#if video.duration}
                <div class="absolute bottom-10 right-2">
                  <span class="text-[10px] bg-black/70 text-white rounded px-1.5 py-0.5 backdrop-blur-sm flex items-center gap-1">
                    <Clock class="size-2.5" />
                    {formatDuration(video.duration as number)}
                  </span>
                </div>
              {/if}

              <!-- Info footer -->
              <div class="p-2.5 bg-card">
                <p class="text-xs font-medium truncate">{video.title || 'Untitled'}</p>
                <div class="flex items-center justify-between mt-0.5 text-[10px] text-muted-foreground">
                  <span class="flex items-center gap-0.5">
                    <Eye class="size-2.5" />
                    {(video.views as number).toLocaleString()}
                  </span>
                  <span>{formatDate(video.uploadedAt as string)}</span>
                </div>
                
                <!-- Copy GIF link -->
                <div class="mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    class="w-full text-xs h-6"
                    onclick={() => copy(video.gifUrl as string, video._id as string)}
                  >
                    {#if copiedStates[video._id as string]}
                      <Check class="size-3 mr-1" /> Copied!
                    {:else}
                      <Copy class="size-3 mr-1" /> Copy GIF
                    {/if}
                  </Button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  </main>

  <!-- Footer -->
  <footer class="border-t border-border mt-16 py-6 text-center text-xs text-muted-foreground">
    <p>imguralt — Video hosting powered by Cloudinary &amp; MongoDB</p>
  </footer>
</div>
