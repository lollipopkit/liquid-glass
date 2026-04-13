<script lang="ts">
  import { onMount } from "svelte";

  import HomePage from "./pages/HomePage.svelte";
  import RuntimePage from "./pages/RuntimePage.svelte";

  type Route = "/" | "/runtime";

  let currentRoute: Route = "/";

  function normalizeRoute(pathname: string): Route {
    return pathname === "/runtime" ? "/runtime" : "/";
  }

  function syncRoute() {
    if (typeof window === "undefined") {
      return;
    }

    currentRoute = normalizeRoute(window.location.pathname);
  }

  function navigate(path: Route) {
    if (typeof window === "undefined") {
      return;
    }

    if (path === currentRoute) {
      return;
    }

    window.history.pushState({}, "", path);
    currentRoute = path;
    window.scrollTo(0, 0);
  }

  onMount(() => {
    syncRoute();

    const handlePopstate = () => {
      syncRoute();
    };

    window.addEventListener("popstate", handlePopstate);

    return () => {
      window.removeEventListener("popstate", handlePopstate);
    };
  });
</script>

<div class="demo-shell">
  <header class="demo-nav-shell">
    <nav class="demo-nav mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <button class="demo-brand" type="button" on:click={() => navigate("/")}>
        liquid-glass
      </button>

      <div class="demo-links">
        <button
          class:demo-link--active={currentRoute === "/"}
          class="demo-link"
          type="button"
          on:click={() => navigate("/")}
        >
          Showcase
        </button>
        <button
          class:demo-link--active={currentRoute === "/runtime"}
          class="demo-link"
          type="button"
          on:click={() => navigate("/runtime")}
        >
          Runtime Lab
        </button>
      </div>
    </nav>
  </header>

  {#if currentRoute === "/runtime"}
    <RuntimePage />
  {:else}
    <HomePage />
  {/if}
</div>

<style>
  .demo-shell {
    min-height: 100vh;
  }

  .demo-nav-shell {
    position: sticky;
    top: 0;
    z-index: 30;
    backdrop-filter: blur(18px);
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--demo-bg) 76%, transparent),
        color-mix(in srgb, var(--demo-bg) 46%, transparent)
      );
    border-bottom: 1px solid color-mix(in srgb, var(--demo-ink) 8%, transparent);
  }

  .demo-brand,
  .demo-link {
    border: 0;
    color: var(--demo-ink);
    background: transparent;
    font: inherit;
  }

  .demo-brand {
    padding: 0;
    font-size: 0.95rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    cursor: pointer;
  }

  .demo-links {
    display: flex;
    gap: 0.5rem;
  }

  .demo-link {
    border-radius: 9999px;
    padding: 0.6rem 0.95rem;
    cursor: pointer;
  }

  .demo-link--active {
    color: white;
    background: linear-gradient(135deg, #541010, #8b2252);
  }
</style>
