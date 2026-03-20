<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Progress } from '$lib/components/ui/progress';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { signOut } from '@auth/sveltekit/client';
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
    LogOut,
    User,
    BarChart3,
    Trash2,
    Edit3
  } from '@lucide/svelte';
  import { CLOUDINARY_UPLOAD_URL, UPLOAD_PRESET } from '$lib/cloudinary';

  let { data } = $props();
  const user = $derived(data.user);
  let videos = $state<any[]>([]);
  const stats = $derived(data.stats);
  
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

  // Edit state
  let editingVideo = $state<null | Record<string, any>>(null);
  let editTitle = $state('');

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
    toast.success('Copied to clipboard');
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
    const err = validateFile(file);
    if (err) {
      errorMsg = err;
      return;
    }

    uploading = true;
    progress = 0;
    errorMsg = '';
    uploadedVideo = null;

    try {
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
      toast.success('Video uploaded successfully!');

    } catch (e: unknown) {
      errorMsg = e instanceof Error ? e.message : 'Upload failed. Please try again.';
      toast.error(errorMsg);
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

  async function deleteVideo(video: Record<string, any>) {
    const deletePromise = fetch(`/api/videos/${video._id}`, { method: 'DELETE' });
    
    toast.promise(deletePromise, {
      loading: 'Deleting video...',
      success: () => {
        const index = videos.findIndex((v: any) => v._id === video._id);
        if (index > -1) videos.splice(index, 1);
        return 'Video deleted successfully';
      },
      error: 'Failed to delete video',
    });
  }

  async function updateVideo() {
    if (!editingVideo || !editTitle.trim()) return;

    const updatePromise = fetch(`/api/videos/${editingVideo._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle.trim() })
    });

    toast.promise(updatePromise, {
      loading: 'Updating video...',
      success: () => {
        const video = videos.find((v: any) => v._id === editingVideo._id);
        if (video) video.title = editTitle.trim();
        editingVideo = null;
        return 'Video updated successfully';
      },
      error: 'Failed to update video',
    });
  }

  function startEdit(video: Record<string, any>) {
    editingVideo = video;
    editTitle = video.title;
  }

  async function handleSignOut() {
    await signOut();
    goto('/');
  }
</script>

<svelte:head>
  <title>Dashboard — imguralt</title>
</svelte:head>

<div class="min-h-screen bg-background">
  <!-- Header -->
  <header class="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <a href="/" class="flex items-center gap-2">
          <Film class="size-6 text-primary" />
          <span class="font-bold text-xl tracking-tight">imguralt</span>
        </a>
        <Badge variant="secondary">Dashboard</Badge>
      </div>
      
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <User class="size-4" />
          {user.name}
        </div>
        <Button variant="ghost" size="sm" onclick={handleSignOut}>
          <LogOut class="size-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 py-8 space-y-8">
    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card.Root>
        <Card.Header class="pb-2">
          <Card.Title class="text-sm font-medium text-muted-foreground">Total Videos</Card.Title>
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">{stats.totalVideos}</div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="pb-2">
          <Card.Title class="text-sm font-medium text-muted-foreground">Total Views</Card.Title>
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="pb-2">
          <Card.Title class="text-sm font-medium text-muted-foreground">Average Views</Card.Title>
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">
            {stats.totalVideos > 0 ? Math.round(stats.totalViews / stats.totalVideos) : 0}
          </div>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Upload Section -->
    <section class="space-y-4">
      <h2 class="text-xl font-semibold">Upload New Video</h2>
      
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
          <div class="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center select-none">
            <div class="rounded-full bg-primary/10 p-4 border border-primary/20">
              <Upload class="size-8 text-primary" />
            </div>
            <div>
              <p class="font-semibold">Drag & drop your video here</p>
              <p class="text-sm text-muted-foreground mt-1">or click to browse</p>
            </div>
          </div>
        </div>

        {#if errorMsg}
          <div class="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm">
            <X class="size-4 shrink-0" />
            {errorMsg}
          </div>
        {/if}
      {/if}

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

      {#if uploadedVideo}
        <Card.Root class="border-2 border-primary/30 bg-primary/5">
          <Card.Header class="pb-3">
            <div class="flex items-center justify-between">
              <Card.Title class="text-lg flex items-center gap-2 text-primary">
                <Check class="size-5" /> Upload complete!
              </Card.Title>
              <Button variant="ghost" size="sm" onclick={reset}>
                <X class="size-4" />
              </Button>
            </div>
          </Card.Header>
          <Card.Content class="space-y-4">
            <div class="flex gap-2">
              <div class="flex-1 bg-background border border-border rounded-md px-3 py-2 text-xs font-mono text-muted-foreground truncate">
                {uploadedVideo.gifUrl}
              </div>
              <Button size="sm" onclick={() => copy(uploadedVideo!.gifUrl as string, 'new')}>
                {#if copiedStates['new']}
                  <Check class="size-4 mr-1.5" /> Copied!
                {:else}
                  <Copy class="size-4 mr-1.5" /> Copy GIF
                {/if}
              </Button>
            </div>
          </Card.Content>
        </Card.Root>
      {/if}
    </section>

    <!-- Videos Grid -->
    <section class="space-y-4">
      <h2 class="text-xl font-semibold">Your Videos ({videos.length})</h2>
      
      {#if videos.length === 0}
        <div class="text-center py-16 text-muted-foreground">
          <Film class="size-12 mx-auto mb-4 opacity-30" />
          <p>No videos yet. Upload your first video above!</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each videos as video}
            <Card.Root class="overflow-hidden">
              <!-- Thumbnail -->
              <div class="aspect-video bg-black overflow-hidden relative group">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary" onclick={() => startEdit(video)}>
                    <Edit3 class="size-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onclick={() => deleteVideo(video)}>
                    <Trash2 class="size-4" />
                  </Button>
                </div>
                
                {#if video.duration}
                  <div class="absolute bottom-2 right-2">
                    <span class="text-xs bg-black/70 text-white rounded px-2 py-1 flex items-center gap-1">
                      <Clock class="size-3" />
                      {formatDuration(video.duration)}
                    </span>
                  </div>
                {/if}
              </div>

              <!-- Content -->
              <Card.Content class="p-4 space-y-3">
                <div>
                  <h3 class="font-semibold truncate">{video.title}</h3>
                  <div class="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <span class="flex items-center gap-1">
                      <Eye class="size-3" />
                      {video.views.toLocaleString()} views
                    </span>
                    <span>{formatDate(video.uploadedAt)}</span>
                  </div>
                </div>

                <!-- GIF Link -->
                <div class="space-y-2">
                  <div class="text-xs font-medium text-muted-foreground">GIF Link</div>
                  <div class="flex gap-2">
                    <div class="flex-1 bg-muted rounded px-2 py-1 text-xs font-mono truncate">
                      {video.gifUrl}
                    </div>
                    <Button size="sm" variant="outline" onclick={() => copy(video.gifUrl, video._id)}>
                      {#if copiedStates[video._id]}
                        <Check class="size-3" />
                      {:else}
                        <Copy class="size-3" />
                      {/if}
                    </Button>
                  </div>
                </div>
              </Card.Content>
            </Card.Root>
          {/each}
        </div>
      {/if}
    </section>
  </main>
</div>

<!-- Edit Dialog -->
<Dialog.Root bind:open={editingVideo}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Edit Video</Dialog.Title>
      <Dialog.Description>Update the title of your video</Dialog.Description>
    </Dialog.Header>
    <div class="space-y-4">
      <div class="space-y-2">
        <label for="title" class="text-sm font-medium">Title</label>
        <Input
          id="title"
          bind:value={editTitle}
          placeholder="Enter video title"
        />
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => editingVideo = null}>Cancel</Button>
      <Button onclick={updateVideo}>Save Changes</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>