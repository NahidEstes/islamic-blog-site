# Article-focused blog refactor

The existing Next.js/Mongoose project has been simplified in place.

Implemented: editorial homepage, bilingual article pages, real MongoDB search, category/tag directories, saved articles, likes, moderated comments, sourced quote management, image uploads to GridFS, article CRUD/status/SEO controls, simplified admin navigation, users, newsletter, contact messages, homepage and site settings.

Preserved: existing authentication approach, MongoDB collections, category/tag Taxonomy model, contact/newsletter records, old content data, and deployment structure.

Removed: public Quran/Hadith/prayer/course routes and feature-heavy homepage sections. Legacy database models remain for existing data.

See README.md for editing, safe seed behavior, validation commands, production setup, and scope limits. No deployment or database reset is part of this refactor.
