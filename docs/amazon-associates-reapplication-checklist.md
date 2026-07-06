# Amazon Associates re-application checklist

Use this before reapplying Curated Cart to Amazon Associates.

## Must be true on the live site

- The Amazon disclosure is visible before or near affiliate/product links and in the sitewide footer.
- Every published product has an original title, an original 1-3 sentence description, a clear category, a working image URL, and a working product URL.
- No product card or guide displays a manual/fake price, fake star rating, fake review count, or copied Amazon bullet copy.
- Product images are either your own, properly licensed, or served from approved retailer/API sources you are allowed to use.
- Blog posts/guides are published, indexable, internally linked, and contain original commentary that helps readers choose.
- Categories are understandable to shoppers and have enough items to avoid empty/thin sections.
- Contact, privacy policy, and affiliate disclosure pages are live and linked from the footer.
- Amazon links can be retagged by changing `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG` / `AMAZON_ASSOCIATES_TAG` rather than manually editing every public card.

## Minimum content target before reapplying

Aim for at least:

- 10-15 published original guides or blog posts.
- 30-50 published product entries with original descriptions.
- 5-8 clear categories with multiple products each.
- A homepage that links to featured products, categories, and recent guides.

## Manual review steps

1. Visit the homepage, Top Picks, every category, every published guide, the disclosure page, privacy page, and contact page.
2. Click a sample of product buttons and confirm they open the intended retailer page in a new tab.
3. Confirm the disclosure is visible before shoppers encounter product links on product-heavy pages.
4. Search the site for `$`, `stars`, `reviews`, and copied manufacturer/Amazon phrasing before publishing new content.
5. Replace placeholder/sample Amazon URLs with real product URLs only after you are accepted or when you are allowed to use your new tracking ID.
6. Set the final Associates tag in production environment variables and verify rendered Amazon URLs include the new `tag` value.
