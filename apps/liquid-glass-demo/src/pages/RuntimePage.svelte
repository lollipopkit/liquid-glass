<script lang="ts">
  import RuntimePlayground from "../components/RuntimePlayground.svelte";
</script>

<main class="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
  <section class="space-y-3">
    <div class="page-kicker text-[11px] uppercase tracking-[0.28em]">Runtime Lab</div>
    <h1 class="page-title max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
      Browser-generated liquid glass playground
    </h1>
    <p class="page-copy max-w-3xl text-sm leading-7 sm:text-base">
      This page isolates the runtime renderer from the static showcase. Use it
      to stress parameter updates, inspect selective rerenders, and run the
      browser-side timing probe without polluting the main landing page.
    </p>
  </section>

  <RuntimePlayground />
</main>

<style>
  .page-kicker {
    color: var(--demo-kicker);
  }

  .page-title {
    color: var(--demo-ink);
  }

  .page-copy {
    color: var(--demo-muted);
  }
</style>
