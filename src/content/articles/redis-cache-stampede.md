---
articleId: "redis-cache-stampede"
slug: "redis-cache-stampede"
title: "Why a Redis Cache Miss Can Overload Your Database"
summary: "How concurrent cache misses create duplicate database work, and when request coalescing or distributed coordination is worth adding."
topic: "Redis"
tags: ["Redis","Caching","Architecture"]
author: "Mitko Mitrov"
published: "2026-11-10"
status: "published"
thumbnail: "/assets/img/articles/redis-cache-stampede.webp"
originalUrl: "https://www.linkedin.com/pulse/why-redis-cache-miss-can-overload-your-database-mitko-mitrov-riksf"
---

<figure class="article-media">
  <video controls playsinline preload="none" width="1280" height="720" poster="/assets/img/articles/redis-cache-stampede.webp" aria-label="Cache stampede across application servers">
    <source src="/assets/video/articles/redis-stampede-overview.mp4" type="video/mp4" />
    <a href="/assets/video/articles/redis-stampede-overview.mp4">Download animation</a>
  </video>
</figure>

Redis helps reduce database reads and improve response times. But what happens when a popular cache entry expires while hundreds of requests are trying to access the same data?

## Why One Cache Miss Can Trigger a Stampede

Consider a hypothetical application with two servers and one shared Redis cache.

We receive 100 HTTP requests for product:123, split evenly between the two servers. The product has just expired from Redis, and fetching it from the database takes approximately 200 milliseconds.

Without coordination, each request encounters a cache miss and starts its own database query. Before the first query completes and repopulates Redis, many others may already be executing.

In the worst timing, **100 HTTP requests can trigger nearly 100 identical database queries.**

Some queries eventually finish and write the same product data to Redis, but the redundant work has already happened. As database latency increases under load, even more requests may overlap during the cache-miss window.

This is a **cache stampede**, also known as the *thundering herd problem*.

A cache miss is normal. The problem begins when concurrent misses generate unnecessary, expensive database work.

## Local Request Coalescing: One Load Per Key

Do 100 HTTP requests really need 100 database queries?

Not necessarily.

With **local request coalescing**, requests for the same cache key share one in-flight asynchronous operation within an application process.

Instead of each request independently querying the database, one operation retrieves the data while the others await its result.

**Conceptual flow on Server A**

**Request A1:** Encounters a cache miss and starts one database-loading operation.

**Requests A2–A50:** Find the same operation already running and await its result.

**Operation completes:** Redis is populated, and all 50 requests reuse the loaded product data.

**Result: 50 HTTP requests → 1 database query.**

<figure class="article-media">
  <video controls playsinline preload="none" width="1280" height="720" poster="/assets/img/articles/redis-request-coalescing.webp" aria-label="Local request coalescing on an application server">
    <source src="/assets/video/articles/redis-request-coalescing.mp4" type="video/mp4" />
    <a href="/assets/video/articles/redis-request-coalescing.mp4">Download animation</a>
  </video>
</figure>

Each HTTP request still receives its own response. What we're sharing is the database-loading operation, not the HTTP request itself.

The implementation requires concurrency-safe coordination per key. It must also clean up completed or failed operations and handle timeouts appropriately.

## What Changes with Multiple Application Servers?

Local request coalescing works only within one application process.

Server A can combine its 50 requests into one database query. Server B can independently do the same.

The result is **up to two overlapping database queries instead of 100**.

If Server A populates Redis before Server B checks the cache, Server B might avoid its query entirely.

But let's assume the database comfortably handles two concurrent queries.

Would adding distributed synchronization to eliminate one more read really improve our system?

Probably not. We would introduce additional coordination and failure scenarios without solving a demonstrated performance problem.

## When Distributed Coordination Becomes Worthwhile

Now imagine 30 application servers, all missing the same expensive cache entry.

Even with local request coalescing, we could still have 30 simultaneous database queries.

If those queries materially affect database performance, distributed coordination becomes worth evaluating.

One option is a **Redis-based per-key lock**.

<figure class="article-media">
  <video controls playsinline preload="none" width="1280" height="720" poster="/assets/img/articles/redis-distributed-coordination.webp" aria-label="Coordinating cache loads across application servers">
    <source src="/assets/video/articles/redis-distributed-coordination.mp4" type="video/mp4" />
    <a href="/assets/video/articles/redis-distributed-coordination.mp4">Download animation</a>
  </video>
</figure>

One server acquires the lock, rechecks the cache, loads the missing data, and populates Redis. Other servers wait briefly and check Redis again instead of immediately querying the database.

However, distributed locking adds complexity: expiration, ownership, waiting, retries, and failure handling.

A lock also doesn't guarantee exactly one database query under every failure condition. If the lock expires while the original query is still running, another server may start a duplicate load.

## Choose the Simplest Protection That Works

Different cache keys should normally load independently. If 1,000 different keys miss simultaneously, per-key coalescing alone cannot prevent database saturation. That requires separate capacity or concurrency controls.

**Choose the simplest protection that works**

- **Many concurrent misses for one key on one server:** Use local request coalescing.
- **Two servers producing two inexpensive queries:** Accept the duplication.
- **Many servers repeatedly loading one expensive key:** Consider distributed coordination.
- **Many different keys missing simultaneously:** Limit concurrent cache loads or improve database capacity.

**Preventing a cache stampede doesn't mean eliminating every duplicate database query.**

Start with local request coalescing. Introduce distributed coordination when redundant queries across instances become a measurable problem.

The objective is to keep database load acceptable without introducing more complexity than the system actually needs.
