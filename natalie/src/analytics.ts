import posthog from 'posthog-js'

/** Starts PostHog analytics. Does nothing when no key is set (for example in a fork without the .env file). */
export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined
  if (!key) return
  posthog.init(key, {
    api_host: (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false, // we send pageviews ourselves on route changes (see App)
  })
}

export { posthog }
