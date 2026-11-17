---
articleId: "redis-cache-aside"
slug: "redis-cache-aside-ttl-eviction"
title: "Redis in Practice: Cache-Aside, TTL, and Eviction"
summary: "The read and write flow, freshness decisions, and race conditions behind a shared cache."
topic: "Redis"
tags: ["Redis","Caching","Architecture"]
author: "Mitko Mitrov"
published: "2026-09-10"
status: "published"
thumbnail: "/assets/img/articles/redis-cache-aside.webp"
originalUrl: "https://www.linkedin.com/pulse/redis-practice-cache-aside-ttl-eviction-mitko-mitrov-ilqlf"
---

In the previous article, we explored what problem Redis solves and why an external cache can be useful when an application runs on multiple instances.

Before getting into the caching flow, here is the overview of Redis use cases I promised:

- **Caching:** Store the result of an expensive database query or calculation so the next request can reuse it.
- **Session storage:** Keep user session data in a shared store with fast reads and writes.
- **Rate limiting and counters:** Use atomic increments to track requests. The surrounding logic, including expiration, still needs to handle concurrency correctly. [1]
- **Publish/Subscribe messaging:** Send lightweight, real-time messages between services. Pub/Sub does not retain messages for disconnected subscribers. [2]
- **Queues:** Use Redis Lists or Streams as building blocks for job processing.
- **Distributed locks:** Coordinate access across application instances, with careful handling of ownership, expiration, and failures.

Let’s start with caching and the decisions that come with it.

## Cache-Aside Pattern

Cache-aside is a common starting point when using Redis as a cache. The flow is simple, but we still need to think about time-to-live (TTL), keeping cached data fresh, and handling race conditions.

Generally, we need to take care of two things: reads and writes.

Here is a simple pseudocode example:

```text
Read:
  GET key from cache
    if hit: return value
    if miss: value = query DB
             SET key=value in cache (with TTL)
             return value

Write:
  UPDATE and COMMIT row in DB
  DELETE corresponding key from cache
```

**On a read:**

The application checks Redis for the requested data.

- **Cache hit:** The value is available, so we return it immediately.
- **Cache miss:** We read from the database, store the result in Redis with a TTL, and return it to the caller.

**On a write:**

The application first commits the update to the database. At this point, the database contains the new value, while Redis may still contain the old one.

The application then invalidates—deletes—the corresponding cache entry. The next read follows the cache-miss flow and repopulates the cache from the database. [3]

If the change affects multiple cached results, those entries need invalidation too.

## Why invalidate instead of updating the cache on write?

Updating the cached value directly could save a database query on the next read. But concurrent writes make this harder to get right.

Two requests can update the database and then update Redis in a different order, leaving an older value in the cache. Without expiration or another correction mechanism, that value could remain there indefinitely.

For this cache-aside approach, deleting the entry is a simpler starting point than trying to keep every cache update in the same order as the database writes.

The trade-off is an extra cache miss when the data is requested again.

Updating the cache on write can also be valid, but it needs its own consistency strategy. Deleting the entry does not eliminate every race condition either.

There are three things to keep in mind:

**1. Cache miss penalty**

The first request for an uncached value still pays the database-query cost, along with the cache operations. If the query is expensive and the key is popular, many concurrent requests may all miss the cache and query the database for the same data at once.

This is a **cache stampede**.

**2. Stale reads under concurrency**

Consider this sequence:

1. Request A misses the cache and reads a value from the database.
2. Request B updates that value in the database and invalidates the cache.
3. Request A stores the value it read earlier, which is now stale, in Redis.

The invalidation happened, yet stale data still ended up in the cache. Basic cache-aside does not guarantee consistency between the database and the cache. [3]

**3. TTL tuning**

A TTL that is too short creates more cache misses and repeated database queries. A TTL that is too long can leave stale data available for longer, especially when changes happen outside the application’s invalidation flow.

A direct database update from another service is one example. A failed cache deletion after a successful database commit is another.

## TTL, invalidation, and eviction

These mechanisms are often confused because all three can make a cached key disappear.

They answer different questions:

| Mechanism | Question it answers |
| --- | --- |
| **TTL** | How long may this cache entry remain available before it expires? |
| **Invalidation** | Which cache entries should be removed because the underlying data changed? |
| **Eviction** | Which keys should Redis remove when it needs memory? |

TTL and invalidation help manage freshness. Eviction manages memory pressure.

Redis does not check the database to decide whether a cached value is still correct. A key can have time remaining on its TTL and already contain outdated data.

## How do you choose a TTL?

There is no universal formula. The decision depends on how quickly the underlying data changes and how expensive or risky stale data would be.

The main question is:

**What is the cost of staleness compared with the cost of a cache miss?**

- **High cost of stale data:** Customer prices, permissions, and inventory need careful freshness handling. A shorter TTL reduces exposure, but critical decisions may still need validation against the source of truth.
- **Low cost of stale data, high cost of recomputing:** An expensive aggregation report or recommendation list may be a good candidate for a longer TTL.

A useful gut-check question is:

“If this data is five minutes stale, does anyone get hurt or annoyed?”

If no, a longer TTL may be acceptable. If yes, consider a shorter TTL with reliable invalidation, or avoid caching that particular decision.

What happens when we need the cache to react to a specific event?

That is where invalidation comes in. As covered earlier, when important data changes, the application deletes the affected cache entries after the database update commits.

**TTL and invalidation are commonly used together.** Invalidation reacts to known changes; TTL limits how long a particular cached copy can remain available if it is not refreshed or removed earlier.

When we cannot reliably know when data changes—for example, a third-party API response—TTL may be the main freshness mechanism available to us.

## How TTL expiration actually works

If we set a TTL of 3,600 seconds, the key expires after one hour, assuming the TTL is not changed.

However, the expiration deadline and the moment Redis reclaims the memory are not necessarily the same.

Redis uses both **passive expiration** and **active expiration**. [4]

### Passive expiration

When a client reads a key, Redis checks whether it has expired.

For example:

1. The client sends `GET user:123`.
2. Redis checks the key’s expiration deadline.
3. If the deadline has passed, Redis removes the expired key and returns `nil`.
4. Otherwise, it returns the value.

This is sometimes called “lazy” expiration: the access itself triggers the check and removal.

It avoids needing a separate timer for every key or continuously scanning the entire keyspace.

But passive expiration alone would leave a problem: what about expired keys that nobody requests again?

### Active expiration

Redis also periodically examines keys with an expiration time and removes those that have expired.

At a high level, it:

- Samples keys that have a TTL.
- Checks which sampled keys have expired.
- Removes expired keys, continuing within the expiration cycle’s work budget.

This avoids relying entirely on future reads to clean up expired entries.

An expired key may therefore remain in memory briefly until passive or active expiration removes it. **That does not mean a normal `GET` will return its expired value.** [4]

Two practical consequences:

- “The TTL passed” does not mean the memory was reclaimed at that exact instant.
- If a key disappears, the cause may be expiration or eviction. Both produce a cache miss, but they need different investigation.

For batches of keys created together, adding a small random variation to their TTLs—**jitter**—can spread expiration and reload work over time. It helps avoid synchronized expiry across keys, but does not by itself prevent a stampede on one popular key.

## Eviction

Imagine Redis reaches its configured memory limit. Which keys should it remove to make room?

That behavior is configured through `maxmemory` and `maxmemory-policy`.

On a typical 64-bit Redis Open Source installation, `maxmemory=0` means there is no configured dataset memory limit. If usage keeps growing, Redis can exhaust the available memory.

Set an explicit limit, and leave room for the operating system and Redis overhead. `maxmemory` is not a hard cap on the process’s total memory usage. [5]

Several eviction policies are available, including:

| Policy | Behavior under memory pressure |
| --- | --- |
| `noeviction` | Does not evict keys to make room; commands that need additional memory can fail. Reads still work. |
| `allkeys-lru` | Selects eviction candidates by least recent use across all keys. |
| `allkeys-lfu` | Selects eviction candidates by least frequent use across all keys. |
| `volatile-lru` | Uses LRU among keys that have a TTL. |
| `volatile-lfu` | Uses LFU among keys that have a TTL. |
| `allkeys-random` | Evicts randomly selected keys. |
| `volatile-ttl` | Favors keys with the shortest remaining TTL. |
| `volatile-random` | Evicts randomly selected keys that have a TTL. |

### LRU vs. LFU

**LRU—Least Recently Used—** favors removing keys that have not been accessed recently. It is a useful general starting point for many caching workloads.

**LFU—Least Frequently Used—** favors removing keys that are accessed less often. It can help retain frequently used keys even when they have not been accessed in the most recent burst of traffic.

Redis uses approximations for both. LRU samples eviction candidates instead of maintaining an exact global ordering. LFU estimates frequency and ages that information over time so it can adapt when access patterns change. [5]

## Eviction and TTL together

A key can disappear because its TTL expired or because Redis evicted it under memory pressure, whichever happens first.

With a `volatile-*` policy, only keys with a TTL are candidates for eviction. Keys without a TTL are protected from that eviction policy, but they do not expire automatically either. If Redis cannot free enough memory from eligible keys, memory-growing writes can fail.

With `allkeys-lru` and no TTLs, a cached value’s lifetime depends on access patterns and memory pressure. A frequently accessed stale value may remain cached for a long time unless the application invalidates it.

For a typical Redis instance dedicated to cache-aside data, a practical starting point is:

- Choose TTLs based on acceptable staleness and the cost of reloading data.
- Invalidate affected entries after database changes commit.
- Configure `maxmemory` with sufficient memory headroom.
- Consider `allkeys-lru` or `allkeys-lfu` based on how the application accesses data.

These settings work together, but they do not make cache-aside strongly consistent.

The application must also treat cache misses as a normal part of the read path. Whether a key expired, was evicted, was invalidated, or was never cached, a `GET` returning `nil` does not tell us the reason.

The same flow still applies: read from the database, repopulate the cache, and return the value.

In the next article, we’ll explore when Redis earns its place in an application—and when adding it creates more work than value.

---

## Sources

1. Redis. [INCR — Rate limiter patterns](https://redis.io/docs/latest/commands/incr/#pattern-rate-limiter). Atomic counters and expiration handling.
2. Redis. [Pub/Sub — Delivery semantics](https://redis.io/docs/latest/develop/pubsub/#delivery-semantics). Message delivery and disconnected subscribers.
3. Microsoft Learn. [Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside). Read/write flow and consistency limitations.
4. Redis. [EXPIRE — How Redis expires keys](https://redis.io/docs/latest/commands/expire/#how-redis-expires-keys). Passive and active expiration.
5. Redis. [Key eviction](https://redis.io/docs/latest/develop/reference/eviction/). Memory limits, eviction policies, and LRU/LFU behavior.
