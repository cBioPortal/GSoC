const MAX_PARAGRAPH_LENGTH = 300;
const MAX_ITEM_HEIGHT = 400; // Maximum height in pixels before truncating

// we have to consider the abreviated month names
const dateIdPattern = /^(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)-\d{1,2}-\d{4}/;

export default function parseNews(html: string) {
    const contentItems = $(html)
        .find('#docs-content')
        .children()
        .filter((i, el) => {
            // Match date IDs like "november-15-2025", "december-18-2024", etc.
            // Pattern: full month name, day (1-2 digits), and 4-digit year
            return dateIdPattern.test(el.id) || el.tagName === 'UL';
        });

    // Track the last seen date ID for UL elements that don't have their own ID
    let lastSeenDateId = '';

    contentItems.each((i, el) => {
        // Track date IDs as we encounter them
        if (dateIdPattern.test(el.id)) {
            lastSeenDateId = el.id;
        }

        // Set target="_blank" for all links
        $(el)
            .find('a')
            .attr('target', '_blank');

        // Check if this item has tables before removing them
        const hasTables = $(el).find('table').length > 0;

        // Remove or hide tables as they don't render well in the news feed
        $(el)
            .find('table')
            .remove();

        // Keep images but ensure they have proper styling for the narrow feed
        $(el)
            .find('img')
            .each((k, img) => {
                const $img = $(img);
                // Add responsive styling to images
                $img.css({
                    'max-width': '100%',
                    height: 'auto',
                    display: 'block',
                    margin: '10px 0',
                });
                // Remove the "image" alt text that doesn't add value
                if ($img.attr('alt') === 'image') {
                    $img.attr('alt', '');
                }
            });

        // Remove any element that only contains the word "image" (from alt text)
        // Check all common elements including figcaption which often contains "image" text
        $(el)
            .find(
                'p, div, span, li, h1, h2, h3, h4, h5, h6, figcaption, figure'
            )
            .each((k, elem) => {
                const $elem = $(elem);
                const text = $elem
                    .text()
                    .trim()
                    .toLowerCase();
                // Remove element if it only contains "image" text and no actual img tags
                // This handles standalone "image" text from markdown alt attributes and figcaptions
                if (text === 'image' && $elem.find('img').length === 0) {
                    $elem.remove();
                }
            });

        // Truncate long paragraphs to improve readability
        let wasTruncated = false;
        $(el)
            .find('p')
            .each((j, p) => {
                const $p = $(p);
                // Skip paragraphs that contain images
                if ($p.find('img').length > 0) {
                    return;
                }
                const text = $p.text();
                if (text.length > MAX_PARAGRAPH_LENGTH) {
                    // Truncate text content only, preserving simple HTML structure
                    const html = $p.html() || '';
                    if (html.length > MAX_PARAGRAPH_LENGTH) {
                        // Simple truncation - remove complex elements but preserve links
                        const truncated = text.substring(
                            0,
                            MAX_PARAGRAPH_LENGTH
                        );
                        const lastSpace = truncated.lastIndexOf(' ');
                        const finalText =
                            lastSpace > 0
                                ? truncated.substring(0, lastSpace)
                                : truncated;
                        $p.text(finalText + '...');
                        wasTruncated = true;
                    }
                }
            });

        // Add "Read more" only when content was actually removed or truncated
        const needsReadMore = hasTables || wasTruncated;

        // Check if element has a valid date ID (matches the pattern from filter)
        const hasValidDateId = /^(january|february|march|april|may|june|july|august|september|october|november|december)-\d{1,2}-\d{4}/.test(
            el.id
        );

        if (needsReadMore) {
            // Use element's own ID if it has one, otherwise use the last seen date ID
            const dateId = hasValidDateId ? el.id : lastSeenDateId;

            if (dateId) {
                const newsUrl = `https://docs.cbioportal.org/news/#${dateId}`;
                const readMoreLink = `<p style="margin: 10px 0 0 0; font-size: 12px;"><a href="${newsUrl}" target="_blank" style="color: #2986e2; text-decoration: none;">(Read more)</a></p>`;
                $(el).append(readMoreLink);
            }
        }
    });

    return $('<div/>')
        .append(contentItems)
        .html();
}
