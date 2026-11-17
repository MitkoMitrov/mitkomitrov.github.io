---
articleId: "redis-when-to-use"
slug: "when-to-use-redis-and-when-not-to"
title: "When to Use Redis—and When Not To"
summary: "Where caching earns its place, when it adds complexity, and how to plan for a Redis outage."
topic: "Redis"
tags: ["Redis","Caching","Architecture"]
author: "Mitko Mitrov"
published: "2026-10-01"
status: "published"
thumbnail: "/assets/img/articles/redis-when-to-use.webp"
originalUrl: "https://www.linkedin.com/pulse/when-use-redisand-mitko-mitrov-09cxf"
---

In the first article, we explored what problem Redis solves and why a shared cache can be useful. In Part 2, we looked at cache-aside, TTL, invalidation, and eviction.

Now comes the practical decision: where does Redis actually earn its place in an application?

Most of this article focuses on Redis as a cache. We’ll also look at temporary operational state and what changes when Redis becomes the only place a value exists.

## When Redis brings value

The decision depends on the workload and the business requirements.

A common explanation is that Redis helps when we serve the same data to many users. That can reduce database load, repeated calculations, and calls to third-party services.

But “lots of users” alone is not enough reason to add a cache.

**Redis earns its place when we repeatedly pay a cost—in time, load, or money—to retrieve or calculate a response that can safely be reused.**

Three factors help make that decision.

**1. Latency cost**

The underlying operation is slow. It might involve a complex query, several joins, a stored procedure, or an expensive aggregation that makes the client wait.

Imagine a query that takes 800 milliseconds and returns a result that does not change between requests. Serving a cached result can avoid repeating most of that work. The actual improvement depends on the application and should be measured.

**2. Load cost**

An operation may be fast individually, but running it millions of times can overwhelm database connections, CPU, or I/O.

The volume becomes the problem.

If many requests use the same inputs and can reuse the same result, caching can reduce that repeated work. An expensive calculation based on a defined combination of inputs can be cached by that combination, provided the key captures everything that affects the result.

**3. Monetary cost**

The operation costs money per call, such as a metered third-party API.

If its response can be reused within an acceptable freshness window, caching can reduce the number of paid requests. The savings still need to justify running and maintaining the cache.

There is also a case that “many users, same response” misses: one user repeatedly polling the same expensive endpoint.

If the response remains reusable between those requests, the same opportunity exists. What matters is how often we repeat the work and how much that repetition costs.

## Real-world examples

### Data associated with one user

**Personalized recommendations**

Recommendations may combine information from multiple database tables and require substantial computation. Recalculating them on every page view is wasteful if a short period of reuse is acceptable.

Cache the result for that user, then refresh it when relevant behavior changes or the chosen TTL expires. This can reduce both response time and processing load.

**Anonymous user data**

An e-commerce application can assign a temporary ID to a guest and store their cart, recently viewed products, or temporary preferences in Redis. If the visitor creates an account, the application can merge that data into their profile.

This example needs a distinction: if the data exists only in Redis, Redis is storing application state rather than a disposable copy of data stored elsewhere.

TTL can be useful for expiring that state, but the acceptable lifetime and consequences of losing it are business decisions. A guest cart can still represent a valuable potential purchase. Keep information that must survive in storage designed to meet that requirement.

### Data shared by a group of users

**News feeds and homepage content**

Trending articles, popular products, and homepage sections often contain the same information for many users.

Even if the underlying query is reasonably fast, repeatedly sorting, ranking, and filtering the same data can become expensive at scale. Cache the prepared result when the freshness requirements allow it.

This extends naturally to language or market variants, such as `homepage:mk` and `homepage:en`. The cache key must distinguish results that are genuinely different.

**Category and search results**

Frequently requested searches, such as “laptops under €1,000,” may allow many users to reuse the same paginated result.

Measure which queries are actually repeated before deciding what to cache. Filters, sorting, pagination, and any user-specific visibility rules must be reflected in the cache design.

Caching every possible search combination can consume memory while producing very few cache hits.

## When caching may not be worth it

The strongest candidates involve repeated, reusable data that is costly to retrieve. The weaker candidates offer little reuse or have freshness requirements the proposed cache cannot satisfy. [1]

**1. Cheap, infrequent queries**

If a well-indexed lookup runs occasionally and already meets the application’s response-time requirements, there may be little to gain.

Adding Redis introduces network calls, invalidation logic, monitoring, and another component that can fail. The benefit should justify that work.

**2. Decisions that require current data**

When acting on stale data has a real cost, be careful about letting a cached copy determine the outcome.

Consider a promotion with limited stock. Redis might cache the product description or a recently observed availability value. The final purchase decision still needs an authoritative stock check and reservation or update that safely handles concurrent buyers.

Even a fresh read before checkout cannot guarantee that another buyer will not purchase the final item a moment later.

For the database-backed architecture in this series, the transactional decision belongs in the database. Redis can still help with surrounding reads.

The useful question is: **what happens if someone acts on an outdated answer?**

**3. Frequent changes with little reuse**

Caching usually becomes more useful when a value is read repeatedly between changes.

If we keep invalidating an entry before enough requests can reuse it, we may add more work than we save. A rapidly changing stock quantity is one example worth examining.

However, frequent writes alone do not make caching pointless. A value that changes every few seconds may still receive thousands of reads between updates. Measure reuse and freshness requirements together.

## Can Redis be the source of truth?

So far, the database has held the authoritative business data. Redis has served cached copies.

Redis can also be the authoritative store for a particular piece of application state. That choice means its durability, availability, and recovery behavior must meet the requirements for that data.

Temporary operational state is a common example, but “temporary” does not automatically mean “safe to lose.”

**Sessions and temporary preferences**

Losing session data might require users to sign in again. Losing temporary preferences might be acceptable. Losing a guest cart could affect a sale.

Those consequences should be explicitly accepted rather than assumed to be harmless because the data has a TTL.

**Rate-limit counters**

Counters that apply to a short window can fit naturally in Redis. Their expiration should match the rate-limiting algorithm and the window they represent.

But losing a counter early may allow additional requests. That might be acceptable for a convenience limit and unacceptable for a control protecting a costly or sensitive endpoint.

Redis can own this state, but the failure behavior is part of the design.

## The durability question

Redis offers persistence options, including RDB snapshots and append-only files. They have different performance and recovery trade-offs. For example, recovering from a snapshot can lose changes made after that snapshot; AOF with a once-per-second fsync policy can lose roughly a second of recent writes in a crash. [2]

Replication is another part of the design. Redis Open Source uses asynchronous replication by default, and acknowledged writes can still be lost during failover, depending on the configuration and failure timing. [3]

Persistence, replication, and backups address different failure scenarios. They need to be configured and tested against the application’s requirements.

For the architecture discussed in this series, I would keep the following in the primary transactional database:

- Payments and account balances.
- Completed orders.
- Legal and audit records.
- Permanent user data.
- Data that depends on relational integrity.

Using Redis as the only store for critical data requires a separate, deliberate evaluation of its guarantees. Adding it as a performance layer does not establish that it meets those requirements.

## What happens when Redis goes down?

Data loss is one failure mode. Another is simply that Redis is unreachable because of a network issue, restart, or maintenance.

For a cache-aside read where the database remains authoritative, the application can fall back to the database if Redis is unavailable. In the best case, requests continue to succeed with higher latency.

But that outcome is not automatic.

If Redis normally serves most reads, losing it can suddenly send far more traffic to the database than the database can handle. A cache outage can become a wider application outage. [4]

A practical failure plan should cover:

- **Bounded timeouts:** Avoid making every request wait too long for an unavailable cache.
- **Database protection:** Limit fallback traffic when necessary, rather than allowing every request to hit the database at once.
- **Recovery behavior:** Account for the work required to refill an empty cache.
- **Monitoring:** Distinguish normal cache misses from connection failures and timeouts.
- **Testing:** Check how the application behaves with the cache unavailable under realistic load.

A cache error may lead to the same database-read path as a miss, but it should remain distinguishable in logs and metrics.

There is a further distinction when Redis stores the only copy of operational state. A missing session or unavailable rate-limit counter cannot always be reconstructed by querying the database.

For a rate limiter, the application needs an explicit policy:

- **Fail open:** Allow requests when the limiter is unavailable, accepting reduced protection.
- **Fail closed:** Reject requests when the limiter is unavailable, accepting reduced availability.

The right choice depends on what the limit protects and the consequences of either outcome.

Redis brings value when the repeated work it removes justifies the complexity it adds. Choosing the data, defining acceptable staleness, and planning for failure are all part of that decision.

---

## Sources

1. Microsoft Learn. [Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside). Workload suitability and consistency considerations.
2. Redis. [Redis persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/). Snapshot and AOF durability trade-offs.
3. Redis. [Redis replication](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/). Asynchronous replication and acknowledged-write loss during failover.
4. AWS Builders’ Library. [Caching challenges and strategies](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/). Cache dependency, overload, and outage testing.
