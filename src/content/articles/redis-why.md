---
articleId: "redis-why"
slug: "why-redis"
title: "Why Redis? What problem does it actually solve?"
summary: "A practical starting point: repeated work, multiple application instances, and the limits of local memory."
topic: "Redis"
tags: ["Redis","Caching","Architecture"]
author: "Mitko Mitrov"
published: "2026-09-01"
status: "published"
thumbnail: "/assets/img/articles/redis-why.webp"
originalUrl: "https://www.linkedin.com/pulse/why-redis-what-problem-does-actually-solve-mitko-mitrov-zaepf"
---

Whenever I start learning a new technology, I don’t need another definition copied from the documentation.

I need someone to explain what problem it solves, show me a real-world example, and tell me when I should—and shouldn’t—use it. Once the big picture clicks, the technical details become much easier to understand.

That’s why I decided to create this article series.

I’ll break down technologies and engineering concepts using plain language, practical examples, and the kind of explanations I wish I had when I first encountered them. The series will also serve as my technical diary—a place I can return to when I need to refresh my knowledge.

Each topic will be split into short, connected parts to keep it focused and easy to follow.

I’m starting with Redis.

---

Whenever application performance comes up, someone eventually says:

“Use Redis.”

Okay—but **why**?

Redis can reduce response times and remove unnecessary load from a database. But adding it without understanding where and why it belongs introduces another component that must be deployed, monitored, and kept in sync with the source of truth.

The real question is not whether Redis is fast.

The real questions are:

- What problem are we solving?
- Which data should be cached?
- Why isn’t the application’s in-memory cache enough?

## What problem does Redis solve?

Redis provides fast access to data that would otherwise be repeatedly queried, calculated, or fetched from a slower source.

A relational database such as PostgreSQL or MySQL is designed for much more than raw access speed. It provides durable storage, transactions, constraints, relationships, and powerful querying capabilities.

Those guarantees are valuable—but they also come with a cost.

Redis is an in-memory data store optimized for fast operations on relatively simple data structures. When the same data is requested frequently and does not need to be recalculated or retrieved from the primary database every time, Redis can serve it with very low latency.

In this setup, Redis does not replace the primary database.

The database remains the source of truth. Redis acts as a temporary, faster layer in front of it.

## Why not just use an in-process cache?

A local cache such as *IMemoryCache* also stores data in RAM. It can be simpler and even faster because it lives inside the application process.

In many applications, that may be all you need.

The difference becomes important when the application runs on multiple instances.

Imagine that a user’s first request is handled by Instance A. It loads the data from the database and stores it in its local cache.

The next request is handled by Instance B.

Instance B cannot access Instance A’s memory, so it treats the same data as a cache miss and queries the database again.

With Redis, both instances use the same external cache:

- Instance A stores the value in Redis.
- Instance B can read the same value.
- The cached data remains available when an application instance restarts or is redeployed.

This gives us a practical decision rule:

Use an in-process cache when each application instance can maintain its cache independently, duplicated cache entries are acceptable, and losing the cache during a restart is not a problem.

Consider Redis when the cache must be shared across multiple instances or remain available when individual application instances restart.

Redis is not automatically the right answer to every performance problem.

But once the cache needs to exist outside a single application process, Redis starts solving a problem that local memory cannot.

In the next article, we’ll explore Redis’s most common use cases—from caching and session storage to rate limiting, messaging, queues, and distributed locks.

---

*P.S. A big thank-you to the friend who motivated me to start this journey—he knows who he is. 😎*
