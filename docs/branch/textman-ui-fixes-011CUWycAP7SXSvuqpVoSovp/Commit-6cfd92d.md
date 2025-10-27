Release textMan v2.1a.0 - Comprehensive audit and improvements
This is a major quality and performance update with extensive improvements
across HTML, CSS, and JavaScript files.

## HTML Improvements:
- Add skip-to-content link for accessibility
- Add proper ARIA labels and roles throughout
- Add PWA manifest.json support
- Improve modal accessibility with aria-modal and aria-labelledby
- Add resource hints (preconnect, dns-prefetch) for external resources
- Add aria-hidden to decorative icons
- Update title to v2.1a

## CSS Improvements:
- Add will-change properties for better animation performance
- Add CSS containment for improved rendering
- Optimize transitions to only animate specific properties
- Add larger touch targets for mobile (44px minimum)
- Improve sidebar float toggle sizes on mobile
- Better skip-to-content focus styles
- Performance optimizations for modals and sidebars

## JavaScript Improvements:
- Add comprehensive Utils object with:
  - debounce() for performance
  - sanitizeHTML() and escapeHTML() for XSS protection
  - checkStorageQuota() for storage management
  - formatBytes() for human-readable file sizes
  - validateFileSize() for file upload limits
- Add 10MB file size limit with validation
- Improve error handling in file import/drop operations
- Add try-catch blocks for file operations
- Escape user input in toast messages
- Update version to 2.1a.0
- Better error logging with console.error

## PWA Support:
- Add manifest.json with app configuration
- Add app icons and shortcuts
- Configure display mode as standalone
- Add theme colors

## Security Improvements:
- HTML sanitization to prevent XSS
- File size validation
- Better error handling
- Input escaping in notifications

## Performance Improvements:
- Debounce utility for input handling
- CSS containment for layout optimization
- Specific property transitions instead of 'all'
- Will-change hints for animations
- Storage quota checking

All tools and features tested and working correctly!

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
