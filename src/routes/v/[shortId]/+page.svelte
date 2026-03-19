<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Copy,
		Check,
		Download,
		Share2,
		Eye,
		Clock,
		Film,
		ImagePlay,
		ChevronLeft
	} from '@lucide/svelte';

	let { data } = $props();
	const video = $derived(data.video);

	let copiedGif = $state(false);
	let copiedVideo = $state(false);
	let copiedPage = $state(false);
	let activeTab = $state<'video' | 'gif'>('video');

	function formatBytes(bytes: number): string {
		if (!bytes) return '—';
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
	}

	function formatDuration(seconds: number): string {
		if (!seconds) return '—';
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return m > 0 ? `${m}m ${s}s` : `${s}s`;
	}

	function formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	async function copy(text: string, type: 'gif' | 'video' | 'page') {
		await navigator.clipboard.writeText(text);
		if (type === 'gif') {
			copiedGif = true;
			setTimeout(() => (copiedGif = false), 2000);
		} else if (type === 'video') {
			copiedVideo = true;
			setTimeout(() => (copiedVideo = false), 2000);
		} else {
			copiedPage = true;
			setTimeout(() => (copiedPage = false), 2000);
		}
	}

	const pageUrl = $derived(
		typeof window !== 'undefined' ? window.location.href : `https://imguralt.app/v/${video.shortId}`
	);
</script>

<svelte:head>
	<title>{video.title} — imguralt</title>
	<meta name="description" content="Watch {video.title} and get the GIF link" />
	<meta property="og:title" content={video.title} />
	<meta property="og:image" content={video.thumbnailUrl} />
	<meta property="og:type" content="video.other" />
	<meta property="og:video" content={video.originalUrl} />
</svelte:head>

<div class="min-h-screen bg-background">
	<!-- Top nav bar -->
	<header class="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
		<div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
			<a href="/" class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
				<ChevronLeft class="size-4" />
				Back to gallery
			</a>
			<span class="font-bold text-lg tracking-tight">imguralt</span>
			<div class="w-24"></div>
		</div>
	</header>

	<main class="max-w-5xl mx-auto px-4 py-8 space-y-6">

		<!-- Title + badges -->
		<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
			<div>
				<h1 class="text-2xl font-bold truncate">{video.title}</h1>
				<div class="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
					<span class="flex items-center gap-1"><Eye class="size-3.5" />{video.views.toLocaleString()} views</span>
					<span>·</span>
					<span>{formatDate(video.uploadedAt)}</span>
				</div>
			</div>
			<div class="flex items-center gap-2 shrink-0">
				<Badge variant="secondary" class="uppercase text-xs">{video.format}</Badge>
				{#if video.width && video.height}
					<Badge variant="outline" class="text-xs">{video.width}×{video.height}</Badge>
				{/if}
			</div>
		</div>

		<!-- Player section -->
		<Card.Root class="overflow-hidden">
			<!-- Tab switcher -->
			<div class="flex border-b border-border">
				<button
					onclick={() => (activeTab = 'video')}
					class="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors
						{activeTab === 'video'
						? 'text-foreground border-b-2 border-primary bg-muted/30'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					<Film class="size-4" /> Video
				</button>
				<button
					onclick={() => (activeTab = 'gif')}
					class="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors
						{activeTab === 'gif'
						? 'text-foreground border-b-2 border-primary bg-muted/30'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					<ImagePlay class="size-4" /> GIF Preview
				</button>
			</div>

			<div class="bg-black flex items-center justify-center min-h-64">
				{#if activeTab === 'video'}
					<!-- svelte-ignore a11y_media_has_caption -->
					<video
						src={video.originalUrl}
						poster={video.thumbnailUrl}
						controls
						loop
						playsinline
						class="w-full max-h-[70vh] object-contain"
					></video>
				{:else}
					<img
						src={video.gifUrl}
						alt="{video.title} GIF"
						class="max-h-[70vh] object-contain"
						loading="lazy"
					/>
				{/if}
			</div>
		</Card.Root>

		<!-- Links grid -->
		<div class="grid sm:grid-cols-2 gap-4">
			<!-- GIF Link card -->
			<Card.Root class="border-2 border-primary/20 bg-primary/5">
				<Card.Header class="pb-2">
					<Card.Title class="text-base flex items-center gap-2">
						<ImagePlay class="size-4 text-primary" />
						GIF Link
					</Card.Title>
					<Card.Description>Direct animated GIF URL — paste anywhere</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-3">
					<div class="flex items-center gap-2 bg-background rounded-md border border-border px-3 py-2 text-xs font-mono break-all text-muted-foreground">
						<span class="flex-1 truncate">{video.gifUrl}</span>
					</div>
					<div class="flex gap-2">
						<Button
							onclick={() => copy(video.gifUrl, 'gif')}
							class="flex-1"
							size="sm"
						>
							{#if copiedGif}
								<Check class="size-4 mr-1.5" /> Copied!
							{:else}
								<Copy class="size-4 mr-1.5" /> Copy GIF Link
							{/if}
						</Button>
						<Button
							href={video.gifUrl}
							target="_blank"
							rel="noopener"
							variant="outline"
							size="sm"
						>
							<Download class="size-4" />
						</Button>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Video Link card -->
			<Card.Root>
				<Card.Header class="pb-2">
					<Card.Title class="text-base flex items-center gap-2">
						<Film class="size-4" />
						Video Link
					</Card.Title>
					<Card.Description>Direct MP4 video URL</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-3">
					<div class="flex items-center gap-2 bg-muted rounded-md border border-border px-3 py-2 text-xs font-mono break-all text-muted-foreground">
						<span class="flex-1 truncate">{video.originalUrl}</span>
					</div>
					<div class="flex gap-2">
						<Button
							onclick={() => copy(video.originalUrl, 'video')}
							variant="secondary"
							class="flex-1"
							size="sm"
						>
							{#if copiedVideo}
								<Check class="size-4 mr-1.5" /> Copied!
							{:else}
								<Copy class="size-4 mr-1.5" /> Copy Video Link
							{/if}
						</Button>
						<Button
							href={video.originalUrl}
							target="_blank"
							rel="noopener"
							variant="outline"
							size="sm"
						>
							<Download class="size-4" />
						</Button>
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Share page link -->
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-base flex items-center gap-2">
					<Share2 class="size-4" />
					Share This Page
				</Card.Title>
				<Card.Description>Send this link so others can view and get the GIF</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="flex gap-2">
					<div class="flex-1 bg-muted rounded-md border border-border px-3 py-2 text-sm font-mono truncate text-muted-foreground">
						{pageUrl}
					</div>
					<Button
						onclick={() => copy(pageUrl, 'page')}
						variant="outline"
						size="sm"
					>
						{#if copiedPage}
							<Check class="size-4 mr-1.5" /> Copied!
						{:else}
							<Copy class="size-4 mr-1.5" /> Copy
						{/if}
					</Button>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Metadata -->
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-base">Details</Card.Title>
			</Card.Header>
			<Card.Content>
				<dl class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
					<div>
						<dt class="text-muted-foreground flex items-center gap-1 mb-1">
							<Clock class="size-3.5" /> Duration
						</dt>
						<dd class="font-medium">{formatDuration(video.duration)}</dd>
					</div>
					<div>
						<dt class="text-muted-foreground mb-1">File size</dt>
						<dd class="font-medium">{formatBytes(video.size)}</dd>
					</div>
					<div>
						<dt class="text-muted-foreground mb-1">Resolution</dt>
						<dd class="font-medium">
							{#if video.width && video.height}
								{video.width}×{video.height}
							{:else}
								—
							{/if}
						</dd>
					</div>
					<div>
						<dt class="text-muted-foreground mb-1">Format</dt>
						<dd class="font-medium uppercase">{video.format || '—'}</dd>
					</div>
				</dl>
			</Card.Content>
		</Card.Root>

	</main>
</div>
