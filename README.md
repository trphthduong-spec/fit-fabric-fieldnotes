# Fit Fabric Fieldnotes

Please update the current component with the following modifications:

1. Add Sports Apparel Metrics to the "Write a Review" Form & Review Cards:

- Fit Assessment: Add a selection/slider (Too Small | True to Size | Too Large).

- Fabric Performance Ratings: Add quick ratings or tags for "Breathability", "Stretchability", and "Durability after washing".

- Buyer's Biometrics: Add optional text inputs for the buyer's Height (cm), Weight (kg), and Purchased Size (e.g., Size M) so future customers can easily compare.
- Material quality, color of the product judgement (good/bad, low/high quality)
- Shipper's attitude and service (friendly, professional, meticulous,...) (shipped quickly, product isn't damaged,..)

- Display these metrics clearly on each submitted review card and aggregate the Fit Assessment inside the Overall Rating Summary. However, only the RATINGS are compulsory for reviews, these options aren't optional. Reviewers can even just send a rating and no further comment.


2. Enhance the Advanced Features:

- Report to Admin: Keep the "Report" button. When clicked, it should open a clean modal with reasons (e.g., Spam, Fake review, Inappropriate language, etc other stuffs you can think of) and simulate sending this data to the Shop Admin system.

- Threaded Comments (Reply): Keep the reply function, but make sure that if a reply is made by the store management, it displays a highly visible and distinct "[Shop Admin]" badge next to the name.

- Image Attachment: Ensure the multiple image uploader (Images only, NO videos) works smoothly with thumbnail previews, and successfully renders the attached photos inside the new review card upon submission.

3. Aesthetic Adjustment:

- Refine the styling to give it a modern, clean, athletic e-commerce vibe while maintaining a clean neutral color palette (slate/gray tones) so it easily blends into our main product details page.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/73cf1e83-2ffe-42c5-a909-231086cb8cd8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
