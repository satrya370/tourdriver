# Arus

Independent tour-guide landing-page concept. Same homepage section coverage as Sawah/Batu, with an original navy/lime editorial design. Static HTML, Tailwind CSS v4, and a small vanilla-JS script; no added dependencies.

Pages:

| Page | Purpose |
|---|---|
| `index.html` | Homepage: hero, trust strip, how it works, featured routes, prices, a sample day, driver intro, testimonials, service area, FAQ, enquiry |
| `tours.html` | All four routes in detail, custom-route pitch, booking FAQ |
| `about.html` | Driver story, how I work, the vehicle, credentials |
| `itinerary.html` | Sample three-day plan with times, meeting point, included items, policies |

Build from the repository root:

```sh
npx @tailwindcss/cli -i templates/arus/src/input.css -o templates/arus/dist/output.css --minify
```

Run `npm run preview` and open `http://localhost:4173/templates/arus/`.

The enquiry form opens WhatsApp with the selected date, group size, and route. The contact number, business/person details, prices and testimonials are demonstration content. Replace them and the illustrative portrait before publishing. The vehicle image is a marked placeholder for the operator's own car photo. Remote Unsplash photos and Google Fonts require network access. The concept is marked noindex.
